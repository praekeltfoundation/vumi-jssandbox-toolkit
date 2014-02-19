var Q = require("q");
var _ = require("underscore");

var vumigo = require("./");
var DummyApi = vumigo.DummyApi;
var App = vumigo.App;
var InteractionMachine = vumigo.InteractionMachine;


function make_im(opts) {
    opts = _.defaults(opts || {}, {
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

function i18n_for(lang, opts) {
    return make_im(opts).invoke('fetch_translation', lang);
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
this.i18n_for = i18n_for;
this.catch_err = catch_err;
