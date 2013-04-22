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

    it("should pass on correct results", function() {
        tester.check_state({}, null,
                           "intro",
                           "Type something:"
                          );
        console.log("Yay!");
    });
});


describe("ImTester.check_close", function() {
    var api = mk_app();
    var tester = new test_utils.ImTester(api);

    it("should pass on correct results", function() {
        tester.check_close(null, "intro");
    });
});
