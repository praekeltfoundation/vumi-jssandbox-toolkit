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
    it("should throw an error on switching to unknown states", function () {
        var sim = new SingleStateIm();
        sim.im.user = {};
        sim.im.config = {};
        assert.throws(
            function () {
                sim.im.switch_state("unknown");
            },
            states.StateError);
    });
    it('should generate an event after a config_read event', function() {
        var states = new state_machine.StateCreator("start");
        var store = {};
        states.on_config_read = function(config) {
            store.config = config;
        };
        assert.equal(store.config, undefined);
        states.on_event({event: 'config_read'});
        assert.equal(store.config.event, 'config_read');
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