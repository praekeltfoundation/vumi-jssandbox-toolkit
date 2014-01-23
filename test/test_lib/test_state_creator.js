var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var App = vumigo.App;


describe("App", function () {
    var im;
    var app;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
            app = im.app;
        }).nodeify(done);
    });

    describe(".setup", function() {
        it("should attach the im to the state creator");
        it("should emit a 'setup' event");
    });

    describe(".add_creator", function() {
        it("should add the creator");

        describe("if the creator already exists", function() {
            it("should throw an error");
        });
    });

    describe(".add_state", function() {
        it("should add an 'identity' state creator with the given state");
    });

    describe(".start_state_creator", function() {
        it("should invoke the requested start state");

        describe("if the requested start state does not exist", function() {
            it("should log an error");
            it("should return an error state");
        });
    });

    describe(".check_created_state", function() {
        it("should throw an error if the state is not an instance of State");
        it("should throw an error if the state has the wrong name");
    });

    describe(".switch_state", function() {
        it("should invoke the creator associated with the request state");
        it("should check the result of the creator");

        describe("if the requested state is the start state", function() {
            it("should invoke the start state creator");
        });

        describe("if the state does not exist", function() {
            it("should invoke the start state creator");
            it("should log a message");
        });
    });
});
