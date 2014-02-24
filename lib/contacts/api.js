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
    :param string msisdn:
        The contact's msisdn. Optional.
    :param string gtalk_id:
        The contact's gtalk address. Optional.
    :param string facebook_id:
        The contact's facebook address. Optional.
    :param string twitter_handle:
        The contact's twitter handle. Optional.
    :param string attrs.name:
        The contact's name. Optional.
    :param string attrs.surname:
        The contact's surname. Optional.
    :param object attrs.extra:
        A data object for additional,  app-specific information about a contact.
        Both the keys are values need to be strings. Optional.
    :param array attrs.groups:
        A unique identifier for looking up the contact. Optional.
    */

    self.attrs = _(attrs).defaults({
        extra: {},
        groups: []
    });

    self.validate = function() {
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
        self.validate();

        var data =  _(attrs).clone();
        data.extra = _(data.extra).clone();
        data.groups = _(data.groups).clone();

        return data;
    };
});


this.Contact = Contact;
this.ContactError = ContactError;
