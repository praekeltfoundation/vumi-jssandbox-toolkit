var _ = require('lodash');

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var DummyOutboundResource = DummyResource.extend(function(self, name) {
    /**class:DummyOutboundResource(name)
    
    Handles api requests to the outbound resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    */
    DummyResource.call(self, name);

    /**:DummyOutboundResource.store
    An array of the sent outbound message objects.
    */
    self.store = [];

    self.handlers.reply_to = function(cmd) {
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

        self.store.push({
            content: cmd.content,
            in_reply_to: cmd.in_reply_to,
            continue_session: cmd.continue_session
        });
        
        return {success: true};
    };

    self.handlers.reply_to_group = function(cmd) {
        return self.handlers.reply_to(cmd);
    };

    self.handlers.send_to_tag = function(cmd) {
        if (!_.isString(cmd.to_addr)) {
            throw new DummyResourceError("'to_addr' needs to be a string");
        }

        if (!_.isString(cmd.content)) {
            throw new DummyResourceError("'content' needs to be a string");
        }

        if (!_.isString(cmd.tagpool)) {
            throw new DummyResourceError("'tagpool' needs to be a string");
        }

        if (!_.isString(cmd.tag)) {
            throw new DummyResourceError("'tag' needs to be a string");
        }

        self.store.push({
            to_addr: cmd.to_addr,
            content: cmd.content,
            endpoint: [cmd.tagpool, cmd.tag].join(':')
        });

        return {success: true};
    };

    self.handlers.send_to_endpoint = function(cmd) {
        if (!_.isString(cmd.to_addr)) {
            throw new DummyResourceError("'to_addr' needs to be a string");
        }

        if (!_.isString(cmd.content)) {
            throw new DummyResourceError("'content' needs to be a string");
        }

        if (!_.isString(cmd.endpoint)) {
            throw new DummyResourceError("'endpoint' needs to be a string");
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
