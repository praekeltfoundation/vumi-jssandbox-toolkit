var Q = require("q");
var _ = require("underscore");

var fixtures = require('./fixtures');
var dummy = require('./dummy');
var DummyApi = dummy.DummyApi;

var app = require('./app');
var App = app.App;

var interaction_machine = require('./interaction_machine');
var InteractionMachine = interaction_machine.InteractionMachine;

var translate = require('./translate');
var Translator = translate.Translator;
var LazyTranslator = translate.LazyTranslator;


function make_im(opts) {
    opts = _.defaults(opts || {}, {
        api: new DummyApi(),
        app: new App('start'),
        kv: fixtures.kv(),
        config: fixtures.config(),
        msg: fixtures.msg(),
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
    return new Translator(fixtures.lang(lang));
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
this.$ = new LazyTranslator();
