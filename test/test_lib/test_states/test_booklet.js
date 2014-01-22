var Q = require("q");
var assert = require("assert");

var vumigo = require("../../../lib");
var test_utils = vumigo.test_utils;
var BookletState = vumigo.states.BookletState;
var StateEnterEvent = vumigo.states.StateEnterEvent;


describe("BookletState", function () {
    var booklet;
    var im;

    function page_text(n) {
        return Q("Page " + n + ".");
    }

    beforeEach(function (done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;

            booklet = new BookletState('booklet', {
                next: "next_state",
                pages: 3,
                page_text: page_text
            });

            im.state_creator.add_state(booklet);
            return im.switch_state('booklet');
        }).nodeify(done);
    });

    describe(".setup'", function() {
        it("should set the initial page", function (done) {
            booklet = new BookletState('name', {
                next: "next_state",
                pages: 3,
                page_text: page_text,
                initial_page: 2
            });

            booklet.setup(im).then(function() {
                assert.equal(booklet.get_current_page(), 2);
            }).nodeify(done);
        });
    });

    describe("on 'state:input'", function() {
        describe("if the input given was unknown", function() {
            it("should not change the page number", function (done) {
                assert.equal(booklet.metadata.page, 0);

                booklet.emit.input("x").then(function() {
                    assert.equal(booklet.metadata.page, 0);
                }).nodeify(done);
            });

            it("should not change state", function (done) {
                booklet.emit.input("x").then(function() {
                    assert.equal(im.user.state.get_name(), 'booklet');
                }).nodeify(done);
            });
        });

        describe("if the input given was for the previous page", function() {
            it("should decrement the page", function (done) {
                booklet.set_current_page(0);

                booklet.emit.input("1").then(function() {
                    assert.equal(booklet.get_current_page(), 2);
                }).nodeify(done);
            });

            it("should not change state", function (done) {
                booklet.emit.input("x").then(function() {
                    assert.equal(im.user.state.get_name(), 'booklet');
                }).nodeify(done);
            });
        });

        describe("if the input given was for the exiting", function() {
            it("should go to next state", function (done) {
                booklet.emit.input("0").then(function() {
                    assert.equal(im.user.state.get_name(), "next_state");
                }).nodeify(done);
            });
        });

        describe("if the input given was for the next page", function() {
            it("should increment the page", function (done) {
                booklet.set_current_page(0);

                booklet.emit.input("2").then(function() {
                    assert.equal(booklet.get_current_page(), 1);
                }).nodeify(done);
            });

            it("should not change state", function (done) {
                booklet.emit.input("2").then(function() {
                    assert.equal(im.user.state.get_name(), 'booklet');
                }).nodeify(done);
            });
        });
    });

    describe(".set_current_page", function() {
        it("should allow the current page to be set", function () {
            booklet.set_current_page(0);
            assert.equal(booklet.get_current_page(), 0);

            booklet.set_current_page(2);
            assert.equal(booklet.get_current_page(), 2);
        });
    });

    describe(".inc_current_page", function() {
        it("should allow the current page to be incremented", function () {
            booklet.inc_current_page(1);
            assert.equal(booklet.get_current_page(), 1);

            booklet.inc_current_page(-1);
            assert.equal(booklet.get_current_page(), 0);

            booklet.inc_current_page(3);
            assert.equal(booklet.get_current_page(), 0);

            booklet.inc_current_page(-10);
            assert.equal(booklet.get_current_page(), 2);
        });
    });

    describe(".display", function() {
        it("should display the current page", function (done) {
            booklet.set_current_page(1);

            booklet.display().then(function(content) {
                assert.equal(content, [
                    "Page 1.",
                    "1 for prev, 2 for next, 0 to end."
                ].join('\n'));
            }).nodeify(done);
        });
    });
});
