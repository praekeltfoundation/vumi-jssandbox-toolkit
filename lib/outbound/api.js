var _ = require('lodash');

var contacts = require('../contacts/api');
var Contact = contacts.Contact;

var events = require('../events');
var Eventable = events.Eventable;

var utils = require('../utils');


var OutboundHelper = Eventable.extend(function(self, im) {
    /**:OutboundHelper(im)

    Provides helpers for sending messages.

    :param InteractionMachine im:
        the interaction machine associated to the helper.
    */
    Eventable.call(self);
    self.im = im;

    /**attribute:OutboundHelper.delivery_class
    The fallback delivery class to use when sending to a :class:`Contact`.
    */
    self.delivery_class = null;

    self.determine_delivery_class = function(endpoint_name) {
        var endpoint = self.endpoints[endpoint_name];

        return endpoint && 'delivery_class' in endpoint
            ? endpoint.delivery_class
            : self.delivery_class;
    };
    
    self.addr_for_contact = function(contact, endpoint_name) {
        var delivery_class = self.determine_delivery_class(endpoint_name);
        var addr_type = utils.infer_addr_type(delivery_class);
        return utils.format_addr(contact[addr_type], addr_type);
    };

    self.setup = function(opts) {
        /**OutboundHelper.setup(opts)

        Sets up the helper.

        :param object opts.endpoints:
            Endpoint-specific configuration options.
        :param string opts.endpoints.<endpoint>.delivery_class
            The default delivery class to use for a particular endpoint.
        :param string opts.delivery_class:
            The fallback delivery class to use when sending to a
            :class:`Contact`. :class:`InteractionMachine` sets this using
            the app config's ``'delivery_class'`` property, or ``'ussd'``
            if not specified.
        */
        opts = _.defaults(opts || {}, {
            endpoints: {},
            delivery_class: 'ussd'
        });

        self.endpoints = opts.endpoints;
        self.delivery_class = opts.delivery_class;

        return self.emit.setup();
    };

    self.send = function(opts) {
        /**:OutboundHelper.send(opts)

        Sends a message to an address or contact.

        :type opts.to:
            string or :class:`Contact`.
        :param opts.to:
            The address or contact to send to.
        :param string opts.endpoint:
            The endpoint to send to over (for e.g. ``'sms'``). Needs to be one
            of the endpoints configured in the app's config.
        :param string opts.content:
            The content to be sent.
        :param string opts.delivery_class:
            The delivery class to send over for the contact (for e.g.  if
            ``'ussd'`` is given, the helper will send to the contact's the
            contact's ``'msisdn'`` address). If not given, uses the delivery
            class configured for ``endpoint`` in
            :attribute:`OutboundHelper.endpoints`, finally falling back to
            :attribute:`OutboundHelper.delivery_class`.  Irrelevant
            when ``opts.to`` is a string. See :meth:`ContactStore.get`
            for a list of the supported delivery classes.
        */
        var to_addr = opts.to instanceof Contact
            ? self.addr_for_contact(opts.to, opts.endpoint)
            : opts.to;

        return im.api_request('outbound.send_to_endpoint', {
            to_addr: to_addr,
            content: opts.content,
            endpoint: opts.endpoint
        });
    };

    self.send_to_user = function(opts) {
        /**:OutboundHelper.send_to_user(endpoint)

        Sends a message to the current user.

        :param string opts.endpoint:
            The endpoint to send to over (for e.g. ``'sms'``). Needs to be one
            of the endpoints configured in the app's config.
        :param string opts.content:
            The content to be sent.
        */
        opts.to = self.im.user.addr;
        return self.send(opts);
    };
});


this.OutboundHelper = OutboundHelper;
