var assert = require("assert");
var state_machine = require("../../lib/state_machine");
var states = require("../../lib/states");
var dummy_api = require("../../lib/dummy_api");

function SingleStateIm(state) {
    this.state = state;
    this.states = new state_machine.StateCreator(state ? state.name : "start");
    this.api = new dummy_api.DummyApi();
    this.im = new state_machine.InteractionMachine(this.api, this.states);
    if (state) {
        this.states.add_state(state);
    }
}


describe("test InteractionMachine", function() {
    it("should be creatable", function() {
        var sim = new SingleStateIm();
        assert.ok(sim.im);
    });
    it("should implement switch_state", function() {
        var sim = new SingleStateIm(
            new states.FreeText("start", "next", "Foo"));
        var done = 0;
        sim.im.user = {};
        sim.im.config = {};
        var p = sim.im.switch_state("start");
        p.add_callback(function () {done += 1;});
        assert.equal(done, 1);
        assert.equal(sim.im.current_state, sim.state);
    });
    it("should throw an error on duplicate states", function() {
        var sim = new SingleStateIm(
            new states.FreeText("start", "next", "Foo"));
        assert.throws(
            function () {
                sim.states.add_state(
                    new states.FreeText("start", "next", "Duplicate"));
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
            new states.FreeText("start", "next", "Foo"));
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
            new states.FreeText("start", "start", "Foo"));
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
            new states.FreeText("start", "start", "Foo"));
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
            new states.FreeText("start", "start", "Foo"));
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
});

describe("test State", function() {
    // TODO:
});

describe("test StateError", function() {
    it("should be creatable", function() {
        var se = new states.StateError("msg");
        assert.equal(se.message, "msg");
    });
});

describe("test ChoiceState", function() {
});

describe("test FreeText", function() {
});

describe("test EndState", function() {
});
