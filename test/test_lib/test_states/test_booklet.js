var Q = require("q");
var assert = require("assert");
var vumigo = require("../../../lib");


var BookletState = vumigo.states.BookletState;
var DummyIm = vumigo.test_utils.DummyIm;
var StateEnterEvent = vumigo.states.StateEnterEvent;


describe("BookletState", function () {
    var booklet;
    var im;
    var simulate;

    function page_text(n) {
        return Q("Page " + n + ".");
    }

    beforeEach(function () {
        im = new DummyIm();

        booklet = new BookletState({
            name: "booklet",
            next: "next_state",
            pages: 3,
            page_text: page_text
        });
        booklet.setup_state(im);
    });

    it("should set the initial page on enter", function (done) {
        booklet.emit(new StateEnterEvent(booklet)).then(function() {
            assert.deepEqual(im.user.pages, {booklet: 0});
        }).nodeify(done);
    });

    it("should allow the current page to be retrieved", function () {
        var user;
        user = {pages: {booklet: 2}};
        assert.equal(booklet.get_current_page(user), 2);
        user = {pages: {booklet: 0}};
        assert.equal(booklet.get_current_page(user), 0);
    });

    it("should allow the current page to be set", function () {
        var user = {};
        booklet.set_current_page(user, 0);
        assert.equal(user.pages.booklet, 0);
        booklet.set_current_page(user, 2);
        assert.equal(user.pages.booklet, 2);
    });

    it("should allow the current page to be incremented", function () {
        var user = {};
        booklet.inc_current_page(user, 1);
        assert.equal(user.pages.booklet, 1);
        booklet.inc_current_page(user, -1);
        assert.equal(user.pages.booklet, 0);
        booklet.inc_current_page(user, 3);
        assert.equal(user.pages.booklet, 0);
        booklet.inc_current_page(user, -10);
        assert.equal(user.pages.booklet, 2);
    });

    it("should process do nothing on unknown input", function (done) {
        booklet.set_current_page(im.user, 0);

        booklet.emit.input("x").then(function() {
            assert.equal(im.user.pages.booklet, 0);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
        }).nodeify(done);
    });

    it("should increment page on next", function (done) {
        booklet.set_current_page(im.user, 0);

        booklet.emit.input("2").then(function() {
            assert.equal(im.user.pages.booklet, 1);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
        }).nodeify(done);
    });

    it("should decrement page on prev", function (done) {
        booklet.set_current_page(im.user, 0);

        booklet.emit.input("1").then(function() {
            assert.equal(im.user.pages.booklet, 2);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
        }).nodeify(done);
    });

    it("should go to next state on exit", function (done) {
        booklet.set_current_page(im.user, 0);

        booklet.emit.input("0").then(function() {
            assert.equal(im.user.pages.booklet, 0);
            assert.equal(im.user.current_state, "next_state");
            assert.equal(im.answer, null);
        }).nodeify(done);
    });

    it("should display the current page", function (done) {
        booklet.set_current_page(im.user, 1);

        booklet.display().then(function (content) {
            assert.equal(content, [
                "Page 1.",
                "1 for prev, 2 for next, 0 to end."
            ].join('\n'));
        }).nodeify(done);
    });
});
