var assert = require("assert");

var vumigo = require("../lib");
var test_utils = vumigo.test_utils;
var SandboxConfig = vumigo.config.SandboxConfig;
var IMConfig = vumigo.config.IMConfig;


describe("SandboxConfig", function() {
    var im;
    var config;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
            config = im.sandbox_config;
        }).nodeify(done);
    });

    describe(".setup", function() {
        it("should emit a 'setup' event", function(done) {
            config = new SandboxConfig(im);

            config.on('setup', function() {
                done();
            });

            config.setup();
        });
    });
    
    describe(".get", function() {
        it("should retrieve the config value", function(done) {
            config.get('foo').then(function(value) {
                assert.deepEqual(JSON.parse(value), {bar: 'baz'});
            }).nodeify(done);
        });

        describe("if the 'json' option is true", function() {
            it("should parse the config value as JSON", function(done) {
                config.get('foo', {json: true}).then(function(value) {
                    assert.deepEqual(value, {bar: 'baz'});
                }).nodeify(done);
            });
        });
    });
});


describe("IMConfig", function() {
    var im;
    var config;

    beforeEach(function(done) {
        test_utils.make_im().then(function(new_im) {
            im = new_im;
            config = im.config;
        }).nodeify(done);
    });

    describe(".setup", function() {
        it("should emit a 'setup' event", function(done) {
            config = new IMConfig(im);

            config.on('setup', function() {
                done();
            });

            config.setup();
        });

        it("setup the config from its value in the sandbox config",
        function(done) {
            config.setup().then(function() {
                assert.equal(config.get('lerp'), 'larp');
            }).nodeify(done);
        });
    });
});
