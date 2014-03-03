var utils = require('../utils');
var Extendable = utils.Extendable;


var OutboundHelper = Extendable.extend(function(self, im) {
    /**:OutboundHelper(im)

    Provides helpers for sending messages.

    :param InteractionMachine im:
        the interaction machine associated to the helper.
    */
    Eventable.call(self);
    self.im = im;

    /**attribute:OutboundHelper.endpoint
    The fallback endpoint to use when sending a message.
    */
    self.endpoint = null;

    /**attribute:OutboundHelper.delivery_class
    The fallback delivery class to use when sending to a :class:`Contact`.
    */
    self.delivery_class = null;

    self.setup = function(opts) {
        /**OutboundHelper.setup(opts)

        Sets up the helper.

        :param opts.endpoint:
            The fallback endpoint to use when sending a message.
            Defaults to ``'default'``.
        :param opts.delivery_class:
            The fallback delivery class to use when sending to a
            :class:`Contact`. :class:`InteractionMachine` sets up its
            :class:`OutboundHelper` with the delivery class given its
            config, or ``'ussd'`` if not specified.
        */
        opts = _.defaults(opts || {}, {
            endpoint: 'default',
            delivery_class: 'ussd'
        });
        self.delivery_class = opts.delivery_class;
        return self.emit.setup();
    };

    self.send_to = function() {
        /**:OutboundHelper.send_to(to_addr, endpoint)

        Sends a message to the given address.

        :param string to_addr:
            The address to send to
        :param string endpoint:
            The endpoint to send to over (for e.g. ``'sms'``).
        */
        /**:OutboundHelper.send_to(contact, endpoint, opts)

        Sends a message to the given contact.

        :param Contact contact:
            The contact to send to
        :param string endpoint:
            The endpoint to send to over (for e.g. ``'sms'``). Needs to be one
            of the endpoints configured in the conversation's config.
        :param string opts.delivery_class:
            The delivery class to send over for the contact (for e.g.  if
            ``'ussd'`` is given, the helper will send to the contact's the
            contact's ``'msisdn'`` address). If not given, uses the delivery
            class configured for ``endpoint`` in the app's config, finally
            falling back to :attribute:`OutboundHelper.delivery_class`.
        */
    };

    self.send_to_user = function(endpoint) {
        /**:OutboundHelper.send_to_user(endpoint)

        Sends a message to the current user.

        :param string endpoint:
            The endpoint to send to over (for e.g. ``'sms'``). Needs to be one
            of the endpoints configured in the conversation's config.
        */
    };
});


this.OutboundHelper = OutboundHelper;
