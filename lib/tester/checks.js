var assert = require('assert');
var AssertionError = assert.AssertionError;

var utils = require('../utils');
var Extendable = utils.Extendable;

var user = require('../user');
var User = user.User;

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var TaskError = tasks.TaskError;


var CheckTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.get_replies = function() {
        return self.api.request_calls;
    };

    self.get_user = function() {
        var setup_user = self.tester.data.user;

        if (!setup_user) {
            throw new TaskError([
                "Cannot do any user checking,",
                "no user has been setup"].join(' '));
        }

        var data = self.api.kv_store[setup_user.key()];
        var user = new User(self.im);
        user.init(setup_user.addr, data);
        return user;
    };

    self.get_reply = function() {
        var replies = self.get_replies();

        self.assert.strictEqual(replies.length, 1, {
            msg: "Expecting a single reply from the app to the user"
        });

        return replies[0];
    };

    self.assertion = function(fn, opts) {
        try {
            fn();
        }
        catch(e) {
            if (e instanceof assert.AssertionError) {
                self.format_assertion_error(e, opts);
            } 

            throw e;
        }
    };

    self.format_assertion_error = function(e, opts) {
        opts = utils.set_defaults(opts || {}, {diff: true});

        // explicitly control whether we want a diff or not
        e.showDiff = opts.diff;

        // mocha does some regexing to determine whether to include both the
        // context message and a pretty diff. I assume it is done this way
        // since it isn't easy to determine this any other way given just an
        // AssertionError, and that it checks for ': expected' since chaijs
        // adds this (since so many people use chaijs, it was probably
        // requested enough that it was merged in). We want the message to
        // display regardless, so as a workaround we append the ': expected'
        // when showing the diff. Thankfully, the appended text isn't actually
        // displayed. https://github.com/visionmedia/mocha/pull/993
        if (opts.msg) {
            e.msg = opts.msg;

            e.message = opts.diff
                ? opts.msg + ': expected'
                : opts.msg;
        }
    };

    self.assert = function(v, opts) {
        opts = opts || {};
        opts = utils.set_defaults(opts, {diff: !opts.msg});

        self.assertion(function() {
            assert(v);
        }, opts);
    };

    self.assert.deepEqual = function(actual, expected, opts) {
        self.assertion(function() {
            assert.deepEqual(actual, expected);
        }, opts);
    };

    self.assert.strictEqual = function(actual, expected, opts) {
        self.assertion(function() {
            assert.strictEqual(actual, expected);
        }, opts);
    };

    self.assert.fail = function(opts) {
        opts = utils.set_defaults(opts || {}, {diff: false});

        self.assertion(function() {
            assert.fail(opts.actual, opts.expected, null, opts.op);
        }, opts);
    };

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
        the expected properties given in ``obj``. Alias to
        :func:`AppTester.check.user.properties`.

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
        custom assertions to be done on the user. May return a promise.

        :param function fn:
            function of the form ``func(user)``, where ``user`` is the
            current user instance.

        .. code-block:: javascript

            tester.check.user(function(user) {
                assert.equal(user.state.name, 'coffee_state');
                assert.equal(user.get_answer('initial_state', 'coffee');
            })
        */
        if (typeof v == 'object') {
            self.methods.check.user.properties(v);
            return;
        }
        else if (typeof v == 'function') {
            return v.call(self.tester, self.get_user());
        }
    };

    self.methods.check.user.properties = function(obj) {
        /**function:AppTester.check.user.properties(obj)

        Checks that the properties of the user after a sandbox run are equal to
        the expected properties given in ``obj``. Alias to
        :func:`AppTester.check.user.properties`.

        :param object obj:
            the properties to check the user against

        .. code-block:: javascript

            tester.check.user.properties({
                state: {name: 'coffee_state'},
                answers: {initial_state: 'coffee'}
            });
        */
        if ('state' in obj) {
            self.methods.check.state(utils.pop_prop(obj, 'state'));
        }

        if ('answers' in obj) {
            self.methods.check.user.answers(utils.pop_prop(obj, 'answers'));
        }

        var user = self.get_user().serialize();
        utils.each_prop(obj, function(value, key) {
            self.assert(key in user, {
                msg: "Unknown user property '" + key + "'"
            });
            
            var msg = "Unexpected value for user property '" + key + "'";
            if (typeof value == 'object') {
                self.assert.deepEqual(user[key], value, {msg: msg});
            }
            else {
                self.assert.strictEqual(user[key], value, {msg: msg});
            }
        });
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
        var user = self.get_user().serialize();
        self.assert.deepEqual(user.answers, answers, {
            msg: "Unexpected user answers"
        });
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
        var actual = self.get_user().get_answer(state_name);
        self.assert.strictEqual(actual, answer, {
            msg: "Unexpected user answer to state '" + state_name + "'"
        });
    };

    self.methods.check.state = function(v, metadata) {
        /**function:AppTester.check.state(name[, metadata])

        Checks that the name (and optionally, metadata) of the interaction
        machine's current state after a sandbox run equals the expected
        ``name`` (and ``metadata``, if given).

        :param string name:
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

        :param string obj.name:
            the expected name of the current state
        :param object obj.metadata:
            the expected metadata of the current state. Optional.

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
        var state = self.im.state;

        if (typeof v == 'function') {
            return v.call(self.tester, state);
        }
        else if (typeof v == 'string') {
            self.methods.check.state({
                name: v,
                metadata: metadata
            });
            return;
        }
        else if (typeof v == 'object') {
            self.assert.strictEqual(state.name, v.name, {
                msg: "Unexpected state name"
            });

            if (v.metadata) {
                self.methods.check.state.metadata(v.metadata);
            }

            return;
        }
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
        self.assert.deepEqual(self.im.state.metadata, metadata, {
            msg: "Unexpected state metadata"
        });
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
        /**function:AppTester.check.reply(re)

        Checks that the content of the reply sent back to the user during the
        sandbox run matches the regex.

        :param RegExp re:
            Regular expression to match the content of the sent out reply
            against.

        .. code-block:: javascript

            tester.check.reply.content(/Tea or coffee?/);
        */
        /**function:AppTester.check.reply(obj)

        Checks that the properties of the reply sent back to the user during
        the sandbox run are equal to the expected properties given in ``obj``.
        Alias to :func:`AppTester.check.reply.properties`

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

            tester.check.reply(function(reply) {
                assert.equal(reply.content, 'Tea or coffee?');
            })
        */
        if (typeof v == 'function') {
            return v.call(self.tester, self.get_reply());
        }
        else if (typeof v == 'string' || v instanceof RegExp) {
            self.methods.check.reply.content(v);
            return;
        }
        else if (typeof v == 'object') {
            self.methods.check.reply.properties(v);
            return;
        }
    };

    self.methods.check.reply.properties = function(obj) {
        /**function:AppTester.check.reply.properties(obj)

        Checks that the properties of the reply sent back to the user during
        the sandbox run are equal to the expected properties given in ``obj``.
        Alias to :func:`AppTester.check.reply.properties`

        :param object obj:
            the properties to check the reply against

        .. code-block:: javascript

            tester.check.reply.properties({
                content: 'Tea or coffee?'
            });
        */
        var reply = self.get_reply();

        if ('content' in obj) {
            self.methods.check.reply.content(utils.pop_prop(obj, 'content'));
        }

        utils.each_prop(obj, function(value, key) {
            self.assert(key in reply, {
                msg: "Unknown reply property '" + key + "'"
            });
            
            var msg = "Unexpected value for reply property '" + key + "'";
            if (typeof value == 'object') {
                self.assert.deepEqual(reply[key], value, {msg: msg});
            }
            else {
                self.assert.strictEqual(reply[key], value, {msg: msg});
            }
        });
    };

    self.methods.check.reply.content = function(v) {
        /**function:AppTester.check.reply.content(content)

        Checks that the content of the reply sent back to the user during the
        sandbox run equals the expected ``content``. Alias to
        :func:`AppTester.check.reply.content`.

        :param string content:
            the expected content of the sent out reply.

        .. code-block:: javascript

            tester.check.reply.content('Tea or coffee?');
        */
        /**function:AppTester.check.reply.content(re)

        Checks that the content of the reply sent back to the user during the
        sandbox run matches the regex. Alias to
        :func:`AppTester.check.reply.content`.

        :param RegExp re:
            Regular expression to match the content of the sent out reply
            against.

        .. code-block:: javascript

            tester.check.reply.content(/Tea or coffee?/);
        */
        if (v instanceof RegExp) {
            self.methods.check.reply.content.re(v);
        } else {
            self.methods.check.reply.content.str(v);
        }
    };

    self.methods.check.reply.content.re = function(re) {
        var reply = self.get_reply();
        re = new RegExp(re);

        self.assert(re.test(reply.content), {
            msg: [
                "Reply content '" + reply.content + "'",
                "did not match regular expression " + re
            ].join(' ')
        });
    };

    self.methods.check.reply.content.str = function(content) {
        var reply = self.get_reply();
        self.assert.strictEqual(reply.content, content, {
            msg: "Unexpected reply content"
        });
    };

    self.methods.check.reply.char_limit = function(n) {
        /**function:AppTester.check.reply.char_limit(n)

        Checks that the content of the reply sent back to the user does not
        exceed the character count given by ``n``.

        :param integer n:
            the character count that the sent out reply's content is expected
            to not exceed.

        .. code-block:: javascript

            tester.check.reply.char_limit(10);
        */
        var reply = self.get_reply();
        if (reply.content.length > n) {
            self.assert.fail({
                msg: [
                    "The reply content's character count was longer",
                    "than expected limit:",
                    reply.content.length + " > " + n
                ].join(' '),
                actual: reply.content.length,
                expected: n
            });
        }
    };

    self.methods.check.no_reply = function() {
        /**function:AppTester.check.reply.content(content)

        Checks that no reply was sent back to the user.

        .. code-block:: javascript

            tester.check.no_reply();
        */
        self.assert.deepEqual(self.get_replies(), [], {
            msg: "Expecting no replies from the app to the user"
        });
    };
});


this.CheckTasks = CheckTasks;
