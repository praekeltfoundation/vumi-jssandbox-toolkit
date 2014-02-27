var _ = require("lodash");

var utils = require("../utils");
var BaseError = utils.BaseError;

var events = require("../events");
var Eventable = events.Eventable;

var structs = require("../structs");
var Model = structs.Model;


var ContactError = BaseError.extend(function(self, contact, message) {
    /**class:ContactError(contact, message)

    Thrown when an error occurs while interacting with a :class:`Contact`.

    :param Contact contact: the contact that associated to the error.
    :param string message: the reason for the error.
    */
    self.name = "ContactError";
    self.contact = contact;
    self.message = message;
});

var Contact = Model.extend(function(self, attrs) {
    /**class:Contact(attrs)

    Holds long-term information about a user interacting with the application.

    :param string attrs.key:
        A unique identifier for looking up the contact.
    :param string attrs.user_account:
        The name of the vumi go account that the contact is stored under.
    :param string attrs.msisdn:
        The contact's msisdn.
    :param string attrs.gtalk_id:
        The contact's gtalk address. Optional.
    :param string attrs.facebook_id:
        The contact's facebook address. Optional.
    :param string attrs.twitter_handle:
        The contact's twitter handle. Optional.
    :param string attrs.name:
        The contact's name. Optional.
    :param string attrs.surname:
        The contact's surname. Optional.
    :param object attrs.extra:
        A data object for additional, app-specific information about a contact.
        Both the keys and values need to be strings. Optional.
    :param array attrs.groups:
        A unique identifier for looking up the contact. Optional.
    */
    Model.call(self);

    self.cls.defaults = {
        extra: {},
        groups: [],
        subscriptions: {}
    };

    self.do.validate = function() {
        /**:Contact.do.validate()

        Validates a contact, throwing a :class:`ContactError` if one of its
        attributes are invalid.
        */
        if (!_.isString(self.msisdn)) {
            throw new ContactError(self, [
                "Contact has an msisdn of type",
                "'" + typeof self.msisdn + "'",
                "instead of 'string': " + self.msisdn
            ].join(' '));
        }

        _.each(self.extra, self.do.validate.extra);
        _.each(self.groups, self.do.validate.group);
        _.each(self.subscriptions, self.do.validate.subscriptions);
    };

    self.do.validate.extra = function(value, name) {
        if (!_.isString(value)) {
            throw new ContactError(self, [
                "Contact extra '" + name + "' has a value of type",
                "'" + typeof value + "' instead of 'string': " + value
            ].join(' '));
        }
    };

    self.do.validate.subscriptions = function(value, name) {
        if (!_.isString(value)) {
            throw new ContactError(self, [
                "Contact subscription '" + name + "' has a value of type",
                "'" + typeof value + "' instead of 'string': " + value
            ].join(' '));
        }
    };

    self.do.validate.group = function(group) {
        if (!_.isString(group)) {
            throw new ContactError(self, [
                "Contact has a group of type '" + typeof group + "'",
                "instead of 'string': " + group
            ].join(' '));
        }
    };

    /**:Contact.do.reset(attrs)

    Resets a contact's attributes to `attrs`. All the contact's current
    attributes will be lost.

    :param object attrs:
        the attributes to reset the contact with.
    */
    self.do.reset;

    /**:Contact.serialize()

    Returns a deep copy of the contact's attributes.
    */
    self.do.serialize;

    self.do.init(attrs);
});

