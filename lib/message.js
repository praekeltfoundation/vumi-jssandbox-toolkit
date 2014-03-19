var utils = require('./utils');

var structs = require('./structs');
var Model = structs.Model;


var Message = Model.extend(function(self, attrs) {
    /**class:Message(attrs)

    Holds attributes of a message sent to or from the sandbox.
    */
    Model.call(self);

    /**attribute:Model.message_id
    A uuid for indentifying the message.
    */

    /**attribute:Model.content
    (``string or null``) The message's content. Optional, defaults to ``null``.
    */

    /**attribute:Model.from_addr
    (``string or null``) The address this message was sent from. Optional,
    defaults to ``null``.
    */
    /**attribute:Model.to_addr
    (``string or null``) The address this message was sent to. Optional,
    defaults to ``null``.
    */

    /**attribute:Model.timestamp
    (``string or null``) A timestamp for when the message was sent. Optional,
    defaults to the current utc time in the format
    ``'YYYY-MM-DD HH:mm:ss.SSSS'``. This format is parseable by `moment.js`_.

    .. _moment.js: http://momentjs.com/
    */

    /**attribute:Model.in_reply_to
    (``string or null``) The uuid of the message that this message is in reply
    to. Optional, defaults to ``null`` for non-replies.
    */

    /**attribute:Model.group
    (``string or null``) The group the messages was sent from. Optional,
    defaults to ``null``.
    */

    /**attribute:Model.helper_metadata
    (``object``) Contains application-specific data about a message.
    Optional, defaults to ``{}``.
    */

    /**attribute:Model.session_event
    (``string or null``)The session_event related to this message. Optional,
    defaults to ``null``. Allowed values:

        * ``null``: No session event.

        * ``'new'``: used to signal the start of
        the session, where the session has been initiated by the user. The
        content of the message is irrelevant.

        * ``'resume'``: a common message sent in from the user during a
          session

        * ``'close'``: used to signal the end of the session, where the
          session has been terminated by the user. The content of the message
          is irrelevant.
    */

    self.cls.defaults = {
        timestamp: utils.pyutc(),
        content: null,
        to_addr: null,
        from_addr: null,
        session_event: null,
        group: null,
        in_reply_to: null,
        helper_metadata: {}
    };

    self.do.init(attrs);
});


this.Message = Message;
