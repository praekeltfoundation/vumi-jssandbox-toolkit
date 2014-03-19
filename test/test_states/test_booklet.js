var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var test_utils = vumigo.test_utils;
var BookletState = vumigo.states.BookletState;


describe("states.booklet", function() {
    describe("BookletState", function() {
        var tester;

        beforeEach(function () {
            var app = new App('states:test');

            app.states.add('states:test', function(name) {
                return new BookletState(name, {
                    next: "next_state",
                    pages: 3,
                    page_text: function(n) {
                        return Q("Page " + n + ".");
                    }
                });
            });

            tester = new AppTester(app);
        });

        it("should display the first page when the user enters");
        it("should not change state if bad input was given");
        it("should go to the previous page if asked");
        it("should go to the next page if asked");
        it("should go to the next state if asked");
        it("should translate the displayed content");
    });
});
