var assert = require('assert');

var utils = require('../utils');
var Extendable = utils.Extendable;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;


var CheckTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.methods.check = function(fn) {
        /**:AppTester.check(fn)

        Allows custom assertions to be done after a sandbox run.

        :param function fn:
            function that will be performing the assertions. Takes the form
            ``func(im, api, app)``, where ``im` is the tester's
            :class:`InteractionMachine` instance, ``api`` is the tester's
            api instance (by default an instance of :class:`DummyApi`) and
            ``app`` is the sandbox app being tested. May return a promise.

        .. code-block:: javascript

            tester.check(function(im, api, app) {
                assert.equal(im.state.name, 'initial_state');
            });
        */
        return fn.call(self.tester, self.im, self.api, self.app);
    };

    self.methods.check.interaction = function(opts) {
        /**:AppTester.check.interaction(opts)

        Performs the checks typically done after a user has interacted with a
        sandbox app.

        :param string opts.state:
            the expected name of state that the interaction machine ended on at
            the end of the sandbox run.
        :param string opts.reply:
            the expected content of the reply message sent back to the user
            after the sandbox run. Optional.

        .. code-block:: javascript

            tester.check.interaction({
                state: 'initial_state',
                reply: 'Tea or coffee?'
            });
        */
        self.methods.check.state(opts.state);

        if ('reply' in opts) {
            self.methods.check.reply(opts.reply);
        }
    };

    self.methods.check.user = function(v) {
        /**function:AppTester.check.user(obj)

        Checks that the properties of the user after a sandbox run are equal to
        the expected properties given in ``obj``.

        :param object obj:
            the properties to check the user against

        .. code-block:: javascript

            tester.check.user({
                state: {name: 'coffee_state'},
                answers: {initial_state: 'coffee'}
            });
        */
        /**function:AppTester.check.user(fn)

        Passes the current user instance to the function ``fn``, allowing
        custom assertions to be done on the user.

        :param function fn:
            function of the form ``func(user)``, where ``user`` is the
            current user instance.

        .. code-block:: javascript

            tester.check.user(function(user) {
                assert.equal(user.state.name, 'coffee_state');
                assert.equal(user.get_answer('initial_state', 'coffee');
            })
        */
    };

    self.methods.check.user.properties = function(v) {
    };

    self.methods.check.user.answers = function(answers) {
        /**function:AppTester.check.user.answers(answers)

        Checks that the user's answers to states already encountered by the
        user match the expected ``answers``.

        :param object answers:
            (``state_name``, ``answer``) pairs for each state the user has
            encountered and answered

        .. code-block:: javascript

            tester.check.user.answers({
                initial_state: 'coffee',
                coffee_state: 'yes'
            });
        */
    };

    self.methods.check.user.answer = function(state_name, answer) {
        /**function:AppTester.check.user.answer(state_name, answer)

        Checks that the user's answer to a state already encountered matches
        the expected ``answer``.

        :param string state_name:
            the name of the state to check the answer of.
        :param string answer:
            the expected answer by the user for the state

        .. code-block:: javascript

            tester.check.user.answer('initial_state', 'coffee');
        */
    };

    self.methods.check.state = function(v, metadata) {
        /**function:AppTester.check.state(name[, metadata])

        Checks that the name (and optionally, metadata) of the interaction
        machine's current state after a sandbox run equals the expected
        ``name`` (and ``metadata``, if given).

        :param object name:
            the expected name of the current state
        :param object metadata:
            the expected metadata of the current state. Optional.

        .. code-block:: javascript

            tester.check.state('coffee_state');
            tester.check.state('coffee_state', {foo: 'bar'});
        */
        /**function:AppTester.check.state(obj)

        Checks properties of the interaction machine's current state after a
        sandbox run are equal to the expected properties given in ``obj``.

        :param object obj:
            the properties to check the state against

        .. code-block:: javascript

            tester.check.state({
                name: 'coffee_state'
            });
        */
        /**function:AppTester.check.state(fn)

        Passes the interactin machine's current state instance after a sandbox
        run to the function ``fn``, allowing custom assertions to be done on
        the state.

        :param function fn:
            function of the form ``func(state)``, where ``state`` is the
            current state instance.

        .. code-block:: javascript

            tester.check.state(function(state) {
                assert.equal(state.name, 'coffee_state');
            })
        */
    };

    self.methods.check.state.metadata = function(metadata) {
        /**function:AppTester.check.state.metadata(metadata)

        Checks that the metadata of the interaction machine's current state
        after a sandbox run equals the expected ``metadata``.

        :param object metadata:
            the expected metadata of the current state

        .. code-block:: javascript

            tester.check.state.metadata({foo: 'bar'});
        */
    };

    self.methods.check.reply = function(v) {
        /**function:AppTester.check.reply(content)

        Checks that the content of the reply sent back to the user during the
        sandbox run equals the expected ``content``. Alias to
        :func:`AppTester.check.reply.content`.

        :param string content:
            the expected content of the sent out reply.

        .. code-block:: javascript

            tester.check.reply('Tea or coffee?');
        */
        /**function:AppTester.check.reply(obj)

        Checks that the properties of the reply sent back to the user during
        the sandbox run are equal to the expected properties given in ``obj``.

        :param object obj:
            the properties to check the reply against

        .. code-block:: javascript

            tester.check.reply({
                content: 'Tea or coffee?'
            });
        */
        /**function:AppTester.check.reply(fn)

        Passes the reply sent back to the user during the sandbox
        run to the function ``fn``, allowing custom assertions to be done on
        the reply.

        :param function fn:
            function of the form ``func(reply)``, where ``reply`` is the
            sent out reply.

        .. code-block:: javascript

            tester.check.reply(function(state) {
                assert.equal(reply.content, 'Tea or coffee?');
            })
        */
    };

    self.methods.check.reply.content = function(content) {
        /**function:AppTester.check.reply.content(content)

        Checks that the content of the reply sent back to the user during the
        sandbox run equals the expected ``content``. Alias to
        :func:`AppTester.check.reply.content`.

        :param string content:
            the expected content of the sent out reply.

        .. code-block:: javascript

            tester.check.reply.content('Tea or coffee?');
        */
    };

    self.methods.check.reply.shorter_than = function(n) {
        /**function:AppTester.check.reply.shorter_than(n)

        Checks that the content of the reply sent back to the user does not
        exceed the character count given by ``n``.

        :param integer n:
            the character count that the sent out reply's content is expected
            to not exceed.

        .. code-block:: javascript

            tester.check.reply.shorter_than(10);
        */
    };

    self.methods.check.no_reply = function() {
        /**function:AppTester.check.reply.content(content)

        Checks that no reply was sent back to the user.

        .. code-block:: javascript

            tester.check.no_reply();
        */
    };
});


this.CheckTasks = CheckTasks;
