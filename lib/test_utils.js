var Q = require('q');
var _ = require('lodash');
var assert = require('assert');

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
    /**function:make_im(opts)

    Constructs an :class:`InteractionMachine`. Useful for testing things that a
    :class:`App` uses, for e.g. an http api helper for a particular app.
    All options are optional.

    :param App opts.app:
        The app to be given to the interaction machine. If not given, a new app
        is created with a start state of 'start'.
    :type opts.api:
        object or DummyApi
    :param opts.api:
        If an options object is given, a new :class:`DummyApi` is created using
        those options. Sensible defaults are provided for ``'config'`` and
        ``'kv'`` if those options are not given.
    :param object opts.msg:
        The message to setup the :class:`InteractionMachine` with. Uses
        sensible defaults if not given.
    :param boolean opts.setup:
        Whether :meth:`InteractionMachine.setup` should be invoked.
        Defaults to ``true``.
    */
    opts = _.defaults(opts || {}, {
        app: new App('start'),
        api: {},
        msg: fixtures.msg(),
        setup: true
    });

    var api = opts.api;
    if (!(opts.api instanceof DummyApi)) {
        _.defaults(opts.api, {
            kv: fixtures.kv(),
            config: fixtures.config(),
        });

        api = new DummyApi(opts.api);
    }
        
    var im = new InteractionMachine(api, opts.app);
    var p = Q();
    if (opts.setup) {
        p = im.setup(opts.msg);
    }

    return p.thenResolve(im);
}


function i18n_for(lang) {
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
    /**function:requester(api)
    
    Returns a promise-based function that makes requests to the given api.

    :param DummyApi api:
        The api to make requests to.
    */
    return function(name, cmd) {
        var d = Q.defer();
        api.request(name, cmd, function(result) {
            d.resolve(result);
        });
        return d.promise;
    };
}


function fail() {
    /**function:fail()
    Raises an :class:`AssertionError` with ``"Expected test to fail"`` as the
    error message.
    */
    assert.fail(null, null, "Expected test to fail");
}


this.make_im = make_im;
this.i18n_for = i18n_for;
this.catch_err = catch_err;
this.$ = new LazyTranslator();
this.fail = fail;
this.requester = requester;
