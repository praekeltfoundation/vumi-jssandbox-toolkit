var assert = require("assert");
var vumigo = require("../../../lib");


var BookletState = vumigo.states.BookletState;
var success = vumigo.promise.success;


function DummyIm() {
    var self = this;
    self.user = {};

    self.current_state = null;
    self.answer = null;

    self.set_user_state = function(state_name) {
        self.current_state = state_name;
    }

    self.set_user_anser = function(state_name, answer) {
        self.answer = null;
    }
}


describe("BookletState", function () {

    var booklet;
    var im;

    function page_text(n) {
        return success("Page " + n + ".");
    }

    beforeEach(function () {
        im = new DummyIm();
        booklet = new BookletState("booklet", {
            next: "next_state",
            pages: 3,
            page_text: page_text
        });
        booklet.setup_state(im);
    });

    it("should set the initial page on enter", function () {
        booklet.on_enter();
        assert.deepEqual(im.user, {pages: {
                booklet: 0
        }});
    });

    it("should allow the current page to be retrieved", function () {
        var user;
        user = {pages: {booklet: 2}};
        assert.equal(booklet.get_current_page(user), 2);
        user = {pages: {booklet: 0}};
        assert.equal(booklet.get_current_page(user), 0);
    });

    it("should allow the current page to be set", function () {
        var user = {}
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
        booklet.input_event("x", function() {
            assert.equal(im.user.pages.booklet, 0);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
            done();
        });
    });

    it("should increment page on next", function (done) {
        booklet.set_current_page(im.user, 0);
        booklet.input_event("2", function() {
            assert.equal(im.user.pages.booklet, 1);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
            done();
        });
    });

    it("should decrement page on prev", function (done) {
        booklet.set_current_page(im.user, 0);
        booklet.input_event("1", function() {
            assert.equal(im.user.pages.booklet, 2);
            assert.equal(im.current_state, null);
            assert.equal(im.answer, null);
            done();
        });
    });

    it("should go to next state on exit", function (done) {
        booklet.set_current_page(im.user, 0);
        booklet.input_event("0", function() {
            assert.equal(im.user.pages.booklet, 0);
            assert.equal(im.current_state, "next_state");
            assert.equal(im.answer, null);
            done();
        });
    });

    it("should display the current page", function (done) {
        booklet.set_current_page(im.user, 1);
        var p = booklet.display();
        p.add_callback(function (content) {
            assert.equal(content, "Page 1.\n" +
                         "1 for prev, 2 for next, 0 to end.");
            done();
        });
    });
});
