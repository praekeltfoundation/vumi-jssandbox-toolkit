var utils = require('../utils');
var Extendable = utils.Extendable;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;


var SetupTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function() {
    };

    self.methods.setup = function(fn) {
        /**:AppTester.setup(fn)

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
});


this.SetupTasks = SetupTasks;
