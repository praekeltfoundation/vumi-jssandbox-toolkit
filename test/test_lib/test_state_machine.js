var Q = require("q");
var assert = require("assert");

var state_machine = require("../../lib/state_machine");
var states = require("../../lib/states");
var dummy_api = require("../../lib/dummy_api");


var FreeText = states.FreeText;
var EndState = states.EndState;


describe("InteractionMachine", function() {
    var states;
    var api;
    var im;

    function setup(start_state) {
        api = new dummy_api.DummyApi();
        states = new state_machine.StateCreator(start_state);
        im = new state_machine.InteractionMachine(api, states);

        return im
            .setup_config()
            .then(function() {
                return im.new_user();
            });
    }

    function on_im_event(event_type) {
        var d = Q.defer();
        var old = im.on_event;

        im.on_event = function(e) {
            if (e.event == event_type) {
                d.resolve(e);
            }

            return old.call(self, e);
        };

        return d.promise;
    }

    beforeEach(function(done) {
        setup("start").nodeify(done);
    });

    describe("switch_state", function() {
        var state1;
        var state2;

        beforeEach(function(done) {
            setup("state1")
                .then(function() {
                    state1 = new FreeText({
                        name: "state1",
                        next: "end",
                        question: "foo"
                    });

                    state2 = new EndState({
                        name: "state2",
                        text: "bar"
                    });

                    states.add_state(state1);
                    states.add_state(state2);
                })
                .nodeify(done);
        });

        it("should switch to the given state", function(done) {
            assert.strictEqual(im.get_current_state(), null);

            im.switch_state("state1").then(function() {
                assert.equal(im.get_current_state(), state1);
            }).nodeify(done);
        });

        it("fire a state exit event before changing state", function(done) {
            im.switch_state("state1").then(function() {
                assert.strictEqual(im.get_current_state(), state1);

                var p = on_im_event('state_exit').then(function(e) {
                    assert.equal(im.get_current_state(), state1);
                    assert.equal(e.data.state, state1);
                });

                im.switch_state("state2");
                return p;
            }).nodeify(done);
        });

        it("fire a state enter event after changing state", function(done) {
            im.switch_state("state1").then(function() {
                assert.strictEqual(im.get_current_state(), state1);

                var p = on_im_event('state_enter').then(function(e) {
                    assert.equal(im.get_current_state(), state2);
                    assert.equal(e.data.state, state2);
                });

                im.switch_state("state2");
                return p;
            }).nodeify(done);
        });
    });

    it("should throw an error on duplicate states", function() {
        var sim = new SingleStateIm(
            new FreeText("start", "next", "Foo"));
        assert.throws(
            function () {
                sim.states.add_state(
                    new FreeText("start", "next", "Duplicate"));
            },
            states.StateError);
    });

    it("should return a promise when log is called", function() {
        var sim = new SingleStateIm();
        var p = sim.im.log('foo');
        assert.ok(p.is_promise);
        assert.ok(p.result.success);
        assert.equal(p.result.cmd, "log.info");
    });

    it("should log an error and switch to the start state on unknown states", function () {
        var sim = new SingleStateIm(
            new FreeText("start", "next", "Foo"));
        sim.im.user = {};
        sim.im.config = {};
        sim.im.switch_state("unknown");
        assert.equal(sim.im.current_state.name, "start");
        assert.deepEqual(sim.im.api.logs, [
            "Unknown state 'unknown'. Switching to start state, 'start'."
        ]);
    });

    it("should fall back to an error state if the start state is unknown", function () {
        var sim = new SingleStateIm();
        sim.im.user = {};
        sim.im.config = {};

        sim.im.switch_state("start");

        assert.equal(sim.im.current_state.name, "__error__");
        assert.deepEqual(
          sim.im.api.logs,
          ["Unknown state 'start'. Switching to start state, 'start'.",
           "Unknown start state 'start'. Switching to error state."]);
    });

    it("should retrieve users from 'users.<from_addr>'" +
       " if config.user_store isn't set", function(done) {
        var sim = new SingleStateIm();
        sim.im.config = {};
        sim.im.api.kv_store["users.+27123"] = {foo: 1};
        assert.equal(sim.im.user_key("+27123"), "users.+27123");
        var p = sim.im.load_user("+27123");
        p.add_callback(function () {
            assert.deepEqual(sim.im.user, {foo: 1});
        });
        p.add_callback(done);
    });

    it("should retrieve users from 'users.<store>.<from_addr>'" +
       " if config.user_store is set", function(done) {
        var sim = new SingleStateIm();
        sim.im.config = {user_store: "app1"};
        sim.im.api.kv_store["users.app1.+27123"] = {foo: 2};
        assert.equal(sim.im.user_key("+27123"), "users.app1.+27123");
        var p = sim.im.load_user("+27123");
        p.add_callback(function () {
            assert.deepEqual(sim.im.user, {foo: 2});
        });
        p.add_callback(done);
    });

    it("should save users to 'users.<from_addr>'" +
       " if config.user_store isn't set", function(done) {
        var sim = new SingleStateIm();
        sim.im.config = {};
        var p = sim.im.store_user("+27123", {foo: 3});
        p.add_callback(function () {
            assert.deepEqual(sim.im.api.kv_store["users.+27123"], {foo: 3});
        });
        p.add_callback(done);
    });

    it("should save users to 'users.<store>.<from_addr>'" +
       " if config.user_store is set", function(done) {
        var sim = new SingleStateIm();
        sim.im.config = {user_store: "app1"};
        var p = sim.im.store_user("+27123", {foo: 4});
        p.add_callback(function () {
            assert.deepEqual(sim.im.api.kv_store["users.app1.+27123"], {foo: 4});
        });
        p.add_callback(done);
    });

    it('should complain loudly when storing a user fails', function(done) {
        var sim = new SingleStateIm();
        sim.im.config = {};

        var api = sim.im.api;

        // monkey patch to return a fail response with a reason
        api._handle_kv_set = function(cmd, reply) {
            api._reply_fail(cmd, reply, "Too many keys");
        };

        try {
            sim.im.store_user("+27123", {foo: 3});
        } catch (err) {
            assert.equal(err.message, 'Too many keys');
            done();
        }
    });

    it('should generate an event after a config_read event', function() {
        var states = new state_machine.StateCreator("start");
        var store = {};
        states.on_config_read = function(event) {
            store.event = event;
        };
        assert.equal(store.config, undefined);
        states.on_event({event: 'config_read', config: {foo: 'bar'}});
        assert.equal(store.event.event, 'config_read');
        assert.equal(store.event.config.foo, 'bar');
    });

    it('should generate an event after an inbound_event event', function() {
        var states = new state_machine.StateCreator("start");
        var store = {};
        states.on_inbound_event = function(event) {
            store.event = event;
        };
        assert.equal(store.config, undefined);
        states.on_event({event: 'inbound_event'});
        assert.equal(store.event.event, 'inbound_event');
    });

    it('should fire an inbound_event event on_inbound_event', function() {
        var sim = new SingleStateIm(
            new FreeText("start", "start", "Foo"));
        var store = {};
        sim.states.on_inbound_event = function(event) {
            store.event = event;
        };
        sim.im.on_inbound_event({
            cmd: "inbound-event",
            msg: {
                session_event: "new"
            }
        });
        var event_data = store.event.data.event;
        assert.equal(event_data.session_event, 'new');
    });

    it('should fire a config_read event on_inbound_message', function() {
        var sim = new SingleStateIm(
            new FreeText("start", "start", "Foo"));
        var store = {};
        sim.states.on_config_read = function(event) {
            store.event = event;
        };
        sim.im.fetch_config_value = function(key, json, done) {
            assert.equal(key, 'config');
            assert.ok(json);
            done({'sample': 'config'});
        };
        sim.im.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue"
            }
        });
        var config = store.event.data.config;
        assert.equal(config.sample, 'config');
    });
    it('should handle FreeText.display that returns text', function(done) {
        var sim = new SingleStateIm(
            new FreeText("start", "start", "Foo"));
        sim.api.done = function () {
            var reply = sim.api.request_calls[0];
            assert.equal(reply.content, "Foo");
            done();
        };
        sim.im.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue"
            }
        });
    });
    it('should handle Booklet.display that returns a promise', function(done) {
        var sim = new SingleStateIm(
            new states.BookletState("start", {
                next: "start",
                page_text: function (n) { return "Page " + n + "."; },
                pages: 3,
                footer_text: ""
            })
        );
        sim.api.done = function () {
            var reply = sim.api.request_calls[0];
            assert.equal(reply.content, "Page 0.");
            done();
        };
        sim.im.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue"
            }
        });
    });
    it('should handle states that return false for send_reply', function(done) {
        var sim = new SingleStateIm(new FreeText("start", "next", "Foo"));
        sim.state.send_reply = function () { return false; };
        sim.api.done = function () {
            assert.deepEqual(sim.api.request_calls, []);
            done();
        };
        sim.im.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue"
            }
        });
    });

    it("should allow a copy of the current inbound message to be retrieved",
    function() {
        var sim = new SingleStateIm(
            new FreeText("start", "start", "Foo"));

        assert.equal(sim.im.get_msg(), null);
        sim.im.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue",
                transport_metadata: {'foo': 'bar'}
            }
        });

        // ensure we get a deep copy of the message
        var msg = sim.im.get_msg();
        msg.transport_metadata.foo = 'baz';

        assert.deepEqual(sim.im.get_msg(), {
            from_addr: "from_addr",
            content: "content",
            message_id: "message_id",
            session_event: "continue",
            transport_metadata: {'foo': 'bar'}
        });
    });
});

describe("StateError", function() {
    it("should be creatable", function() {
        var se = new states.StateError("msg");
        assert.equal(se.message, "msg");
    });
});
