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
        self.tasks.reset();
        self.data = {};
        return self;
    };
    self.reset();

    self.run = function() {
        return self
            .tasks.run()
            .finally(function() {
                return self.reset();
            })
            .thenResolve(self);
    };
});


this.AppTester = AppTester;
