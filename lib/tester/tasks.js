var Q = require('q');

var utils = require('../utils');
var Extendable = utils.Extendable;
var BaseError = utils.BaseError;


var TaskError = BaseError.extend(function(self, message) {
    /**class:TaskError(message)

        Thrown when an error occurs while trying to scheduling or run a task.

        :param string message:
            the error message.
    */
    self.name = 'TaskError';
    self.message = message;
});


var TaskMethodError = BaseError.extend(function(self, method_name, message) {
    /**class:TaskMethodError(message)

        Thrown when an error occurs while trying to invoke a task method.

        :param string method_name:
            the name of the task method associated to the error.
        :param string message:
            the error message.
    */
    self.name = 'TaskMethodError';
    self.message = "Method '" + method_name + "' failed: " + message;
});


var AppTesterTasks = Extendable.extend(function(self, tester) {
    /**class:AppTesterTasks(tester)

    A collection of tasks to be run contiguously.

    :param AppTester tester:
        the tester that this collection of tasks will be scheduled for.
    */
    self.tester = tester;
    self.im = self.tester.im;
    self.api = self.tester.api;
    self.app = self.tester.app;
    self.methods = {};
    self.tasks = null;
    self.data = null;

    Object.defineProperty(self, 'length', {
        get: function() {
            return self.tasks.length;
        }
    });

    self.reset = function() {
        self.tasks = [];
        self.data = {};
    };
    self.reset();

    self.validate = function(name, args) {
    };

    self.schedule = function(name, fn, args) {
        self.validate(name, arguments);
        self.tasks.push(function() {
            return fn.apply(self, args);
        });
        return self;
    };

    self.method_path = function(name, parent_name) {
        return parent_name
            ? [parent_name, name].join('.')
            : name;
    };

    self.run = function() {
        return self
            .tasks.reduce(Q.when, Q())
            .then(function() {
                return self.reset();
            })
            .thenResolve(self);
    };


    self.attach = function() {
        self.attach.props(tester, self.methods);
        return self;
    };

    self.attach.props = function(dest, target, target_name) {
        utils.each_prop(target, function(prop, name) {
            var full_name = self.method_path(name, target_name);
            var attacher = self.attach[typeof prop] || utils.noop;
            attacher.call(self, dest, prop, name, full_name);
        });
        return self;
    };

    self.attach.object = function(dest, obj, name, full_name) {
        var prop = {};
        dest[name] = prop;
        self.attach.props(prop, obj, full_name);
        return self;
    };

    self.attach.function = function(dest, method, name, full_name) {
        var prop = function() {
            self.schedule(full_name, method, arguments);
            return self.tester;
        };

        dest[name] = prop;
        prop.__task_name__ = full_name;
        self.attach.props(prop, method, full_name);
        return self;
    };
});


var AppTesterTaskSet = Extendable.extend(function(self) {
    self.items = {};
    self.list = [];

    Object.defineProperty(self, 'length', {
        get: function() {
            return self.list.reduce(function(count, tasks) {
                return count + tasks.length;
            }, 0);
        }
    });

    self.add = function(name, tasks) {
        self.items[name] = tasks;
        self.list.push(tasks);
        return self;
    };

    self.get = function(name) {
        return self.items[name];
    };
    
    self.invoke = function(method_name, args) {
        return self.list.map(function(tasks) {
            return tasks[method_name].apply(self, args);
        });
    };

    self.run = function() {
        return self
            .list.map(function(task) {
                return task.run;
            })
            .reduce(Q.when, Q())
            .thenResolve(self);
    };

    self.attach = function() {
        self.invoke('attach');
        return self;
    };
    
    self.reset = function() {
        self.invoke('reset');
        return self;
    };
});


this.AppTesterTasks = AppTesterTasks;
this.AppTesterTaskSet = AppTesterTaskSet;

this.TaskError = TaskError;
this.TaskMethodError = TaskMethodError;
