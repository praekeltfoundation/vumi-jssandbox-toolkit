var assert = require("assert");
var test_utils = require("../../lib/test_utils");
var vumigo = require("../../lib");

var DummyApi = vumigo.dummy_api.DummyApi;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;


function TestStateCreator() {
    var self = this;
    StateCreator.call(self, "intro");

    self.add_state(new FreeText(
        "intro", "end_state",
        "Type something:"
    ));
    self.add_state(new EndState(
        "end_state", "Goodbye!"
    ));
}


function mk_app() {
    var api = new DummyApi();
    var states = new TestStateCreator();
    var im = new InteractionMachine(api, states);
    im.attach();
    return api;
}


describe("ImTester.check_state", function() {
    var api = mk_app();
    var tester = new test_utils.ImTester(api);

    it("should pass on correct next_state and response", function() {
        tester.check_state({
            user: {},
            content: null,
            next_state: "intro",
            response: "Type something:",
        });
    });

    it("should fail on incorrect next_state", function() {
        assert.throws(function () {
            tester.check_state({
                user: {},
                content: null,
                next_state: "unknown",
                response: "Type something:",
            });
        }, assert.AssertionError);
    });
});


describe("ImTester.check_close", function() {
    var api = mk_app();
    var tester = new test_utils.ImTester(api);

    it("should pass on correct next_state", function() {
        tester.check_close({
            user: {},
            next_state: "intro"
        });
    });

    it("should fail on incorrect next_state", function() {
        assert.throws(function () {
            tester.check_close({
                user: {},
                next_state: "unknown"
            });
        }, assert.AssertionError);
    });
});
