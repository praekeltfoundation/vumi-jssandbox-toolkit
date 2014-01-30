var Q = require('q');

var utils = require('../utils');
var fixtures = require('./fixtures');

var tasks = require('./tasks');
var AppTesterTasks = tasks.AppTesterTasks;
var TaskMethodError = tasks.TaskMethodError;

var interaction_machine = require('../interaction_machine');
var InboundMessageEvent = interaction_machine.InboundMessageEvent;


var InteractionTasks = AppTesterTasks.extend(function(self, tester) {
    AppTesterTasks.call(self, tester);

    self.validate = function() {
        var checks = self.tester.tasks.get('checks');

        if (checks.length) {
            throw new TaskMethodError(name,
                "Interaction tasks cannot be scheduled after check tasks");
        }
    };

    self.before = function() {
        self.data.msg = tester.data.msg || {};
    };

    self.after = function() {
        if (!self.should_send()) { return; }
        utils.set_defaults(self.data.msg, fixtures.msg());
        return self.send(self.data.msg);
    };

    self.should_send = function() {
        return !!Object.keys(self.data.msg).length;
    };

    self.send = function(msg) {
        var e = new InboundMessageEvent(self.im, {msg: msg});

        return self
            .im.emit(e)
            .then(function() {
                return self.im.done();
            })
            .catch(function(e) {
                return self.im.err(e).then(function() {
                    throw e;
                });
            });
    };

    self.methods.input = function(v) {
        /**function:AppTester.input(content)

        Updates the content of the message to be sent from the user into the
        sandbox. Alias to :func:`AppTester.input.content`.

        :param string content:
            the new content of the message to be sent

        .. code-block:: javascript

            tester.input('coffee');
        */
        /**function:AppTester.input()

        Updates the content of the message to be sent from the user into the
        sandbox to be null and defaults the message's session event type to
        'new'. Typically used to test starting up a session with the user.
        
        .. code-block:: javascript

            tester.input();
        */
        /**function:AppTester.input(obj)

        Updates the message to be sent from the user into the sandbox with the
        properties given in ``obj``.
        
        :param object obj:
            the properties to update on the message to be sent

        .. code-block:: javascript

            tester.input({
                content: 'coffee',
                session_event: 'resume'
            });
        */
        /**function:AppTester.input(fn)

        Passes the current message data to be sent from the user into the
        sandbox into the function ``fn``, then updates it with the function's
        result.

        :param function fn:
            function of the form ``func(msg)``, where ``msg`` is the current
            message data. The current message is updated with ``fn``'s result.
            May return its result via a promise.

        .. code-block:: javascript

            tester.input(function(msg) {
                msg.content = 'coffee';
                return msg;
            })
        */
    };

    self.methods.input.content = function(content) {
        /**function:AppTester.input.content(content)

        Updates the content of the message to be sent from the user into the
        sandbox. Alias to :func:`AppTester.input.content`.

        :param string content:
            the new content of the message to be sent

        .. code-block:: javascript

            tester.input.content('coffee');
        */
    };

    self.methods.input.session_event = function(session_event) {
        /**function:AppTester.input.session_event(session_event)

        Updates the session event of the message to be sent from the user into
        the sandbox.

        :param string session_event:
            the session event of the message to be sent.

        The following session event values are recognised:

            * ``'new'``: used to signal the start of the session, where the
            session has been initiated by the user. The content of the
            message is irrelevant.

            * ``'resume'``: a common message sent in from the user during a
            session

            * ``'close'``: used to signal the end of the session, where the
            session has been terminated by the user. The content of the
            message is irrelevant.

        .. code-block:: javascript

            tester.input.session_event('resume');
        */
    };
});


this.InteractionTasks = InteractionTasks;
