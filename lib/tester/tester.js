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


var AppTester = Eventable.extend(function(self, app) {
    /**class:AppTester(app)

    Machinery for testing a sandbox application.

    Provides *setup*, *interaction* and *checking* tasks.  Whenever a task
    method is called, its task is scheduled to run next time
    :meth:`AppTester.run` is called.

    :param App app:
        the sandbox app to be tested.
    */

    self.init = function() {
        self.app = app;
        self.tasks = new AppTesterTaskSet();
        self.reset();

        self.tasks.add('setups', new SetupTasks(self));
        self.tasks.add('interactions', new InteractionTasks(self));
        self.tasks.add('checks', new CheckTasks(self));

        self.tasks.attach();
    };

    self.reset = function() {
        /**:AppTester.reset()

        Clears scheduled tasks and data, and uses a new api and interaction
        machine, clearing things for the next tester run.
        */
        self.data = {};
        self.api = new DummyApi();
        self.im = new InteractionMachine(self.api, self.app);
        self.tasks.reset();
        return self;
    };

    self.init();

    self.run = function() {
        /**:AppTester.run()

        Runs the tester's scheduled tasks in the order they were scheduled,
        then resets the tester. Returns a promise which will be fulfilled once
        the scheduled tasks have run and the tester has reset itself.
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
