var Q = require("q");

var vumigo = require("./");
var utils = vumigo.utils;
var DummyApi = vumigo.DummyApi;
var App = vumigo.App;
var InteractionMachine = vumigo.InteractionMachine;


function make_im(opts) {
    opts = utils.set_defaults(opts || {}, {
        api: new DummyApi(),
        app: new App('start'),
        kv: require('../test/fixtures/simple-kv').call(),
        config: require('../test/fixtures/simple-config').call(),
        msg: require('../test/fixtures/simple-msg').call(),
        setup: true
    });

    var im = new InteractionMachine(opts.api, opts.app);
    im.api.config_store = opts.config;
    im.api.kv_store = opts.kv;

    var p = Q();
    if (opts.setup) {
        p = im.setup(opts.msg);
    }

    return p.thenResolve(im);
}

function catch_err(fn) {
    try {
        fn();
    }
    catch (e) {
        return e;
    }
}


this.make_im = make_im;
this.catch_err = catch_err;
