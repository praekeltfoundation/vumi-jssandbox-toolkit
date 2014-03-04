var utils = require("../utils");
var Extendable = utils.Extendable;

var resources = require("./resources");
var kv = require("../kv/dummy");
var log = require("../log/dummy");
var config = require("../config/dummy");
var http = require("../http/dummy");
var contacts = require("../contacts/dummy");
var metrics = require("../metrics/dummy");
var outbound = require("../outbound/dummy");
var DummyResources = resources.DummyResources;
var DummyKvResource = kv.DummyKvResource;
var DummyLogResource = log.DummyLogResource;
var DummyConfigResource = config.DummyConfigResource;
var DummyHttpResource = http.DummyHttpResource;
var DummyContactsResource = contacts.DummyContactsResource;
var DummyGroupsResource = contacts.DummyGroupsResource;
var DummyMetricsResource = metrics.DummyMetricsResource;
var DummyOutboundResource = outbound.DummyOutboundResource;


var DummyApi = Extendable.extend(function(self, opts) {
    /**class:DummyApi(opts)

    A dummy of the sandbox's real api for use tests and demos.

    :param opts.http:
        Options to pass to the api's :class:`DummyHttpResource`. Optional.
    :param opts.kv:
        The data to initialise the kv store with.
        Options to pass to the api's :class:`DummyHttpResource`.
    :param opts.config:
        Config data given to the api's :class:`DummyConfigResource` to
        initialise the sandbox config with.
    */
    self.init = function(opts) {
        opts = opts || {};
        self.done_calls = 0;

        self.resources = new DummyResources();

        /**attribute:DummyApi.kv
        The api's :class:`DummyHttpResource`.
        */
        self.resources.add(new DummyKvResource('kv', opts.kv));

        /**attribute:DummyApi.log
        The api's :class:`DummyLogResource`.
        */
        self.resources.add(new DummyLogResource('log'));

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

        /**attribute:DummyApi.metrics
        The api's :class:`DummyMetricResource`.
        */
        self.resources.add(new DummyMetricsResource('metrics'));

        /**attribute:DummyApi.config
        The api's :class:`DummyConfigResource`.
        */
        self.resources.add(new DummyConfigResource('config', opts.config));

        /**attribute:DummyApi.outbound
        The api's :class:`DummyOutboundResource`.
        */
        self.resources.add(new DummyOutboundResource('outbound'));

        self.resources.attach(self);
    };

    self.request = function(cmd_name, cmd_data, reply) {
        var cmd = self.populate_command(cmd_name, cmd_data);
        return self.resources.handle(cmd).done(reply);
    };

    // original api

    self.populate_command = function(cmd_name, cmd) {
        cmd.cmd = cmd_name;
        return cmd;
    };

    self.log_info = function(msg, reply) {
        self.request('log.info', {msg: msg}, reply);
    };

    self.done = function() {
        self.done_calls += 1;
    };

    self.init(opts);
});


this.DummyApi = DummyApi;
