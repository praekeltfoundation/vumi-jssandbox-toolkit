var Q = require('q');

var utils = require('../utils');

var events = require('../events');
var Eventable = events.Eventable;

var dummy_api = require('../dummy_api');
var DummyApi = dummy_api.DummyApi;

var interaction_machine = require('../interaction_machine');
var InteractionMachine = interaction_machine.InteractionMachine;

var tasks = require('./tasks');
var AppTesterTaskSet = tasks.AppTesterTaskSet;

var setups = require('./setups');
var SetupTasks = setups.SetupTasks;

var interactions = require('./interactions');
var InteractionTasks = interactions.InteractionTasks;

var checks = require('./checks');
var CheckTasks = checks.CheckTasks;


var AppTester = Eventable.extend(function(self, app, opts) {
    /**class:AppTester(app[, opts])

    Machinery for testing a sandbox application.

    Provides *setup*, *interaction* and *checking* tasks.  Whenever a task
    method is called, its task is scheduled to run next time
    :meth:`AppTester.run` is called.

    :param App app:
        the sandbox app to be tested.
    :param opts.api:
        the api instance to use for the interaction machine runs. Defaults to a
        new :class:`DummyApi` instance.
    */
    opts = utils.set_defaults(opts || {}, {api: new DummyApi()});

    self.app = app;
    self.api = opts.api,
    self.im = new InteractionMachine(self.api, self.app);

    self.tasks = new AppTesterTaskSet();
    self.tasks.add('setups', new SetupTasks(self));
    self.tasks.add('interactions', new InteractionTasks(self));
    self.tasks.add('checks', new CheckTasks(self));
    self.tasks.attach();
    self.data = null;

    self.reset = function() {
        /**:AppTester.reset()

        Clears scheduled tasks and data stored for the next tester run.
        */
        self.tasks.reset();
        self.data = {};
        return self;
    };
    self.reset();

    self.run = function() {
        /**:AppTester.run()

        Runs the tester's scheduled tasks, then resets the tester. Returns a
        promise which will be fulfilled once the scheduled tasks have run and
        the tester has reset itself.
        */
        return self
            .tasks.run()
            .finally(function() {
                return self.reset();
            })
            .thenResolve(self);
    };
});


this.AppTester = AppTester;
