var fs = require("fs");
var Q = require("q");


function DummyApiError(msg) {
    var self = this;

    self.toString = function () {
        return "<DummyApiError " + self.msg + ">";
    };
}


function DummyApi() {
    var self = this;

    // test hooks

    self.reset = function() {
        // set self.async to true to make everything asynchronous
        self.async = false;
        self.pending_async = 0;
        self.kv_store = {};
        self.config_store = {};
        self.contact_store = {};
        self.metrics = {};
        self.http_calls = {
            'POST': {},
            'PUT': {},
            'HEAD': {},
            'DELETE': {},
            'GET': {}
        };
        self.outbound_sends = [];
        self.logs = [];
        self.request_calls = [];
        self.waiting_replies = [];
        self.done_calls = 0;
    };
    self.reset();

    self.reset_im = function() {
        self.im.user = null;
        self.im.i18n = null;
        self.im.i18n_lang = null;
        self.im.current_state = null;
    };

    self.add_reply = function(reply) {
        self.waiting_replies.push(reply);
    };

    self.load_http_fixture = function(filename) {
        var data = fs.readFileSync(filename);
        var fixture = JSON.parse(data);
        self.add_http_fixture(fixture);
    };

    self._format_http_request_data = function(content_type, data) {
        // convert a JSON fixture data into the required
        // content type.
        if (content_type == "application/json")
            return JSON.stringify(data);
        return data;
    };

    self._order_json_data = function(data) {
        // return JSON data with consistent key ordering
        // FIXME: This assumes the JSON data is a JS object
        var json = JSON.parse(data);
        var keys = Object.keys(json).sort();
        var frags = keys.map(function (k) {
            return '"' + k + '":' + JSON.stringify(json[k]);
        });
        data = "{" + frags.join(",") + "}";
        return data;
    };

    self._http_request_key = function(method, url, content_type, data) {
        if (content_type == "application/json") {
            data = self._order_json_data(data);
        }
        return url + "|" + content_type + "|" + data;
    };

    self.add_http_fixture = function(fixture) {
        var method_key = 'http_' + fixture.method.toLowerCase();
        if (typeof fixture.data != "undefined") {
            var content_type = fixture.content_type || "application/json";
            var data = self._format_http_request_data(content_type, fixture.data);
            var key = self._http_request_key(fixture.method, fixture.url, content_type, data);
            self.http_calls[fixture.method][key] = JSON.stringify(fixture.body);
        } else {
            self.http_calls[fixture.method][fixture.url] = JSON.stringify(fixture.body);
        }
    };

    self._generate_key = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                /[xy]/g,
                function(c) {
                    var r = Math.floor(Math.random() * 16);
                    var v = c == 'x' ? r : (r & (0x3 | 0x8));
                    return v.toString(16);
                }
        );
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
                                delivery_class + " with address " + addr);
    };

    self.find_contact = function(delivery_class, addr) {
        var field_pair = self._contact_field_for_addr(delivery_class, addr);
        var field = field_pair[0];
        var value = field_pair[1];
        var contact;
        for (var k in self.contact_store) {
            contact = self.contact_store[k];
            if (contact[field] === value) {
                return contact;
            }
        }
        return null;
    };

    self.add_contact = function(contact) {
        var set_default = function(name, value) {
            contact[name] = ((typeof contact[name] !== 'undefined') ?
                             contact[name] : value);
        };

        set_default('user_account', self._generate_key());
        set_default('key', self._generate_key());
        set_default('msisdn', 'unknown');

        var d = new Date();
        var now = d.toISOString().replace('T', ' ').replace('Z', '');
        set_default('created_at', now);

        set_default('name', null);
        set_default('surname', null);
        set_default('email_address', null);
        set_default('dob', null);
        set_default('twitter_handle', null);
        set_default('facebook_id', null);
        set_default('bbm_pin', null);
        set_default('gtalk_id', null);

        set_default('groups', []);

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
        var d = new Q.defer();
        var check = function() {
            if (self.pending_async === 0) {
                d.resolve(null);
            }
            else {
                setImmediate(check);
            }
        };
        setImmediate(check);
        return d.promise;
    };

    self._dispatch_command = function(cmd, reply) {
        var handler_name = ("_handle_" +
                            cmd.cmd.replace('.', '_').replace('-', '_'));
        var handler = self[handler_name];
        if (!handler) {
            throw new DummyApiError("Unknown command " + cmd.cmd);
        }
        var do_reply;
        if (self.async) {
            do_reply = function(cmd) {
                // Using setImmediate to call the reply makes replies
                // effectively async but still deterministicly ordered.
                // Incrementing and then decrementing self.pending_async
                // allows self.pending_calls_complete to detect when all
                // replies have been processed.
                self.pending_async += 1;
                setImmediate(function() {
                    reply(cmd); self.pending_async -= 1;
                });
            };
        }
        else {
            do_reply = reply;
        }
        if (handler) {
            handler.call(self, cmd, do_reply);
        }
    };

    self._populate_reply = function(orig_cmd, reply) {
        reply.cmd = orig_cmd.cmd;
        return reply;
    };

    self._reply_fail = function(orig_cmd, reply, reason) {
        var reply_cmd = self._populate_reply(orig_cmd, {
            success: false,
            reason: reason
        });
        reply(reply_cmd);
    };

    self._reply_success = function(orig_cmd, reply, reply_cmd) {
        reply_cmd.success = true;
        reply_cmd = self._populate_reply(orig_cmd, reply_cmd);
        reply(reply_cmd);
    };

    // kv resource

    self._handle_kv_get = function(cmd, reply) {
        var value = self.kv_store[cmd.key];
        value = typeof value === 'undefined' ? null : value;
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
    };

    self._handle_kv_set = function(cmd, reply) {
        self.kv_store[cmd.key] = cmd.value;
        reply(self._populate_reply(cmd, {
            success: true
        }));
    };

    self._handle_kv_incr = function(cmd, reply) {
        var orig_value = self.kv_store[cmd.key];
        orig_value = (typeof orig_value == 'undefined') ? 0 : orig_value;
        orig_value = Number(orig_value);
        var amount = cmd.amount;
        amount = (typeof amount == 'undefied') ? 1 : amount;
        self.kv_store[cmd.key] = orig_value + amount;
        reply(self._populate_reply(cmd, {
            success: true,
            value: self.kv_store[cmd.key]
        }));
    };

    // config resource

    self._handle_config_get = function(cmd, reply) {
        var value = self.config_store[cmd.key];
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
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

    self._handle_metrics_fire = function(cmd, reply) {
        var success = self._record_metric(cmd.store, cmd.metric, cmd.value,
                                          cmd.agg);
        reply(self._populate_reply(cmd, {
            success: success
        }));
    };

    // http resource

    self._handle_http_method = function(method, key, cmd, reply) {
        var store = self.http_calls[method] || {};
        var reply_data = {};
        var data = store[key];
        if (typeof data != 'undefined') {
            reply_data.success = true;
            reply_data.body = data;
            reply_data.code = 200;
        }
        else {
            reply_data.success = false;
            reply_data.reason = method + " from unknown key: " + key;
            console.log(reply_data.reason);
        }
        reply(self._populate_reply(cmd, reply_data));
    };

    self._handle_http_get = function(cmd, reply) {
        self._handle_http_method("GET", cmd.url, cmd, reply);
    };

    self._handle_http_post = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('POST', cmd.url, content_type, cmd.data);
        self._handle_http_method("POST", key, cmd, reply);
    };

    self._handle_http_put = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('PUT', cmd.url, content_type, cmd.data);
        self._handle_http_method("PUT", key, cmd, reply);
    };

    self._handle_http_delete = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('DELETE', cmd.url, content_type);
        self._handle_http_method("DELETE", key, cmd, reply);
    };

    self._handle_http_head = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('HEAD', cmd.url, content_type);
        self._handle_http_method("HEAD", key, cmd, reply);
    };

    // contacts resource

    self._handle_contacts_get = function(cmd, reply) {
        var contact = self.find_contact(cmd.delivery_class, cmd.addr);
        if (contact === null) {
            self._reply_fail(cmd, reply, "Contact not found");
            return;
        }
        self._reply_success(cmd, reply, {
            contact: contact
        });
    };

    self._handle_contacts_get_or_create = function(cmd, reply) {
        var contact = self.find_contact(cmd.delivery_class, cmd.addr);
        if (contact === null) {
            var field_pair = self._contact_field_for_addr(cmd.delivery_class, cmd.addr);
            var field = field_pair[0], value = field_pair[1];
            contact = {};
            contact[field] = value;
            self._reply_success(cmd, reply, {
                created: true,
                contact: self.add_contact(contact)
            });
            return;
        }
        self._reply_success(cmd, reply, {
            created: false,
            contact: contact
        });
    };

    self._handle_contacts_update = function(cmd, reply) {
        var contact = self.contact_store[cmd.key];
        if (!contact) {
            self._reply_fail(cmd, reply, "Contact not found");
            return;
        }
        for (var k in cmd.fields) {
            contact[k] = cmd.fields[k];
        }
        self._reply_success(cmd, reply, {contact: contact});
    };

    self._handle_contacts_update_extras = function(cmd, reply) {
        var contact = self.contact_store[cmd.key];
        if (!contact) {
            self._reply_fail(cmd, reply, "Contact not found");
            return;
        }
        self.update_contact_extras(contact, cmd.fields);
        self._reply_success(cmd, reply, {contact: contact});
    };

    self._handle_contacts_update_subscriptions = function(cmd, reply) {
        var contact = self.contact_store[cmd.key];
        if (!contact) {
            self._reply_fail(cmd, reply, "Contact not found");
            return;
        }
        self.update_contact_subscriptions(contact, cmd.fields);
        self._reply_success(cmd, reply, {contact: contact});
    };

    self._handle_contacts_new = function(cmd, reply) {
        var new_contact = cmd.contact;
        var contact = self.add_contact(new_contact);
        self._reply_success(cmd, reply, {contact: contact});
    };

    self._handle_contacts_save = function(cmd, reply) {
        var contact = cmd.contact || null;
        if (!self.contact_store[contact.key]) {
            self._reply_fail(cmd, reply, "Contact not found");
            return;
        }
        self.contact_store[contact.key] = contact;
        self._reply_success(cmd, reply, {contact: contact});
    };

    // outbound resource

    self._handle_outbound_reply_to = function(cmd, reply) {
         self.request_calls.push(cmd);
         reply(self.waiting_replies.shift());
    };

    self._handle_outbound_send_to_tag = function(cmd, reply) {
        self.outbound_sends.push(cmd);
        reply(self._populate_reply(cmd, {success: true}));
    };

    // logging resource

    self._handle_log_info = function(cmd, reply) {
        self.logs.push(cmd.msg);
        reply(self._populate_reply(cmd, {success: true}));
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
        self._dispatch_command(cmd, reply);
    };

    self.log_info = function(msg) {
        self.logs.push(msg);
    };

    self.done = function() {
        self.done_calls += 1;
    };
}

// exports
this.DummyApi = DummyApi;