var ContactStore = Eventable.extend(function(self, im) {
    /**:ContactStore(im)

    Provides 'ORM-like' access to the sandbox's contacts resource, handling the
    raw contact resource api requests and allowing people to interact with
    their contacts as :class:`Contact` instances.

    :param InteractionMachine im:
        The interaction machine
    */
    Eventable.call(self);
    self.im = im;

    self.setup = function(opts) {
        /**ContactStore.setup(opts)

        Sets up the store.

        :param opts.delivery class:
            The fallback delivery class to use when retrieving contacts by
            their address. :class:`InteractionMachine` sets up its
            :class:`ContactStore` with the delivery class given its config,
            or ``'ussd'`` if not specified.
        */
        opts = _.defaults(opts || {}, {delivery_class: 'ussd'});
    };

    self.delivery_class = opts.delivery_class;

    self.request = function(name, cmd) {
        /**:ContactStore.request(name, cmd)

        Makes raw requests to the api's contact resource.

        :param string name:
            The name of the contact api method (for eg, ``'get'``)
        :param object cmd:
            The request's command data
        */
        return self.im.api_request('contacts.' + name, cmd);
    };

    self.get = function(addr, opts) {
        /**:ContactStore.get(addr[, opts])

        Retrieves a contact by its address for a particular delivery class,
        returning a corresponding :class:`Contact` via a promise.

        :param boolean opts.create:
            Create the contact if it does not yet exist. Defaults to ``false``.
        :param string delivery_class:
            The delivery class corresponding to the given address. If not
            specified, :class:`ContactStore` tries uses its fallback,
            :attr:`ContactStore.delivery_class`.

        .. code-block:: javascript

            self.im
                .contacts.get('+27731234567', 'ussd')
                .then(function(contact) {
                    console.log(contact instanceof Contact);
                });
        */
        opts = _.defaults(opts || {}, {
            create: false,
            delivery_class: self.delivery_class
        });
    };

    self.get_by_key = function(key) {
        /**:ContactStore.get(key)

        Retrieves a contact by its key, returning a corresponding
        :class:`Contact` via a promise.
        
        :param string key:
            The contact's key.

        .. code-block:: javascript

            self.im.contacts.get('1234').then(function(contact) {
                console.log(contact instanceof Contact);
            });
        */
    };

    self.for_user = function(opts) {
        /**:ContactStore.for_user(opts)

        Retrieves a contact for the the current user in the
        :class:`InteractionMachine`, returning a corresponding
        :class:`Contact` via a promise. If no contact exists for the
        user, a contact is created.

        :param boolean opts.create:
            Whether to create a contact for the user if it does not yet exist.
            Defaults to ``true``.
        :param string opts.delivery_class:
            The delivery class corresponding to the current user's address. If
            not specified, :class:`ContactStore` tries uses its fallback,
            :attr:`ContactStore.delivery_class`.

        .. code-block:: javascript

            self.im.contacts.for_user().then(function(contact) {
                console.log(contact instanceof Contact);
            });
        */
        opts = _.defaults(opts || {}, {create: true});
    };

    self.search = function(query) {
        /**:ContactStore.search(query)
        
        Searches for contacts matching the given Lucene search query, returning
        an array of the matching :class:`Contact` instances via a promise. Note
        that this can be a fairly heavy operation. If only the contact keys are
        needed, please use :meth:`ContactStore.search_keys` instead.

        :param string query:
            The Lucene query to perform

        .. code-block:: javascript

            self.im.contacts.search('name:"Moog"').then(function(contacts) {
                contacts.forEach(function(contact) {
                    console.log(contact instanceof Contact);
                });
            });
        */
    };

    self.search_keys = function(query) {
        /**:ContactStore.search(query)

        Searches for contacts matching the given Lucene search query, returning
        an array of the contacts' keys via a promise.

        :param string query:
            The Lucene query to perform

        .. code-block:: javascript

            self.im.contacts.search_keys('name:"Moog"').then(function(keys) {
                keys.forEach(function(key) {
                    console.log(typeof key == 'string');
                });
            });
        */
    };

    self.save = function(contact) {
        /**:ContactStore.save(contact)

        Saves the given contact to the store, returning a promise that is
        fulfilled once the operation completes.

        :param Contact contact:
            The contact to be saved
        */
    };
});


this.Contact = Contact;
this.ContactStore = ContactStore;
this.ContactError = ContactError;
this.ContactStoreError = ContactStoreError;
