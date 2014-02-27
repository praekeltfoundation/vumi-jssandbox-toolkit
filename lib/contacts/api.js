var _ = require("lodash");

var utils = require("../utils");
var BaseError = utils.BaseError;

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
        if (!_.isString(self.key)) {
            throw new ContactError(self, [
                "Contact has a key of type",
                "'" + typeof self.key + "'",
                "instead of 'string': " + self.key
            ].join(' '));
        }

        if (!_.isString(self.user_account)) {
            throw new ContactError(self, [
                "Contact has a user_account of type",
                "'" + typeof self.user_account + "'",
                "instead of 'string': " + self.user_account
            ].join(' '));
        }

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


this.Contact = Contact;
this.ContactError = ContactError;
