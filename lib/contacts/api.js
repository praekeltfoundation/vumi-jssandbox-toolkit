var _ = require("underscore");

var utils = require("../utils");
var BaseError = utils.BaseError;
var Extendable = utils.Extendable;


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

var Contact = Extendable.extend(function(self, attrs) {
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

    self.reset = function(attrs) {
        /**:Contact.reset(attrs)

        Resets a contact's attributes to `attrs`. All the contact's current
        attributes will be lost.

        :param object attrs:
            the attributes to reset the contact with.
        */
        self.attrs = _(attrs).defaults({
            extra: {},
            groups: []
        });

        self.validate();
    };

    self.validate = function() {
        /**:Contact.validate()

        Validates a contact, throwing a :class:`ContactError` if one of its
        attributes are invalid.
        */
        _(self.attrs.extra).each(self.validate.extra);
        _(self.attrs.groups).each(self.validate.group);
    };

    self.validate.extra = function(value, name) {
        if (!_(name).isString()) {
            throw new ContactError(self, [
                "Contact has an extras name of type '" + typeof name + "'",
                "instead of 'string': " + name
            ].join(' '));
        }

        if (!_(value).isString()) {
            throw new ContactError(self, [
                "Contact extra '" + name + "' has a value of type",
                "'" + typeof value + "' instead of 'string': " + value
            ].join(' '));
        }
    };

    self.validate.group = function(group) {
        if (!_(group).isString()) {
            throw new ContactError(self, [
                "Contact has a group of type '" + typeof group + "'",
                "instead of 'string': " + group
            ].join(' '));
        }
    };

    self.serialize = function() {
        /**:Contact.serialize()

        Returns a shallow copy of the contact's attributes.
        */
        self.validate();

        var data =  _(self.attrs).clone();
        data.extra = _(data.extra).clone();
        data.groups = _(data.groups).clone();

        return data;
    };

    self.reset(attrs);
});


this.Contact = Contact;
this.ContactError = ContactError;
