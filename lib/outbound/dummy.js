var _ = require('lodash');

var utils = require('../utils');
var DeprectationError = utils.DeprectationError;

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var DummyOutboundResource = DummyResource.extend(function(self, name, config) {
    /**class:DummyOutboundResource(name)

    Handles api requests to the outbound resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    :param DummyConfigResource config:
        A :class:`DummyConfigResource` to read configured endpoints from.
    */
    DummyResource.call(self, name);

    /**:DummyOutboundResource.store
    An array of the sent outbound message objects.
    */
    self.store = [];
    self.config = config;

    self.record_reply = function(cmd, group) {
        _.defaults(cmd, {continue_session: true});

        if (!('content' in cmd)) {
            throw new DummyResourceError(
                "'content' must be given in replies");
        }

        if (!_.isString(cmd.content) && !_.isNull(cmd)) {
            throw new DummyResourceError(
                "'content' must be a string or null");
        }

        if (!('in_reply_to' in cmd)) {
            throw new DummyResourceError(
                "'in_reply_to' must be given in replies");
        }

        if (!_.isBoolean(cmd.continue_session)) {
            throw new DummyResourceError(
                "'continue_session' must be either true or false if given");
        }

        var msg = {
            content: cmd.content,
            in_reply_to: cmd.in_reply_to,
            continue_session: cmd.continue_session
        };

        if (group) {
            msg.group = true;
        }

        self.store.push(msg);
    };

    self.configured_endpoints = function() {
        return self.config.app.endpoints || {};
    };

    self.handlers.reply_to = function(cmd) {
        self.record_reply(cmd);
        return {success: true};
    };

    self.handlers.reply_to_group = function(cmd) {
        self.record_reply(cmd, true);
        return {success: true};
    };

    self.handlers.send_to_tag = function(cmd) {
        throw new DeprectationError([
            "send_to_tag is no longer supported,",
            "please use send_to_endpoint instead"
        ].join(' '));
    };

    self.handlers.send_to_endpoint = function(cmd) {
        if (!_.isString(cmd.to_addr)) {
            throw new DummyResourceError(
                "'to_addr' needs to be a string");
        }

        if (!_.isString(cmd.content) && !_.isNull(cmd.content)) {
            throw new DummyResourceError(
                "'content' needs to be a string or null");
        }

        if (!_.isString(cmd.endpoint)) {
            throw new DummyResourceError(
                "'endpoint' needs to be a string");
        }

        if (!_.has(self.configured_endpoints(), cmd.endpoint)) {
            throw new DummyResourceError(
                "endpoint '" + cmd.endpoint + "' is not configured");
        }

        self.store.push({
            to_addr: cmd.to_addr,
            content: cmd.content,
            endpoint: cmd.endpoint
        });

        return {success: true};
    };
});


this.DummyOutboundResource = DummyOutboundResource;
