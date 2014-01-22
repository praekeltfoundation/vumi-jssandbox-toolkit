var assert = require("assert");

var vumigo = require("../../../lib");
var test_utils = vumigo.test_utils;
var InteractionMachine = vumigo.InteractionMachine;


describe("InteractionMachine", function () {
    var im;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
        }).nodeify(done);
    });

    describe("hmm", function() {
    });
});
