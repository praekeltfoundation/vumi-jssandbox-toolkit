var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var InteractionMachine = vumigo.InteractionMachine;


describe("InteractionMachine", function () {
    var im;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
        }).nodeify(done);
    });

    describe(".setup", function() {
        it("should setup its sandbox config");

        it("should setup its config");

        it("should setup its metric store");

        it("should setup its state creator");

        it("should emit a 'setup' event");

        describe("if no user exists for the message address", function() {
            it("should create a new user");
        });

        describe("if a user exists for the message address", function() {
            it("should load the user");
        });

        describe("if the restart option is true", function() {
            it("should create a new user regardless");
        });
    });

    describe(".attach", function() {
        it("should attach the im to the api");

        describe("attaching to api.on_unknown_command", function() {
            it("should emit an 'unknown_command' event");
            it("should shutdown the im after event handling");
            it("should handle any errors thrown by the event listeners");
        });

        describe("attaching to api.on_inbound_event", function() {
            it("should emit an 'inbound_event' event");
            it("should shutdown the im after event handling");
            it("should handle any errors thrown by the event listeners");
        });

        describe("attaching to api.on_inbound_message", function() {
            it("should emit an 'inbound_message' event");
            it("should shutdown the im after event handling");
            it("should handle any errors thrown by the event listeners");
        });
    });

    describe(".is_in_state", function() {
        it("should determine whether the im is in a state");
    });

    describe(".switch_to_user_state", function() {
        it("should switch to the current user state");
    });

    describe(".switch_to_start_state", function() {
        it("should switch to the start state");
    });

    describe(".switch_state", function() {
        describe("if we are already in the requested state", function() {
            it("should not try switch state");
        });

        it("should switch to the requested state");
        it("should then setup the new state");
        it("should then emit an 'exit' event for the old state");
        it("should then set the user's state to the new state");
        it("should then emit an 'enter' event for the new state");
    });

    describe(".fetch_translation", function() {
        it("should construct a jed instance with the fetched language data");
    });

    describe(".log", function() {
        it("should log the requested message");
    });

    describe(".err", function() {
        it("should log the error");
        it("should terminate the sandbox");
    });

    describe(".done", function() {
        it("should save the user");
        it("should terminate the sandbox");
    });

    describe(".api_request", function() {
        it("should make a promise-based api request");
    });

    describe(".reply", function() {
        it("should switch to the user's current state");

        it("should use the state's display content in the reply");

        describe("if the translate option is true", function() {
            it("should translate the state's display content in the reply");
        });

        describe("if the state does not want to continue the session",
        function() {
            it("should emit a 'session:close' event");
            it("should set the reply message to not continue the session");
        });
    });

    describe(".handle_message", function() {
        it("should delegate to the respective handler");
        it("should fall back to the fallback handler");

        describe(".close", function() {
            it("should emit a 'session:close' event");
        });

        describe(".new", function() {
            it("should emit a 'session:new' event on the im");
            it("should emit a 'session:new' event on the current state");
            it("should reply to the message");
        });

        describe(".resume", function() {
            it("should emit a 'session:resume' event on the im");
            it("should emit a 'session:resume' event on the current state");
            it("should reply to the message");
        });
    });

    describe(".emit", function() {
        describe(".state_exit", function() {
            it("should emit an 'exit' event on the im");
            it("should emit an 'exit' event on the im's current state");

            describe("if the im is not in a state", function() {
                it("should not emit any 'exit' events");
            });
        });

        describe(".state_enter", function() {
            it("should emit an 'enter' event on the im");
            it("should emit an 'enter' event on the new state");
        });
    });

    describe("on 'unknown_command'", function() {
        it("should log the command");
    });
    
    describe("on 'inbound_message'", function() {
        it("should set up the im");
        it("should handle the message");

        describe("if the message content is set to '!restart'", function() {
            it("should reset the message content to an empty string");
        });

        describe("if the user is currently in a state", function() {
            it("should switch to the user's current state");
        });

        describe("if the user is not in a state", function() {
            it("should switch to the start state");
        });
    });
});
