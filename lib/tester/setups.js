var Q = require('q');

var utils = require('../utils');
var Extendable = utils.Extendable;

var fixtures = require('./fixtures');
var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var TaskMethodError = tasks.TaskMethodError;

var user = require('../user');
var User = user.User;


var SetupTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function(name) {
        var interactions = self.tester.tasks.get('interactions');
        var checks = self.tester.tasks.get('checks');

        if (interactions.length) {
            throw new TaskMethodError(name,
                "Setup tasks cannot be scheduled after interaction tasks");
        }

        if (checks.length) {
            throw new TaskMethodError(name,
                "Setup tasks cannot be scheduled after check tasks");
        }
    };

    self.before = function() {
        self.api.config_store.config = {};

        self.data.kv = {};
        self.data.config = {};
        self.data.sandbox_config = {config: self.data.config};
        self.data.user = {};
        self.data.msg = {};
    };

    self.after = function() {
        var api = self.api;
        var data = self.data;

        self.finalise.kv(api, data);
        self.finalise.config(api, data);
        self.finalise.user(api, data);
        self.finalise.msg(api, data);
    };

    self.finalise = {};

    self.finalise.kv = function(api, data) {
        utils.set_defaults(api.kv_store, data.kv);
    };

    self.finalise.config = function(api, data) {
        data.sandbox_config.config = utils.set_defaults(
            data.sandbox_config.config || {},
            data.config);

        data.sandbox_config = api.sandbox_config = utils.set_defaults(
            api.sandbox_config,
            data.config);
    };

    self.finalise.user = function(api, data) {
        utils.set_defaults(data.user, fixtures.user());

        var store_name = api.config_store.config.user_store_name;
        var key = User.make_key(data.user.addr, store_name);
        data.kv = api.kv_store[key] = utils.set_defaults(
            api.kv_store[key] || {},
            data.user);
    };
    
    self.finalise.msg = function(api, data) {
        data.msg.from_addr = data.user.addr;

        data.msg = self.tester.data.msg = utils.set_defaults(
            self.tester.data.msg || {},
            data.msg);
    };

    self.methods.setup = function(fn) {
        /**function:AppTester.setup(fn)

        Allows custom setting up of the sandbox application's config and data.

        :param function fn:
            function to be used to set up the sandbox application. Takes the
            form ``func(api)``, where ``api`` is the tester's api instance. May
            return a promise.

        .. code-block:: javascript

            tester.setup(function(api) {
                api.config_store.foo = 'bar';
            });
        */
        return fn.call(self.tester, self.api);
    };

    self.methods.setup.user = function(v) {
        /**function:AppTester.setup.user(obj)

        Updates the currently stored data about the user with the properties
        given in ``obj``.

        :param object obj:
            the properties to update the currently stored user data with

        .. code-block:: javascript

            tester.setup.user({
                addr: '+81',
                lang: 'jp'
            });
        */
        /**function:AppTester.setup.user(fn)

        Passes the currently stored user data to the function ``fn``, then
        updates the currently stored user data with the function's result.

        :param function fn:
            function of the form ``func(user)``, where ``user`` is the
            currently stored user data object. The stored user data is updated
            with ``fn``'s result. May return its result via a promise.

        .. code-block:: javascript

            tester.setup.user(function(user) {
                user.addr = '+81';
                user.lang = 'jp';
                return user;
            })
        */
        return Q(utils.functor(v))
           .fcall(self.data.user)
           .then(function(result) {
               utils.update(self.data.user, result || {});
           });
    };

    self.methods.setup.user.lang = function(lang) {
        /**function:AppTester.setup.user.lang(lang)

        Sets the user' language code.

        :param string lang:
            the user's new language code (eg, 'en' or 'af')

        .. code-block:: javascript

            tester.setup.user.lang('af');
        */
        self.data.user.lang = lang; 
    };
});


this.SetupTasks = SetupTasks;
