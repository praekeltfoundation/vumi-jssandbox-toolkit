var _ = require('lodash');
var assert = require("assert");

var vumigo = require("../lib");
var fixtures = vumigo.fixtures;
var test_utils = vumigo.test_utils;

var App = vumigo.App;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;

var InboundMessageEvent = vumigo.interaction_machine.InboundMessageEvent;
var UnknownCommandEvent = vumigo.interaction_machine.UnknownCommandEvent;
var ApiError = vumigo.interaction_machine.ApiError;


describe("InteractionMachine", function () {
    var im;
    var api;
    var msg;

    var app;
    var start_state;
    var end_state;

    beforeEach(function() {
        msg = fixtures.msg('2');
        app = new App('start');

        start_state = new FreeText('start', {
            question: test_utils.$('hello?'),
            next: 'end'
        });
        app.states.add(start_state);

        end_state = new EndState('end', {
            text: test_utils.$('goodbye')
        });
        app.states.add(end_state);

        return test_utils.make_im({
            app: app,
            msg: msg
        }).then(function(new_im) {
            im = new_im;
            api = im.api;
        });
    });

    describe(".setup", function() {
        beforeEach(function() {
            var p = test_utils.make_im({setup: false});
            return p.then(function(new_im) {
                im = new_im;
            });
        });

        it("should setup its sandbox config", function() {
            var p = im.sandbox_config.once.resolved('setup');
            return im.setup(msg).thenResolve(p);
        });

        it("should setup its config", function() {
            var p = im.config.do.once.resolved('setup');
            return im.setup(msg).thenResolve(p);
        });

        it("should setup its metric store", function() {
            var p = im.metrics.once.resolved('setup');
            return im.setup(msg).thenResolve(p);
        });

        it("should setup its contacts store", function() {
            var p = im.contacts.once.resolved('setup');
            return im.setup(msg).then(function() {
                assert(p.isFulfilled());
            });
        });

        it("should setup its app", function() {
            var p = im.app.once.resolved('setup');
            return im.setup(msg).thenResolve(p);
        });

        it("should emit a 'setup' event", function() {
            var p = im.once.resolved('setup');
            return im.setup(msg).thenResolve(p);
        });

        describe("if no user exists for the message address", function() {
            it("should create a new user", function() {
                msg.from_addr = '+27123456NEW';
                var p = im.user.once.resolved('user:new');
                return im.setup(msg).thenResolve(p);
            });
        });

        describe("if a user exists for the message address", function() {
            it("should load the user", function() {
                var p = im.user.once.resolved('user:load');
                return im.setup(msg).thenResolve(p);
            });
        });

        describe("if the restart option is true", function() {
            it("should reset the existing user", function() {
                return im.setup(msg).thenResolve(function() {
                    assert(!im.user.state.exists());
                });
            });
        });
    });

    describe(".attach", function() {
        beforeEach(function() {
            delete api.on_unknown_command;
            delete api.on_inbound_message;
            delete api.on_inbound_event;
        });

        describe("when api.on_unknown_command is invoked", function() {
            var cmd;

            beforeEach(function() {
                cmd = {bad: 'cmd'};
            });

            it("should emit an 'unknown_command' event", function() {
                im.attach();

                var p = im.once.resolved('unknown_command');
                api.on_unknown_command(cmd);
                return p;
            });

            it("should shutdown the im after event handling", function() {
                im.attach();

                var p = im.once.resolved('im:shutdown');
                api.on_unknown_command(cmd);
                return p;
            });

            it("should handle errors thrown by the event listeners",
            function() {
                im.attach();
                var error = new Error();

                im.on('unknown_command', function() { throw error; });
                var p = im.once.resolved('im:error');

                api.on_unknown_command(cmd);

                return p.then(function(event) {
                    assert.strictEqual(event.error, error);
                });
            });
        });

        describe("when api.on_inbound_event is invoked", function() {
            var cmd;

            beforeEach(function() {
                cmd = {
                    msg: {
                        user_message_id: '1',
                        event_type: 'ack'
                    }
                };
            });

            it("should emit an 'inbound_event' event", function() {
                im.attach();

                var p = im.once.resolved('inbound_event');
                api.on_inbound_event(cmd);
                return p;
            });

            it("should shutdown the im after event handling", function() {
                im.attach();

                var p = im.once.resolved('im:shutdown');
                api.on_inbound_event(cmd);
                return p;
            });

            it("should handle any errors thrown by the event listeners",
            function() {
                im.attach();
                var error = new Error();

                im.on('inbound_event', function() { throw error; });
                var p = im.once.resolved('im:error');

                api.on_inbound_event(cmd);

                return p.then(function(event) {
                    assert.strictEqual(event.error, error);
                });
            });
        });

        describe("when api.on_inbound_message is invoked", function() {
            var cmd;

            beforeEach(function() {
                cmd = {msg: msg};
            });

            it("should emit an 'inbound_message' event", function() {
                im.attach();
                var p = im.once.resolved('inbound_message');
                api.on_inbound_message(cmd);
                return p;
            });

            it("should shutdown the im after event handling", function() {
                im.attach();
                var p = im.once.resolved('im:shutdown');
                api.on_inbound_message(cmd);
                return p;
            });

            it("should handle any errors thrown by the event listeners",
            function() {
                im.attach();
                var error = new Error();
                var p = im.once.resolved('im:error');

                im.on('inbound_message', function() { throw error; });
                api.on_inbound_message(cmd);

                return p.then(function(event) {
                    assert.strictEqual(event.error, error);
                });
            });
        });
    });

    describe(".is_in_state", function() {
        describe("if no state is given", function() {
            it("should determine whether the im is in any state", function() {
                assert(!im.is_in_state());
                return im.switch_to_start_state().then(function() {
                    assert(im.is_in_state());
                });
            });
        });

        describe("if a state name is given", function() {
            it("should determine whether the im is in the given state",
            function() {
                assert(!im.is_in_state('start'));
                return im.switch_to_start_state().then(function() {
                    assert(im.is_in_state('start'));
                });
            });
        });
    });

    describe(".switch_to_user_state", function() {
        beforeEach(function() {
            return im.switch_to_start_state();
        });

        it("should switch to the current user state", function() {
            im.user.state.reset(end_state);
            assert(im.is_in_state('start'));

            return im.switch_to_user_state().then(function() {
                assert(im.is_in_state('end'));
            });
        });
    });

    describe(".switch_to_start_state", function() {
        beforeEach(function() {
            return im.switch_state('end', {}, {});
        });

        it("should switch to the start state", function() {
            assert(im.is_in_state('end'));

            return im.switch_to_start_state().then(function() {
                assert(im.is_in_state('start'));
            });
        });
    });

    describe(".switch_state", function() {
        beforeEach(function() {
            im.state = start_state;
        });

        it("should pass creator options to the state creator", function() {
            im.app.states.add('spam', function(name, opts) {
                assert.deepEqual(opts, {baz: 'qux'});
                return new EndState(name, {text: 'spam'});
            });

            return im.switch_state('spam', {}, {baz: 'qux'});
        });

        describe("if we are already in the requested state", function() {
            it("should not try switch state", function() {
                var exit = im.once.resolved('state:exit');
                var enter = im.once.resolved('state:enter');
                return im.switch_state('start', {}, {}).then(function() {
                    assert(!exit.isFulfilled());
                    assert(!enter.isFulfilled());
                });
            });
        });

        it("should allow state creators to delegate to other state creators",
        function() {
            im.app.states.add('foo', function() {
                return im.app.states.create('start');
            });

            return im.switch_state('foo').then(function() {
                assert.equal(im.state, start_state);
            });
        });

        it("should create the requested state", function() {
            return im.switch_state('end', {}, {}).then(function() {
                assert.equal(im.state, end_state);
            });
        });

        it("should setup the new state", function() {
            var p = end_state.once.resolved('setup');
            return im.switch_state('end', {}, {}).thenResolve(p);
        });

        it("should emit a 'state:exit' event for the old state",
        function() {
            var p = start_state.once.resolved('state:exit');
            return im.switch_state('end', {}, {}).thenResolve(p);
        });

        it("should set the user's state to the new state", function() {
            var p = start_state.once.resolved('state:exit');
            return im.switch_state('end', {}, {}).thenResolve(p);
        });

        it("should then emit an 'enter' event for the new state", function() {
            var p = end_state.once.resolved('state:enter');
            return im.switch_state('end', {}, {}).thenResolve(p);
        });

        it("should reset the user's state to the created state", function() {
            assert(!im.user.state.is('end'));
            return im.switch_state('end', {}, {baz: 'qux'}).then(function() {
                assert(im.user.state.is('end'));
                assert.deepEqual(im.user.state.creator_opts, {baz: 'qux'});
            });
        });
    });

    describe(".fetch_translation", function() {
        it("should construct a jed instance with the fetched language data",
        function() {
            return im.fetch_translation('jp').then(function(i18n) {
                assert.equal(i18n(test_utils.$('yes')), 'hai');
            });
        });
    });

    describe(".log", function() {
        it("should log the requested message", function() {
            assert(!_.contains(api.log.info, 'wah wah'));
            return im.log('wah wah').then(function() {
                assert(_.contains(api.log.info, 'wah wah'));
            });
        });
    });

    describe(".err", function() {
        it("should log the error", function() {
            assert(!_.contains(api.log.error, ':('));
            return im.err(new Error(':(')).then(function() {
                assert(_.contains(api.log.error, ':('));
            });
        });

        it("should terminate the sandbox", function() {
            assert.equal(api.done_calls, 0);
            return im.err(new Error(':(')).then(function() {
                assert.equal(api.done_calls, 1);
            });
        });
    });

    describe(".done", function() {
        it("should save the user", function() {
            var p = im.user.once.resolved('user:save');
            return im.done().thenResolve(p);
        });

        it("should terminate the sandbox", function() {
            assert.equal(api.done_calls, 0);
            return im.done().then(function() {
                assert.equal(api.done_calls, 1);
            });
        });
    });

    describe(".api_request", function() {
        it("should make a promise-based api request", function() {
            assert(!_.contains(api.log.info, 'arrg'));
            im.api_request('log.info', {msg: 'arrg'}).then(function() {
                assert(_.contains(api.log.info, 'arrg'));
            });
        });

        it("should reject the reply if the api gave a failure reply",
        function() {
            im.api.reply = function() {
                return {
                    success: false,
                    reason: 'No apparent reason'
                };
            };

            im.api_request('log.info', {msg: 'arrg'}).catch(function() {
                assert(e instanceof ApiError);
                assert.deepEqual(e.reply, {
                    success: false,
                    reason: 'No apparent reason'
                });
                assert.equal(e.message, 'No apparent reason');
            });
        });
    });

    describe(".reply", function() {
        it("should switch to the user's current state", function() {
            assert(!im.is_in_state());
            return im.reply(msg).then(function() {
                assert(im.is_in_state('start'));
            });
        });

        it("should use the state's display content in the reply", function() {
            return im.reply(msg).then(function() {
                var reply = api.outbound.store[0];
                assert.deepEqual(reply.content, 'hello?');
            });
        });

        describe("if the translate option is true", function() {
            beforeEach(function() {
                return im.user.set_lang('af');
            });

            it("should translate the state's display content in the reply",
            function() {
                return im.reply(msg, {translate: true}).then(function() {
                    var reply = api.outbound.store[0];
                    assert.deepEqual(reply.content, 'hallo?');
                });
            });
        });

        describe("if the state does not want to continue the session",
        function() {
            beforeEach(function() {
                im.user.state.reset(end_state);
            });

            it("should emit a 'session:close' event", function() {
                var p = im.once.resolved('session:close');
                return im.reply(msg).thenResolve(p);
            });

            it("should set the reply message to not continue the session",
            function() {
                return im.reply(msg).then(function() {
                    var reply = api.outbound.store[0];
                    assert.deepEqual(reply.continue_session, false);
                });
            });
        });

        describe("if the state does not want to send a reply", function() {
            beforeEach(function() {
                var state = new EndState('a_new_end', {
                    text: 'goodbye',
                    send_reply: false
                });
                im.app.states.add(state);
                im.user.state.reset(state);
            });

            it("should not send a reply", function() {
                return im.reply(msg).then(function() {
                    assert.equal(api.outbound.store.length, 0);
                });
            });
        });
    });

    describe(".emit", function() {
        describe(".state", function() {
            beforeEach(function() {
                return im.switch_to_start_state();
            });

            describe(".exit", function() {
                it("should emit an 'state:exit' event on the im", function() {
                    var p = im.once.resolved('state:exit');
                    return im.emit.state.exit().thenResolve(p);
                });

                it("should emit an 'state:exit' event on the current state",
                function() {
                    var p = im.state.once.resolved('state:exit');
                    return im.emit.state.exit().thenResolve(p);
                });

                describe("if the im is not in a state", function() {
                    beforeEach(function() {
                        im.state = null;
                    });

                    it("should not emit any 'exit' events", function() {
                        var p = im.once.resolved('state:exit');
                        return im.emit.state.exit().then(function() {
                            assert(!p.isFulfilled());
                        });
                    });
                });
            });

            describe(".enter", function() {
                it("should emit an 'state:enter' event on the im", function() {
                    var p = im.once.resolved('state:enter');
                    return im.emit.state.enter(end_state).thenResolve(p);
                });

                it("should emit an 'state:enter' event on the new state",
                function() {
                    var p = end_state.once.resolved('state:enter');
                    return im.emit.state.enter(end_state).thenResolve(p);
                });
            });
        });
    });

    describe("on 'unknown_command'", function() {
        it("should log the command", function() {
            assert(!_.contains(
                api.log.error, 'Received unknown command: {"bad":"cmd"}'));

            var e = new UnknownCommandEvent(im, {bad: 'cmd'});
            return im.emit(e).then(function() {
                assert(_.contains(
                    api.log.error, 'Received unknown command: {"bad":"cmd"}'));
            });
        });
    });
    
    describe("on 'inbound_message'", function() {
        var event;

        beforeEach(function() {
            event = new InboundMessageEvent(im, {msg: msg});
        });

        it("should set up the im", function() {
            var p = im.once.resolved('setup');
            return im.emit(event).thenResolve(p);
        });

        describe("if the message content is set to '!reset'", function() {
            beforeEach(function() {
                msg.content = '!reset';
            });

            it("should reset the message content to an empty string",
            function() {
                return im.emit(event).then(function() {
                    assert.strictEqual(im.msg.content, '');
                });
            });

            it("should reset the user", function() {
                var p = im.user.once.resolved('user:reset');
                return im.emit(event).thenResolve(p);
            });
        });

        describe("if the user is currently in a state", function() {
            it("should switch to the user's current state", function() {
                assert.strictEqual(im.state, null);
                return im.emit(event).then(function() {
                    assert.equal(im.state.name, im.user.state.name);
                });
            });
        });

        describe("if the user is not in a state", function() {
            beforeEach(function() {
                msg.from_addr = '+27123456NEW';
            });

            it("should switch to the start state", function() {
                assert.strictEqual(im.state, null);
                return im.emit(event).then(function() {
                    assert.equal(im.state.name, 'start');
                });
            });
        });

        describe("if the message's session event was 'close'", function() {
            beforeEach(function() {
                msg.session_event = 'close';
            });

            it("should emit a 'session:close' event", function() {
                var p = im.once.resolved('session:close');
                return im.emit(event).thenResolve(p);
            });
        });

        describe("if the message's session event was 'new'", function() {
            beforeEach(function() {
                msg.session_event = 'new';
            });

            it("should emit a 'session:new' event on the im", function() {
                var p = im.once.resolved('session:new');
                return im.emit(event).thenResolve(p);
            });

            it("should reply to the message", function() {
                return im.emit(event).then(function() {
                    assert.deepEqual(api.outbound.store, [{
                        content: 'hello?',
                        in_reply_to: '2',
                        continue_session: true,
                    }]);
                });
            });
        });

        describe("if the message's session event was not 'close' or 'new'",
        function() {
            beforeEach(function() {
                msg.session_event = 'resume';
            });

            it("should emit a 'session:resume' event on the im", function() {
                var p = im.once.resolved('session:resume');
                return im.emit(event).thenResolve(p);
            });

            it("should reply to the message", function() {
                return im.emit(event).then(function() {
                    assert.deepEqual(api.outbound.store, [{
                        content: 'goodbye',
                        in_reply_to: '2',
                        continue_session: false
                    }]);
                });
            });

            describe("if the message has truthy content", function() {
                it("should emit a 'state:input' event on the current state",
                function() {
                    var p = start_state.once.resolved('state:input');
                    return im.emit(event).thenResolve(p);
                });
            });
        });
    });
});
