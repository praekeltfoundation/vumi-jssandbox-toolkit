var utils = require('../utils');
var Extendable = utils.Extendable;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;


var SetupTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function() {
    };

    self.methods.setup = function() {
        /**:AppTester.setup(fn)

        Allows custom setting up of the sandbox application. Accepts a function
        of the form ``func(api)``, where ``api`` is the tester's api instance.

        .. code-block:: javascript

            tester.setup(function(api) {
                api.config_store.foo = 'bar';
            });
        */
    };
});


this.SetupTasks = SetupTasks;
