var Q = require('q');
var _ = require('lodash');

var utils = require('../utils');
var tasks = require('./tasks');
var fixtures = require('./fixtures');
var AppTesterTasks = tasks.AppTesterTasks;
var TaskError = tasks.TaskError;
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
        self.data.msg = {};
        self.data.msgs = [];
    };

    self.after = function() {
        if (_.size(self.data.msg) && _.size(self.data.msgs)) {
            throw new TaskError([
                "AppTester expected either a single or multiple inputs",
                "but was given both."
            ].join(' '));
        }

        var defaults = {from_addr: self.tester.data.user.addr};
        return !self.data.msgs.length
            ? self.send(self.data.msg, defaults)
            : self.send.many(self.data.msgs, defaults);
    };

    self.send = function(msg, defaults) {
        var id = utils.uuid();
        _.defaults(msg, {message_id: id}, defaults || {}, fixtures.msg());
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

    self.send.many = function(msgs, defaults) {
        return self
            .send(_.defaults(msgs.shift(), defaults))
            .then(function() {
                if (!msgs.length) { return; }
                self.tester.reset.interaction();
                return self.send.many(msgs, defaults);
            });
    };

    self.make_msg = function(msg, defaults) {
        if (!_.isObject(msg)) {
            msg = {content: msg};
        }

        _.defaults(msg, defaults || {});

        if (!('session_event' in msg)) {
            msg.session_event = utils.exists(msg.content)
                ? 'resume'
                : 'new';
        }
        
        return msg;
    };

    self.methods.input = function(v) {
        /**function:AppTester.input(content)

        Updates the content of the message to be sent from the user into the
        sandbox. If the content is ``null`` or ``undefined``, defaults the
        message's session event to ``'new', or otherwise to ``'resume'``.

        :type content:
            string or null
        :param content:
            the new content of the message to be sent

        .. code-block:: javascript

            tester.input('coffee');
        */
        /**function:AppTester.input()

        Updates the content of the message to be sent from the user into the
        sandbox to be ``null`` and defaults the message's session event type to
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
        sandbox into the function ``fn``, then sets it with the function's
        result.

        :param function fn:
            function of the form ``func(msg)``, where ``msg`` is the current
            message data and ``this`` is the :class:`AppTester` instance. The
            current message is updated with ``fn``'s result.  May return its
            result via a promise.

        .. code-block:: javascript

            tester.input(function(msg) {
                msg.content = 'coffee';
                return msg;
            })
        */
        if (_.isFunction(v)) {
            return Q(v.bind(self.tester))
               .fcall(self.data.msg)
               .then(function(result) {
                   self.data.msg = result;
               });
        }

        v = !arguments.length
            ? null
            : v;

        self.data.msg = self.make_msg(v, self.data.msg);
    };

    self.methods.input.content = function(content) {
        /**function:AppTester.input.content(content)

        Updates the content of the message to be sent from the user into the
        sandbox. 

        :param string content:
            the new content of the message to be sent

        .. code-block:: javascript

            tester.input.content('coffee');
        */
        self.methods.input(content);
    };

    self.methods.inputs = function(v) {
        /**function:AppTester.inputs(input1[, input2[, ...]])

        Sets a collection of messages to be sent from the user into the
        sandbox. Each input corresponds to a new message in a new interaction.
        :class:`AppTester` setup methods will count for the first
        interaction, subsequent interactions will rely on api state from
        the previous interaction, and check methods will only happen after
        the last interaction.

        :param arguments input1, input2, ...:
            The messages to be given as input in each interaction. If an object
            is given for an input, the object's properties are used as the
            actual message properties. ``null`` or string inputs will be taken
            as the message content for that particular message.

        .. code-block:: javascript

            tester.inputs(null, 'coffee', '1', {content: '2'});
        */
        /**function:AppTester.inputs(fn)

        Passes the current messages to be sent from the user into the
        sandbox into the function ``fn``, then sets it with the function's
        result.

        :param function fn:
            function of the form ``func(msgs)``, where ``msgs`` is the current
            messages and ``this`` is the :class:`AppTester` instance. The
            current messages are updated with ``fn``'s result.  May return its
            result via a promise.

        .. code-block:: javascript

            tester.inputs(function(msgs) {
                return msgs.concat('coffee');
            })
        */
        if (_.isFunction(v)) {
            return Q(v.bind(self.tester))
               .fcall(self.data.msgs)
               .then(function(result) {
                   self.data.msgs = (result || []).map(self.make_msg);
               });
        }

        self.data.msgs = _.map(arguments, function(msg) {
            return self.make_msg(msg);
        });
    };

    self.methods.start = function() {
        /**function:AppTester.start()

        Updates the content of the message to be sent from the user into the
        sandbox to be null and defaults the message's session event type to
        'new'. Typically used to test starting up a session with the user.

        .. code-block:: javascript

            tester.start();
        */
        self.methods.input(null);
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
        self.data.msg.session_event = session_event;
    };
});


this.InteractionTasks = InteractionTasks;
