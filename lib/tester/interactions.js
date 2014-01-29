var utils = require('../utils');
var Extendable = utils.Extendable;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;


var InteractionTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function() {
        var checks = self.tester.tasks.get('checks');

        if (checks.length) {
            throw new TaskMethodError(name,
                "Interaction tasks cannot be scheduled after check tasks");
        }
    };
});


this.InteractionTasks = InteractionTasks;
