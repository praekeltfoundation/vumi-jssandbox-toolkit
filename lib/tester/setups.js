var utils = require('../utils');
var Extendable = utils.Extendable;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;


var SetupTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function() {
    };

    self.methods.setup = function() {
    };
});


this.SetupTasks = SetupTasks;
