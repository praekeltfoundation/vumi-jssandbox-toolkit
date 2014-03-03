var Q = require('q');
var _ = require('lodash');

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
        app: new App('start'),
        kv: fixtures.kv(),
        config: fixtures.config(),
        msg: fixtures.msg(),
        setup: true
    });

    var api = opts.api || new DummyApi({
        kv: opts.kv,
        config: opts.config
    });

    var im = new InteractionMachine(api, opts.app);
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

function requester(api) {
    return function(name, cmd) {
        var d = Q.defer();
        api.request(name, cmd, function(result) {
            d.resolve(result);
        });
        return d.promise;
    };
}


this.make_im = make_im;
this.i18n_for = i18n_for;
this.catch_err = catch_err;
this.$ = new LazyTranslator();
this.requester = requester;
