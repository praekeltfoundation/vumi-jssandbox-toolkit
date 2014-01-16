var Q = require("q");
var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var User = vumigo.user.User;


describe("User", function() {
    var im;
    var user;

    beforeEach(function(done) {
        test_utils.make_im({
            config: {
                'translation.en': JSON.stringify({'foo': 'bar'}),
            },
            msg: {}
        }).then(function(new_im) {
            im = new_im;
            user = im.user;
        }).nodeify(done);
    });

    describe(".setup", function() {
        beforeEach(function() {
            user = new User(im);
        });

        it("should emit a 'setup' event", function(done) {
            user.on('setup', function(e) {
                assert.strictEqual(user, e.instance);
                done();
            });

            user.setup('1234', {lang: 'en'});
        });

        it.skip("should refresh the user's gettext object", function() {
        });
    });
});
