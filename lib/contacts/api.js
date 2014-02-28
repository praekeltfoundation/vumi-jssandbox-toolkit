var _ = require("lodash");

var structs = require("../structs");
var Model = structs.Model;
var ValidationError = structs.ValidationError;


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
        A list of keys, each belonging to a group that this contact is a member
        of. Optional.
    */
    Model.call(self);

    self.cls.defaults = {
        extra: {},
        groups: [],
        subscriptions: {}
    };

    self.do.validate = function() {
        /**:Contact.do.validate()

        Validates a contact, throwing a :class:`ValidationError` if one of its
        attributes are invalid.
        */
        if (!_.isString(self.msisdn)) {
            throw new ValidationError(self, [
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
            throw new ValidationError(self, [
                "Contact extra '" + name + "' has a value of type",
                "'" + typeof value + "' instead of 'string': " + value
            ].join(' '));
        }
    };

    self.do.validate.subscriptions = function(value, name) {
        if (!_.isString(value)) {
            throw new ValidationError(self, [
                "Contact subscription '" + name + "' has a value of type",
                "'" + typeof value + "' instead of 'string': " + value
            ].join(' '));
        }
    };

    self.do.validate.group = function(group) {
        if (!_.isString(group)) {
            throw new ValidationError(self, [
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

var Group = Model.extend(function(self, attrs) {
    /**class:Group(attrs)

    Holds information about a group of contacts.

        :param string attrs.key:
            a unique identifier for looking up the contact.
        :param string attrs.user_account:
            the name of the vumi go account that owns this group.
        :param string attrs.name:
            a human-readable name for the group.
        :param string attrs.query:
            the contact search query that determines the contacts in this
            group. Optional.
    */
    Model.call(self);

    self.cls.defaults = {
        query: null
    };

    self.do.validate = function() {
        /**:Group.do.validate()

        Validates a group, throwing a :class:`ValidationError` if one of its
        attributes are invalid.
        */
        if (!_.isString(self.key)) {
            throw new ValidationError(self, [
                "Group has a key of type '" + typeof self.key + "'",
                "instead of 'string': " + self.key
            ].join(' '));
        }

        if (!_.isString(self.user_account)) {
            throw new ValidationError(self, [
                "Group has a user_account of type",
                "'" + typeof self.user_account + "'",
                "instead of 'string': " + self.user_account
            ].join(' '));
        }

        if (!_.isString(self.name)) {
            throw new ValidationError(self, [
                "Group has a name of type '" + typeof self.name + "'",
                "instead of 'string': " + self.name
            ].join(' '));
        }

        if (!_.isNull(self.query) && !_.isString(self.query)) {
            throw new ValidationError(self, [
                "Group has a query of type",
                "'" + typeof self.query + "'",
                "instead of 'string': " + self.query
            ].join(' '));
        }
    };

    /**:Group.do.reset(attrs)

    Resets a groups's attributes to `attrs`. All the groups's current
    attributes will be lost.

    :param object attrs:
        the attributes to reset the group with.
    */
    self.do.reset;


    /**:Group.serialize()

    Returns a deep copy of the group's attributes.
    */
    self.do.serialize;

    self.do.init(attrs);
});


this.Contact = Contact;
this.Group = Group;
