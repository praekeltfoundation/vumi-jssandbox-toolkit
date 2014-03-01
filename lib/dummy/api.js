var Q = require("q");
var _ = require("lodash");

var utils = require("../utils");
var BaseError = utils.BaseError;
var Extendable = utils.Extendable;

var resources = require("./resources");
var http = require("../http/dummy");
var contacts = require("../contacts/dummy");
var DummyResources = resources.DummyResources;
var DummyHttpResource = http.DummyHttpResource;
var DummyContactsResource = contacts.DummyContactsResource;
var DummyGroupsResource = contacts.DummyGroupsResource;


var DummyApiError = BaseError.extend(function(self, message) {
    self.name = "DummyApiError";
    self.message = message;
});


var DummyApi = Extendable.extend(function(self, opts) {
    /**class:DummyApi(opts)

    A dummy of the sandbox's real api for use tests and demos.

    :param opts.http:
        Options to pass to the api's :class:`DummyHttpResource`.
    */
    self.init = function(opts) {
        opts = opts || {};

        // An array of promises, each for a reply to an api request
        self.promised_replies = [];

        self.kv_store = {};
        self.config_store = {};
        self.contact_store = {};

        // stores primed search results
        self.contact_search_store = {};

        self.metrics = {};

        self.outbound_sends = [];
        self.logs = [];
        self.request_calls = [];
        self.waiting_replies = [];
        self.done_calls = 0;

        self.resources = new DummyResources();

        /**attribute:DummyApi.http
        The api's :class:`DummyHttpResource`.
        */
        self.resources.add(new DummyHttpResource('http', opts.http));

        /**attribute:DummyApi.contacts
        The api's :class:`DummyContactsResource`.
        */
        var contacts = new DummyContactsResource('contacts');
        self.resources.add(contacts);

        /**attribute:DummyApi.groups
        The api's :class:`DummyGroupsResource`.
        */
        self.resources.add(new DummyGroupsResource('groups', contacts));

        self.resources.attach(self);
    };
    self.init(opts);

    self.in_logs = function(msg) {
        return self.logs.indexOf(msg) > -1;
    };

    self.add_reply = function(reply) {
        self.waiting_replies.push(reply);
    };

    self._contact_field_for_addr = function(delivery_class, addr) {
        if (delivery_class === 'sms' || delivery_class === 'ussd') {
            return ['msisdn', '+' + addr.replace('+', '')];
        }
        if (delivery_class === 'gtalk') {
            return ['gtalk_id', addr.split('/')[0]];
        }
        if (delivery_class === 'twitter') {
            return ['twitter_handle', addr];
        }
        throw new DummyApiError("Unsupported delivery class (got: " +
                                delivery_class + " with address " + addr + ")");
    };

    self.add_contact = function(contact) {
        _.defaults(contact, {
            created_at: utils.now(),
            user_account: utils.uuid(),
            key: utils.uuid(),
            msisdn: 'unknown',
            name: null,
            surname: null,
            email_address: null,
            dob: null,
            twitter_handle: null,
            facebook_id: null,
            bbm_pin: null,
            gtalk_id: null,
            groups: []
        });

        self.contact_store[contact.key] = contact;
        return contact;
    };

    self.update_contact_extras = function(contact, extras) {
        for (var k in extras) {
            contact['extras-' + k] = extras[k];
        }
    };

    self.update_contact_subscriptions = function(contact, subs) {
        for (var k in subs) {
            contact['subscription-' + k] = subs[k];
        }
    };

    self.pending_calls_complete = function() {
        return Q.all(self.promised_replies);
    };

    self._dispatch_command = function(cmd) {
        var handler_name = ("_handle_" +
                            cmd.cmd.replace('.', '_').replace('-', '_'));
        var handler = self[handler_name];

        if (!handler) {
            throw new DummyApiError("Unknown command " + cmd.cmd);
        }

        var p = Q(handler.call(self, cmd));
        var d = Q.defer();

        p.then(function(reply) {
            // Using setImmediate makes replies effectively async but still
            // deterministicly ordered.
            setImmediate(function() {
                d.resolve(reply);
            });
        });

        self.promised_replies.push(d.promise);
        return d.promise;
    };

    self._populate_reply = function(orig_cmd, reply) {
        reply.cmd = orig_cmd.cmd;
        return reply;
    };

    self._reply_fail = function(orig_cmd, reason) {
        return self._populate_reply(orig_cmd, {
            success: false,
            reason: reason
        });
    };

    self._reply_success = function(orig_cmd, reply_cmd) {
        reply_cmd = reply_cmd || {};
        reply_cmd.success = true;
        return self._populate_reply(orig_cmd, reply_cmd);
    };

    // kv resource

    self._handle_kv_get = function(cmd) {
        var value = self.kv_store[cmd.key];
        value = typeof value === 'undefined' ? null : value;
        return self._reply_success(cmd, {value: value});
    };

    self._handle_kv_set = function(cmd) {
        self.kv_store[cmd.key] = cmd.value;
        return self._reply_success(cmd);
    };

    self._handle_kv_incr = function(cmd) {
        var orig_value = self.kv_store[cmd.key];
        orig_value = (typeof orig_value == 'undefined') ? 0 : orig_value;
        orig_value = Number(orig_value);

        var amount = cmd.amount;
        amount = (typeof amount == 'undefined') ? 1 : amount;

        self.kv_store[cmd.key] = orig_value + amount;
        return self._reply_success(cmd, {value: self.kv_store[cmd.key]});
    };

    // config resource

    self._handle_config_get = function(cmd) {
        var value = self.config_store[cmd.key];
        return self._reply_success(cmd, {value: value});
    };

    // metrics resource

    self._record_metric = function (store_name, metric_name, value, agg) {
        var store = self.metrics[store_name];
        if (typeof store == 'undefined') {
            self.metrics[store_name] = store = {};
        }
        var metric = store[metric_name];
        if (typeof metric == 'undefined') {
            store[metric_name] = metric = {'agg': agg, values: []};
        }
        if (metric.agg != agg) return false;
        metric.values.push(value);
        return true;
    };

    self._handle_metrics_fire = function(cmd) {
        self._record_metric(cmd.store, cmd.metric, cmd.value, cmd.agg);
        return self._reply_success(cmd);
    };

    // outbound resource

    self._handle_outbound_reply_to = function(cmd) {
        self.request_calls.push(cmd);
        return self.waiting_replies.shift();
    };

    self._handle_outbound_send_to_tag = function(cmd) {
        self.outbound_sends.push(cmd);
        return self._reply_success(cmd);
    };

    // logging resource

    self._handle_log_info = function(cmd) {
        self.logs.push(cmd.msg);
        return self._reply_success(cmd);
    };

    // NOTE:    Currently we're collecting all log types in `self.logs`
    //          I'm not sure how to change that without introducing
    //          backwards incompatible changes.
    self._handle_log_debug = self._handle_log_info;
    self._handle_log_warning = self._handle_log_info;
    self._handle_log_error = self._handle_log_info;
    self._handle_log_critical = self._handle_log_info;

    // original api

    self.populate_command = function(cmd_name, cmd) {
        cmd.cmd = cmd_name;
        return cmd;
    };

    self.request = function(cmd_name, cmd_data, reply) {
        var cmd = self.populate_command(cmd_name, cmd_data);
        self.resources.has_resource_for(cmd)
            ? self.resources.handle(cmd).done(reply)
            : self._dispatch_command(cmd).done(reply);
    };

    self.log_info = function(msg) {
        self.logs.push(msg);
    };

    self.done = function() {
        self.done_calls += 1;
    };
});


this.DummyApi = DummyApi;
