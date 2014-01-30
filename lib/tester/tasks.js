var Q = require('q');

var utils = require('../utils');
var Extendable = utils.Extendable;
var BaseError = utils.BaseError;


var TaskError = BaseError.extend(function(self, message) {
    /**class:TaskError(message)

        Thrown when an error occurs while trying to schedule or run a task.

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

    A collection of tasks to be run one after the other.

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
            /**attribute:AppTesterTasks.length
            The number of currently scheduled tasks in this collection.
            */
            return self.tasks.length;
        }
    });

    self.reset = function() {
        /**:AppTesterTasks.reset()

        Clears the task collection's currently scheduled tasks and stored data.
        */
        self.tasks = [];
        self.data = {};
    };
    self.reset();

    self.validate = function(name, args) {
        /**:AppTesterTasks.validate(name[, args])

        Optional validator invoked each time a task is scheduled.

        :param string name:
            the name of the task method to be scheduled
        :param array args:
            the args that the task method will be scheduled to invoke.
        */
    };

    self.before = function() {
        /**:AppTesterTasks.before()

        Hook invoked before any of the scheduled tasks are run.
        May return a promise.
        */
    };

    self.before.each = function() {
        /**:AppTesterTasks.before.each()

        Hook invoked before each scheduled task is run.  May return a promise.
        */
    };

    self.after = function() {
        /**:AppTesterTasks.after()
        Hook invoked after all of the scheduled tasks have been run.
        May return a promise.
        */
    };

    self.after.each = function() {
        /**:AppTesterTasks.after.each()
        Hook invoked after each scheduled task has been run.
        May return a promise.
        */
    };

    self.schedule = function(name, fn, args) {
        /**:AppTesterTasks.schedule(name, fn, args)

        Schedules a task method to be invoked on the next
        :meth:`AppTesterTasks.run` call.

        :param string name:
            the name of the task method to be scheduled
        :param function fn:
            the actual task method
        :param array args:
            the args that the task method will be scheduled to invoke.
        */
        self.validate(name, arguments);
        self.tasks.push(function() {
            return fn.apply(self, args);
        });
    };

    self.run = function() {
        /**:AppTesterTasks.run()

        Runs the collections's scheduled tasks in the order they were
        scheduled, then performs a reset. Returns a promise which will be
        fulfilled once the scheduled tasks have run and the collection has
        reset itself.
        */
        function each_task(task) {
            return function() {
                return self.run.task(task);
            };
        }

        return Q()
            .then(function() {
                return utils.maybe_call(self.before);
            })
            .then(function() {
                return self.tasks.map(each_task);
            })
            .then(function(runs) {
                return runs.reduce(Q.when, Q());
            })
            .then(function() {
                return utils.maybe_call(self.after);
            })
            .then(function() {
                return self.reset();
            });
    };

    self.run.task = function(task) {
        return Q()
            .then(function() {
                return utils.maybe_call(self.before.each);
            })
            .then(function() {
                return task();
            })
            .then(function() {
                return utils.maybe_call(self.after.each);
            });
    };

    self.attach = function() {
        /**:AppTesterTasks.attach()

        Attaches the task collection's methods to the collection's associated
        tester. Any method defined on the testers ``self.methods`` attribute
        will be attached as a method on the tester.

        The method attached to the tester is constructed to simply schedule the
        actual task method. For example, if the task collection has a method
        ``self.methods.foo()``, a corresponding method ``tester.foo()`` will be
        constructed. When ``tester.foo()`` is called, a call to
        ``self.methods.foo()`` will be scheduled next time this task collection
        is run.
        */
        self.attach.props(tester, self.methods);
    };

    self.attach.props = function(dest, target, target_name) {
        utils.each_prop(target, function(prop, name) {
            var full_name = self.method_path(name, target_name);
            var attacher = self.attach[typeof prop] || utils.noop;
            attacher.call(self, dest, prop, name, full_name);
        });
    };

    self.attach.object = function(dest, obj, name, full_name) {
        var prop = {};
        dest[name] = prop;
        self.attach.props(prop, obj, full_name);
    };

    self.attach.function = function(dest, method, name, full_name) {
        var prop = function() {
            self.schedule(full_name, method, arguments);
            return self.tester;
        };

        dest[name] = prop;
        prop.__task_name__ = full_name;
        self.attach.props(prop, method, full_name);
    };

    self.method_path = function(name, parent_name) {
        return parent_name
            ? [parent_name, name].join('.')
            : name;
    };

});


var AppTesterTaskSet = Extendable.extend(function(self) {
    /**class:AppTesterTaskSet

    Manages a set of :class:`AppTesterTasks`. Used by :class:`AppTester` to
    control all its task collections (*setup*, *interaction* and *check* tasks)
    without needing to interact with each collection individually.
    */
    self.items = {};
    self.list = [];

    Object.defineProperty(self, 'length', {
        get: function() {
            /**attribute:AppTesterTaskSet.length
            The total number of currently scheduled tasks in this set.
            */
            return self.list.reduce(function(count, tasks) {
                return count + tasks.length;
            }, 0);
        }
    });

    self.add = function(name, tasks) {
        /**:AppTesterTaskSet.add(name, tasks)

        Adds a task collection to this set of task collections.

        :param string name:
            the name to be used to identify this collection of tasks.
        :param AppTesterTasks tasks:
            the collection of tasks to be added.
        */
        self.items[name] = tasks;
        self.list.push(tasks);
    };

    self.get = function(name) {
        /**:AppTesterTaskSet.get(name)

        Retrieves the task collection associated with the specified name.

        :param string name:
            the name to be used to look up the collection of tasks.
        */
        return self.items[name];
    };
    
    self.invoke = function(method_name, args) {
        /**:AppTesterTaskSet.invoke(method_name[, args])

        Invokes a method on each task collection in the set, returning the
        results as an array.

        :param string method_name:
            the name of the method to invoke on each task collection.
        :param array args:
            the arguments to invoke the method with.
        */
        return self.list.map(function(tasks) {
            return tasks[method_name].apply(self, args);
        });
    };

    self.run = function() {
        /**:AppTesterTaskSet.run()

        Runs the set's task collections' tasks in the order the collections
        were added in.
        */
        return self
            .list.map(function(tasks) {
                return tasks.run;
            })
            .reduce(Q.when, Q());
    };

    self.attach = function() {
        /**:AppTesterTaskSet.attach()

        Attaches each of the collections' task methods to their tester. See
        :meth:`AppTesterTasks.attach`.
        */
        self.invoke('attach');
    };
    
    self.reset = function() {
        /**:AppTesterTaskSet.reset()

        Resets all of its collections. See :meth:`AppTesterTasks.reset`.
        */
        self.invoke('reset');
    };
});


this.AppTesterTasks = AppTesterTasks;
this.AppTesterTaskSet = AppTesterTaskSet;

this.TaskError = TaskError;
this.TaskMethodError = TaskMethodError;
