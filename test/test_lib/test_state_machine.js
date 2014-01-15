var Q = require("q");
var assert = require("assert");

var state_machine = require("../../lib/state_machine");
var states = require("../../lib/states");
var dummy_api = require("../../lib/dummy_api");


var IMEvent = state_machine.IMEvent;
var FreeText = states.FreeText;
var EndState = states.EndState;


function make_im(start_state) {
    api = new dummy_api.DummyApi();
    states = new state_machine.StateCreator(start_state);
    im = new state_machine.InteractionMachine(api, states);

    return im
        .setup_config()
        .then(function() {
            return im.new_user();
        })
        .then(function() {
            return im;
        });
}

describe("InteractionMachine", function() {
    var im;

    function setup(state_name) {
        return make_im(state_name).then(function(new_im) {
            im = new_im;
        });
    }

    function on_im_event(event_type) {
        var d = Q.defer();
        var old = im.on_event;

        im.on_event = function(e) {
            if (e.event == event_type) {
                d.resolve(e);
            }

            return old.call(im, e);
        };

        return d.promise;
    }

    beforeEach(function(done) {
        setup("start").nodeify(done);
    });

    describe("on_event", function() {
        it("should delegate events to its state creator", function(done) {
            im.state_creator.set_handler('foo', function() {
                done();
            });

            im.on_event(new IMEvent('foo', im));
        });
    });

    describe("get_msg", function() {
        beforeEach(function() {
            im.on_inbound_message({
                cmd: "inbound-message",
                msg: {
                    from_addr: "from_addr",
                    content: "content",
                    message_id: "message_id",
                    session_event: "continue",
                    transport_metadata: {'foo': 'bar'}
                }
            });
        });

        it("should retrieve the current inbound message", function() {
            assert.deepEqual(im.get_msg(), {
                from_addr: "from_addr",
                content: "content",
                message_id: "message_id",
                session_event: "continue",
                transport_metadata: {'foo': 'bar'}
            });
        });

        it("should deep copy the current inbound message", function() {
            var msg = im.get_msg();
            msg.transport_metadata.foo = 'baz';

            msg = im.get_msg();
            assert.equal(msg.transport_metadata.foo, 'bar');
        });
    });

    describe("switch_state", function() {
        var state1;
        var state2;

        beforeEach(function(done) {
            setup("state1").then(function() {
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
            }).nodeify(done);
        });

        it("should switch to the given state", function(done) {
            assert.strictEqual(im.get_current_state(), null);

            im.switch_state("state1").then(function() {
                assert.equal(im.get_current_state(), state1);
            }).nodeify(done);
        });

        it("should fire a state exit event before switching", function(done) {
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

        it("should invoke the current state's exit handler before switching",
        function(done) {
            im.switch_state("state1").then(function() {
                assert.strictEqual(im.get_current_state(), state1);

                var d = Q.defer();
                state1.set_handlers({
                    on_exit: function() {
                        assert.equal(im.get_current_state(), state1);
                        d.resolve();
                    }
                });

                im.switch_state("state2");
                return d.promise;
            }).nodeify(done);
        });

        it("should fire a state enter event after switching", function(done) {
            im.switch_state("state1").then(function() {
                assert.strictEqual(im.get_current_state(), state1);

                var p = on_im_event("state_enter").then(function(e) {
                    assert.equal(im.get_current_state(), state2);
                    assert.equal(e.data.state, state2);
                });

                im.switch_state("state2");
                return p;
            }).nodeify(done);
        });
        
        it("should invoke the new state's enter handler after switching",
        function(done) {
            im.switch_state("state1").then(function() {
                assert.strictEqual(im.get_current_state(), state1);

                var d = Q.defer();
                state2.set_handlers({
                    on_enter: function() {
                        assert.equal(im.get_current_state(), state2);
                        d.resolve();
                    }
                });

                im.switch_state("state2");
                return d.promise;
            }).nodeify(done);
        });
    });

    describe("log",function() {
        it("should log the message", function(done) {
            im.log('testing 123').then(function(reply) {
                assert(reply.success);
                assert.equal(reply.cmd, "log.info");
                assert.deepEqual(api.logs, ["testing 123"]);
            }).nodeify(done);
        });
    });
    
    describe("setup_config", function() {
        it("should fire a config_read event", function() {
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
    });

    it("should generate an event after an inbound_event event", function() {
        var states = new state_machine.StateCreator("start");
        var store = {};
        states.on_inbound_event = function(event) {
            store.event = event;
        };
        assert.equal(store.config, undefined);
        states.on_event({event: 'inbound_event'});
        assert.equal(store.event.event, 'inbound_event');
    });

    it("should fire an inbound_event event on_inbound_event", function() {
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

    describe(".reply", function() {
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
    });
});

describe.skip("StateCreator", function() {
    describe("add_state", function() {
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
    });

    describe("switch_state", function() {
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
    });
});

describe.skip("User", function() {
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
});
