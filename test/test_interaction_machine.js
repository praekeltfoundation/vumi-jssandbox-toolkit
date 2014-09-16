var _ = require('lodash');
var assert = require('assert');

var vumigo = require('../lib');
var fixtures = vumigo.fixtures;
var test_utils = vumigo.test_utils;

var App = vumigo.App;
var AppTester = vumigo.AppTester;

var State = vumigo.states.State;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;

var InboundMessageEvent = vumigo.interaction_machine.InboundMessageEvent;
var UnknownCommandEvent = vumigo.interaction_machine.UnknownCommandEvent;
var ApiError = vumigo.interaction_machine.ApiError;


describe("interaction_machine", function() {
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

            it("should setup its outbound helper", function() {
                var p = im.outbound.once.resolved('setup');
                return im.setup(msg).then(function() {
                    assert(p.isFulfilled());
                });
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

            it("should emit the user's creation event", function() {
                var p = im.user.once.resolved('user:load');
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

        describe(".teardown", function() {
            it("should remove its event listeners", function() {
                im.on('foo', function() {});
                im.on('teardown', function() {});
                assert.equal(im.listeners('foo').length, 1);
                assert.equal(im.listeners('teardown').length, 1);

                return im.teardown().then(function() {
                    assert.equal(im.listeners('foo').length, 0);
                    assert.equal(im.listeners('teardown').length, 0);
                });
            });

            it("should teardown its app", function(done) {
                app.on('teardown', function() { done(); });
                im.teardown();
            });

            it("should emit a 'teardown' event", function(done) {
                im.on('teardown', function() { done(); });
                im.teardown();
            });
        });

        describe(".attach", function() {
            beforeEach(function() {
                delete api.on_unknown_command;
                delete api.on_inbound_message;
                delete api.on_inbound_event;
                delete app.im;
            });

            it("should attach the im to the app", function() {
                im.attach();
                assert.strictEqual(im, app.im);
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

        describe(".set_state", function() {
            it("should set the given state as the user's state", function() {
                var s = new State('foo');
                im.set_state(s);
                assert(im.user.state.is(s));
            });

            it("should set the given state as the im's state", function() {
                var s = new State('foo');
                im.set_state(s);
                assert.strictEqual(im.state, s);
            });
        });

        describe(".create_state", function() {
            it("should create the state from a state name", function() {
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.create_state('foo')
                    .then(function(state) {
                        assert.strictEqual(state, expected);
                    });
            });

            it("should create the state from state data", function() {
                im.app.states.add('foo', function(name, opts) {
                    var s = new State('foo');
                    s.creator_opts = opts;
                    return s;
                });

                return im.create_state({
                        name: 'foo',
                        metadata: {bar: 'baz'},
                        creator_opts: {quux: 'corge'}
                    })
                    .then(function(state) {
                        assert.equal(state.name, 'foo');
                        assert.deepEqual(state.metadata, {bar: 'baz'});
                        assert.deepEqual(state.creator_opts, {quux: 'corge'});
                    });
            });
        });

        describe(".set_new_state", function() {
            it("should create the given state as the current state", function() {
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.set_new_state('foo')
                    .then(function(state) {
                        assert.strictEqual(im.state, expected);
                    });
            });
        });

        describe(".resume_state", function() {
            it("should set the given state as the current state", function() {
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.resume_state('foo')
                    .then(function(state) {
                        assert.strictEqual(im.state, expected);
                    });
            });

            it("should emit a 'state:resume' event for the dest state",
            function() {
                var p = im.once.resolved('state:resume');
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.resume_state('foo')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.strictEqual(e.state, expected);
                    });
            });
        });

        describe(".enter_state", function() {
            it("should set the given state as the current state", function() {
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.enter_state('foo')
                    .then(function(state) {
                        assert.strictEqual(im.state, expected);
                    });
            });

            it("should emit a 'state:enter' event for the dest state",
            function() {
                var p = im.once.resolved('state:enter');
                var expected = new State('foo');
                im.app.states.add(expected);

                return im.enter_state('foo')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.strictEqual(e.state, expected);
                    });
            });
        });

        describe(".exit_state", function() {
            it("should act as a noop if there is no current state", function() {
                assert.strictEqual(im.state, null);

                return im.exit_state()
                    .then(function() {
                        assert.strictEqual(im.state, null);
                    });
            });

            it("should unset the current state", function() {
                return im.resume_state('start')
                    .then(function() {
                        return im.exit_state();
                    })
                    .then(function() {
                        assert.strictEqual(im.state, null);
                    });
            });

            it("should emit a 'state:exit' event for the dest state",
            function() {
                return im.resume_state('start')
                    .then(function() {
                        var p = im.once.resolved('state:exit');
                        return im.exit_state().thenResolve(p);
                    })
                    .then(function(e) {
                        assert.strictEqual(e.state, start_state);
                    });
            });
        });

        describe(".switch_state", function() {
            beforeEach(function() {
                return im.resume_state('start');
            });

            it("should not switch states if the src and dest are the same",
            function() {
                return im.switch_state('start')
                    .then(function() {
                        assert.strictEqual(im.state, start_state);
                    });
            });

            it("should not switch states if the dest does not exist",
            function() {
                return im.switch_state('i-do-not-exist')
                    .then(function() {
                        assert.strictEqual(im.state, start_state);
                    });
            });

            it("should exit the current state", function() {
                var p = im.once.resolved('state:exit');

                return im.switch_state('end')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.strictEqual(e.state, start_state);
                    });
            });

            it("should enter the dest state", function() {
                var p = im.once.resolved('state:enter');
                var dest = new State('dest');
                im.app.states.add(dest);

                return im.switch_state('dest')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.strictEqual(e.state, dest);
                    });
            });
        });

        describe(".fetch_translation", function() {
            it("should construct a translator with the fetched language data",
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
            it("should save the user", function(done) {
                im.user.on('user:save', function() { done(); });
                im.done();
            });

            it("should tear down the interaction machine", function(done) {
                im.on('teardown', function() { done(); });
                im.done();
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
            beforeEach(function() {
                return im.resume_state('start')
                    .then(function() {
                        im.next_state.reset('end');
                    });
            });

            it("should switch to the user's next state", function() {
                assert.strictEqual(im.state.name, 'start');

                return im.reply(msg).then(function() {
                    assert.equal(im.state.name, 'end');
                });
            });

            it("should use the state's display content in the reply",
            function() {
                return im.reply(msg).then(function() {
                    var reply = api.outbound.store[0];
                    assert.deepEqual(reply.content, 'goodbye');
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
                        assert.deepEqual(reply.content, 'totsiens');
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
                        assert(!reply.continue_session);
                    });
                });

                it("should set the user to not be in a session", function() {
                    im.user.in_session = true;

                    return im.reply(msg).then(function() {
                        assert(!im.user.in_session);
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

                    return im.resume_state('start')
                        .then(function() {
                            im.next_state.reset('a_new_end');
                        });
                });

                it("should not send a reply", function() {
                    return im.reply(msg).then(function() {
                        assert.equal(api.outbound.store.length, 0);
                    });
                });
            });
        });

        describe(".emit.state.exit", function() {
            it("should emit a 'state:exit' event on the im", function() {
                var state = new State('foo');
                var p = im.once.resolved('state:exit');

                return im.emit.state.exit(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });

            it("should emit a 'state:exit' event on the current state",
            function() {
                var state = new State('foo');
                var p = state.once.resolved('state:exit');

                return im.emit.state.exit(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });
        });

        describe(".emit.state.enter", function() {
            it("should emit n 'state:enter' event on the im",
            function() {
                var state = new State('foo');
                var p = im.once.resolved('state:enter');

                return im.emit.state.enter(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });

            it("should emit a 'state:enter' event on the new state",
            function() {
                var state = new State('foo');
                var p = state.once.resolved('state:enter');

                return im.emit.state.enter(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });
        });

        describe(".emit.state.resume", function() {
            it("should emit a 'state:resume' event on the im",
            function() {
                var state = new State('foo');
                var p = im.once.resolved('state:resume');

                return im.emit.state.resume(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });

            it("should emit an 'state:resume' event on the new state",
            function() {
                var state = new State('foo');
                var p = state.once.resolved('state:resume');

                return im.emit.state.resume(state)
                    .then(function() {
                        assert(p.isFulfilled());
                    });
            });
        });

        describe("on 'unknown_command'", function() {
            it("should log the command", function() {
                assert(!_.contains(
                    api.log.error,
                    'Received unknown command: {"bad":"cmd"}'));

                var e = new UnknownCommandEvent(im, {bad: 'cmd'});
                return im.emit(e).then(function() {
                    assert(_.contains(
                        api.log.error,
                        'Received unknown command: {"bad":"cmd"}')); });
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

            describe("if the user is not in a session", function() {
                it("should use session start for non-session-based messages",
                function() {
                    msg.session_event = null;
                    var p = im.once.resolved('session:new');

                    return im.emit(event).then(function() {
                        assert(p.isFulfilled());
                    });
                });

                it("should set the user to be in a session", function() {
                    assert(!im.user.in_session);

                    return im.emit(event).then(function() {
                        assert(im.user.in_session);
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

                it("should emit a 'session:resume' event on the im",
                function() {
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

        it("should emit state lifecycle events sensibly", function() {
            var app = new App('a');

            var events = [];
            function push(e) {
                events.push({
                    event: e.name,
                    state: e.state.name,
                    message: app.im.msg.content
                });
            }

            app.events = {
                'im state:enter': push,
                'im state:resume': push,
                'im state:exit': push
            };

            app.states.add(new FreeText('a', {
                question: 'hello?',
                next: 'b'
            }));

            app.states.add(new FreeText('b', {
                question: 'you are in the middle, say something',
                next: 'c'
            }));

            app.states.add(new EndState('c', {
                text: 'bye',
                next: 'a'
            }));

            return new AppTester(app)
                .inputs(
                  null, 'hi', 'foo',
                  null, 'hi again', 'bar',
                  null)
                .check(function() {
                    assert.deepEqual(events, [{
                        state: 'a',
                        message: null,
                        event: 'state:enter'
                    }, {
                        state: 'a',
                        message: 'hi',
                        event: 'state:resume'
                    }, {
                        state: 'a',
                        message: 'hi',
                        event: 'state:exit'
                    }, {
                        state: 'b',
                        message: 'hi',
                        event: 'state:enter'
                    }, {
                        state: 'b',
                        message: 'foo',
                        event: 'state:resume'
                    }, {
                        state: 'b',
                        message: 'foo',
                        event: 'state:exit'
                    }, {
                        state: 'c',
                        message: 'foo',
                        event: 'state:enter'
                    }, {
                        state: 'c',
                        message: null,
                        event: 'state:resume'
                    }, {
                        state: 'c',
                        message: null,
                        event: 'state:exit'
                    }, {
                        state: 'a',
                        message: null,
                        event: 'state:enter'
                    }, {
                        state: 'a',
                        message: 'hi again',
                        event: 'state:resume'
                    }, {
                        state: 'a',
                        message: 'hi again',
                        event: 'state:exit'
                    }, {
                        state: 'b',
                        message: 'hi again',
                        event: 'state:enter'
                    }, {
                        state: 'b',
                        message: 'bar',
                        event: 'state:resume'
                    }, {
                        state: 'b',
                        message: 'bar',
                        event: 'state:exit'
                    }, {
                        state: 'c',
                        message: 'bar',
                        event: 'state:enter'
                    }, {
                        state: 'c',
                        message: null,
                        event: 'state:resume'
                    }, {
                        state: 'c',
                        message: null,
                        event: 'state:exit'
                    }, {
                        state: 'a',
                        message: null,
                        event: 'state:enter'
                    }]);
                })
                .run();
        });
    });

    describe("interact", function () {
        var app;
        var app_creator;

        beforeEach(function() {
            app = new App('start');
            app_creator = function () {
                return app;
            };
        });

        describe("when the api is defined", function() {
            it("should create an interaction machine", function() {
                var api = {};
                var im = vumigo.interact(api, app_creator);
                assert.strictEqual(im.app, app);
            });

            it("should support passing in an App class", function() {
                var MyApp = App.extend(function(self) {
                    App.call(self, 'start');
                    self.name = 'my_app';
                });

                var api = {};
                var im = vumigo.interact(api, MyApp);
                assert.strictEqual(im.app.name, 'my_app');
            });
        });

        describe("when the api is not defined", function() {
            it("should not create an interaction machine", function() {
                var api;
                var im = vumigo.interact(api, app_creator);
                assert.strictEqual(im, null);
            });
        });
    });
});
