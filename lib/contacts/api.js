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
        The name of the contact's account on vumi go.
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
    :param object attrs.extras:
        A data object for additional, app-specific information about a contact.
        Both the keys are values need to be strings. Optional.
    :param array attrs.groups:
        A unique identifier for looking up the contact. Optional.
    */

    self.attrs = _(attrs).defaults({
        extras: {},
        groups: []
    });

    self.validate = function() {
    };

    self.serialize = function() {
    };
});


this.Contact = Contact;
this.ContactError = ContactError;
