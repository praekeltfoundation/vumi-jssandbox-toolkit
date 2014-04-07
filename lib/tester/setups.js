var Q = require('q');
var _ = require('lodash');

var fixtures = require('./fixtures');
var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var TaskMethodError = tasks.TaskMethodError;

var user = require('../user');
var User = user.User;
var UserStateData = user.UserStateData;


var SetupTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);
    
    self.defaults = {
        char_limit: 160
    };

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
        _.defaults(self.data, self.defaults);

        self.data.user = {};
        self.data.msg = {};
    };

    self.after = function() {
        var api = self.api;
        var data = self.data;

        _.defaults(api.config.app, fixtures.config());
        self.finalise.user(api, data);
        self.finalise.msg(api, data);

        self.tester.data.char_limit = self.data.char_limit;
    };

    self.finalise = {};

    self.finalise.user = function(api, data) {
        // if the user contains anything other than its address, they exist
        var exists = _.size(_.omit(data.user, 'addr'));

        var defaults = _.defaults(fixtures.user(), {
            store_name: api.config.app.user_store_name
                     || api.config.app.name
        });
        _.defaults(data.user, defaults);

        var user = new User(self.im);
        user.init(data.user.addr, data.user);

        if (exists) {
            api.kv.store[user.key()] = _.defaults(
                api.kv.store[user.key()] || {},
                user.serialize());
        }

        self.tester.data.user = user;
    };
    
    self.finalise.msg = function(api, data) {
        data.msg.from_addr = data.user.addr;

        self.tester.data.msg = _.defaults(
            self.tester.data.msg || {},
            data.msg);
    };

    self.methods.setup = function(fn) {
        /**function:AppTester.setup(fn)

        Allows custom setting up of the sandbox application's config and data.

        :param function fn:
            function to be used to set up the sandbox application. Takes the
            form ``func(api)``, where ``api`` is the tester's api instance and
            ``this`` is the :class:`AppTester` instance. May return a promise.

        .. code-block:: javascript

            tester.setup(function(api) {
                api.config.store.foo = 'bar';
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

        
        If any properties other than ``addr`` are given, :class:`AppTester
        assumes that this is an existing user. This effects whether a
        :class:`UserNewEvent` or :class:`UserLoadEvent` will be fired
        during the sandbox run.
        */
        /**function:AppTester.setup.user(fn)

        Passes the currently stored user data to the function ``fn``, then set
        the stored user data to the function's result.

        :param function fn:
            function of the form ``func(user)``, where ``user`` is the
            currently stored user data object and ``this`` is the
            :class:`AppTester` instance. The stored user data is set with
            ``fn``'s result. May return its result via a promise.

        .. code-block:: javascript

            tester.setup.user(function(user) {
                user.addr = '+81';
                user.lang = 'jp';
                return user;
            })

        If any properties other than ``addr`` are given, :class:`AppTester
        assumes that this is an existing user. This effects whether a
        :class:`UserNewEvent` or :class:`UserLoadEvent` will be fired
        during the sandbox run.
        */
        if (typeof v == 'object') {
            _.extend(self.data.user, v);
            return;
        } else {
            return Q(v.bind(self.tester))
                .fcall(self.data.user)
                .then(function(result) {
                    self.data.user = result;
                });
        }
    };

    self.methods.setup.user.lang = function(lang) {
        /**function:AppTester.setup.user.lang(lang)

        Sets the user's language code.

        :param string lang:
            the user's new language code (eg, 'en' or 'af')

        .. code-block:: javascript

            tester.setup.user.lang('af');
        */
        self.data.user.lang = lang; 
    };

    self.methods.setup.user.addr = function(addr) {
        /**function:AppTester.setup.user.addr(addr)

        Sets the from address of the user sending a message received by the
        sandbox app.

        :param string addr:
            the user's new from address

        .. code-block:: javascript

            tester.setup.user.addr('+27987654321');
        */
        self.data.user.addr = addr; 
    };

    self.methods.setup.user.state = function(name, opts) {
        /**function:AppTester.setup.user.state(state_name[, opts])

        Sets the state most recently visited by the user using a state name.

        :param string name:
            The name of the state.
        :param object opts.metadata:
            metadata associated with the state. Optional.
        :param object opts.creator_opts:
            options to be given to the creator associated with the given state
            name. Optional.

        .. code-block:: javascript

            tester.setup.user.state('initial_state', {
                metadata: {foo: 'bar'},
                creator_opts: {baz: 'qux'}
            });
        */
        /**function:AppTester.setup.user.state(opts)

        Sets the state most recently visited by the user using options.

        :param string opts.name:
            The name of the state.
        :param object opts.metadata:
            Optional state metadata.
        :param object opts.creator_opts:
            options to be given to the creator associated with the given state
            name. Optional.

        .. code-block:: javascript

            tester.setup.user.state({
                name: 'initial_state',
                metadata: {foo: 'bar'},
                creator_opts: {baz: 'qux'}
            });
        */
        var state = new UserStateData(name, opts);
        self.data.user.state = state.serialize();
    };

    self.methods.setup.user.state.metadata = function(metadata) {
        /**function:AppTester.setup.user.state.metadata(metadata)

        Updates the metadata of the state most recently visited by the user.
        
        :param object metadata:
            The new metadata to update the current state metadata with. Any
            properties in the current metadata with the same names as
            properties in the new metadata will overwritten.

        .. code-block:: javascript

            tester.setup.user.state.metadata({foo: 'bar'});
        */
        var state = self.data.user.state;
        state.metadata = _.extend(state.metadata || {}, metadata);
    };

    self.methods.setup.user.state.creator_opts = function(opts) {
        /**function:AppTester.setup.user.state.creator_opts(opts)

        Updates the options passed to the state creator of the state most
        recently visited by the user.

        :param object opts:
            The new options to update the current creator options with. Any
            properties in the current creator options with the same names as
            properties in the new options will overwritten.

         States are created typically created twice (on the first sandbox run
         when we switch to the state, and on the next sandbox run when we give
         the state the user's input). This makes this setup method useful for
         setting up the options for the second sandbox run.

        .. code-block:: javascript

            tester.setup.user.state.creator_opts({foo: 'bar'});
        */
        var state = self.data.user.state;
        state.creator_opts = _.extend(state.creator_opts || {}, opts);
    };

    self.methods.setup.user.answers = function(answers) {
        /**function:AppTester.setup.user.answers(answers)

        Sets the user's answers to states already encountered by the user.

        :param object answers:
            (state name, answer) pairs for each state the user has encountered
            and answered

        .. code-block:: javascript

            tester.setup.user.answers({
                initial_state: 'coffee',
                coffee_state: 'yes'
            });
        */
        var user = _.defaults(self.data.user, {answers: {}});
        user.answers = _.defaults(user.answers, answers);
    };

    self.methods.setup.user.answer = function(state_name, answer) {
        /**function:AppTester.setup.user.answer(state_name, answer)

        Sets the user's answer to a state already encountered.

        :param string state_name:
            the name of the state to set an answer for.
        :param string answer:
            the answer given by the user for the state

        .. code-block:: javascript

            tester.setup.user.answer('initial_state', 'coffee');
        */
        var user = _.defaults(self.data.user, {answers: {}});
        user.answers[state_name] = answer;
    };

    self.methods.setup.user.metadata = function(metadata) {
        /**function:AppTester.setup.user.metadata(metadata)

        Updates the user's metadata. Any properties in the current metadata
        with the same names as properties in the new metadata will overwritten.

        :param object metadata:
            The new metadata to update the current user metadata with.

        .. code-block:: javascript

            tester.setup.user.metadata({foo: 'bar'});
        */
        var user = _.defaults(self.data.user, {metadata: {}});
        user.metadata = _.extend(user.metadata, metadata);
    };

    self.methods.setup.config = function(v, opts) {
        /**function:AppTester.setup.config(obj)

        Updates the sandbox config with the properties given in ``obj``.

        :param object obj:
            the properties to update the current app config with.
        :param object opts.is_json:
            whether these config options should be serialized to JSON.

        .. code-block:: javascript

            tester.setup.config({foo: 'bar'});
        */
        opts = _.defaults(opts || {}, {
            is_json: true
        });
        _.extend(self.api.config.store, v);
        _.forEach(v, function(value, key) {
            self.api.config.is_json[key] = opts.is_json;
        });
    };

    self.methods.setup.config.app = function(v) {
        /**function:AppTester.setup.config(obj)

        Updates the sandbox's app config (the ``'config'`` field in the sandbox
        config) with the properties given in ``obj``.

        :param object obj:
            the properties to update the current app config with.

        .. code-block:: javascript

            tester.setup.config.app({name: 'some_amazing_app'});
        */
        _.extend(self.api.config.app, v);
    };

    self.methods.setup.kv = function(v) {
        /**function:AppTester.setup.kv(obj)

        Updates the app's kv store with the properties given in ``obj``.

        :param object obj:
            the properties to update the current kv store with.

        .. code-block:: javascript

            tester.setup.kv({foo: 'bar'});
        */
        _.extend(self.api.kv.store, v);
    };

    self.methods.setup.char_limit = function(n) {
        /**function:AppTester.setup.char_limit(n)

        Sets the character limit checked during the checking phase of the
        tester run. The default character limit is 160.

        :param object n:
            the new character limit to set.

        .. code-block:: javascript

            tester.setup.char_limit(20);
        */
        self.data.char_limit = n;
    };
});


this.SetupTasks = SetupTasks;
