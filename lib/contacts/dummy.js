var _ = require('lodash');

var api = require('./api');
var utils = require('../utils');
var resources = require('../dummy/resources');

var Contact = api.Contact;
var Group = api.Group;
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var DummyContactsResource = DummyResource.extend(function(self, name, opts) {
    /**class:DummyContactsResource(name)
    
    Handles api requests to the contacts resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    */
    DummyResource.call(self, name);

    /**attribute:DummyContactsResource.store
    A list of the resource's currently stored contacts.
    */
    self.store = [];

    /**attribute:DummyContactsResource.search_results
    An object mapping expected search queries to an array of the matching keys.
    */
    self.search_results = {};

    self.create = function(attrs) {
        /**DummyContactsResource.create(attrs)

        Helper for creating a :class:`Contact` with the given attributes (along
        with sensible defaults where possible)

        :param object attrs:
            The attributes to create a :class:`Contact` with.
        */
        attrs = _.defaults(attrs || {}, {
            created_at: utils.now(),
            user_account: utils.uuid(),
            key: utils.uuid(),
            msisdn: 'unknown',
            name: null,
            surname: null,
            email_address: null,
            dob: null,
            twitter_handle: null,
            facebook_id: null,
            bbm_pin: null,
            gtalk_id: null
        });

        return new Contact(attrs);
    };

    self.add = function(contact) {
        /**:DummyContactsResource.add(contact)

        Adds an already created contact to the resource's store.

        :param Contact contact:
            The contact to add.
        */
        /**:DummyContactsResource.add(attrs)
        Adds an contact to the resource via a data object.

        :param object attrs:
            The attributes to initialise a contact with.
        */
        if (!(contact instanceof Contact)) {
            contact = self.create(contact);
        }

        self.store.push(contact);
        return contact;
    };

    self._bad_delivery_class = function(cmd) {
        return new DummyResourceError([
            "Unsupported delivery class",
            "(got: " + cmd.delivery_class + " with address " + cmd.addr + ")"
        ].join(' '));
    };

    self.serialize_contact = function(contact) {
        contact = contact.do.serialize();

        _.each(contact.extra || {}, function(v, k) {
            contact['extras-' + k] = v;
        });

        _.each(contact.subscription || {}, function(v, k) {
            contact['subscription-' + k] = v;
        });

        delete contact.extra;
        delete contact.subscription;
        return contact;
    };

    self.handlers.get = function(cmd) {
        var type = utils.infer_addr_type(cmd.delivery_class);

        if (!type) {
            throw self._bad_delivery_class(cmd);
        }

        var attrs = {};
        attrs[type] = utils.format_addr(cmd.addr, type);

        var contact = _.find(self.store, attrs);
        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        return {
            success: true,
            contact: self.serialize_contact(contact)
        };
    };

    self.handlers.get_by_key = function(cmd) {
        var contact = _.find(self.store, {key: cmd.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        return {
            success: true,
            contact: self.serialize_contact(contact) 
        };
    };

    self.handlers.get_or_create = function(cmd) {
        var type = utils.infer_addr_type(cmd.delivery_class);

        if (!type) {
            throw self._bad_delivery_class(cmd);
        }

        var attrs = {};
        attrs[type] = utils.format_addr(cmd.addr, type);

        var contact = _.find(self.store, attrs);
        var created = false;

        if (!contact) {
            created = true;
            contact = self.create(attrs);
            self.add(contact);
        }

        return {
            success: true,
            created: created,
            contact: self.serialize_contact(contact) 
        };
    };

    self.handlers.new = function(cmd) {
        var contact = self.create(cmd.contact);
        self.add(contact);

        return {
            success: true,
            contact: self.serialize_contact(contact)
        };
    };

    self.handlers.save = function(cmd) {
        var contact = _.find(self.store, {key: cmd.contact.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        contact.do.reset(cmd.contact);

        return {
            success: true,
            contact: self.serialize_contact(contact)
        };
    };

    self.handlers.update = function(cmd) {
        var contact = _.find(self.store, {key: cmd.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        _.assign(contact, cmd.fields);

        return {
            success: true,
            contact: self.serialize_contact(contact) 
        };
    };

    self.handlers.update_extras = function(cmd) {
        var contact = _.find(self.store, {key: cmd.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        _.assign(contact.extra, cmd.fields);

        return {
            success: true,
            contact: self.serialize_contact(contact)
        };
    };

    self.handlers.update_subscriptions = function(cmd) {
        var contact = _.find(self.store, {key: cmd.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        _.assign(contact.subscription, cmd.fields);

        return {
            success: true,
            contact: self.serialize_contact(contact)
        };
    };

    self.handlers.search = function(cmd) {
        return {
            success: true,
            keys: self.search_results[cmd.query] || []
        };
    };
});


var DummyGroupsResource = DummyResource.extend(function(self, name, contacts) {
    /**class:DummyGroupsResource(name)
    
    Handles api requests to the groups resource from :class:`DummyApi`.

    :param string name:
        The name of the resource. Should match the name given in api requests.
    :param DummyContactsResource contacts:
        The contacts resource associated to this groups resource.
    */
    DummyResource.call(self, name);

    self.contacts = contacts;

    /**attribute:DummyGroupsResource.store
    A list of the resource's currently stored groups.
    */
    self.store = [];

    /**attribute:DummyGroupsResource.search_results
    An object mapping expected search queries to an array of the matching keys.
    */
    self.search_results = {};

    self.create = function(data) {
        /**DummyGroupResource.create(attrs)

        Helper for creating a :class:`Group` with the given attributes (along
        with sensible defaults where possible)

        :param object attrs:
            The attributes to create a :class:`Group with.
        */
        data = _.defaults(data || {}, {
            key: utils.uuid(),
            user_account: utils.uuid(),
            created_at: utils.now()
        });
        return new Group(data);
    };

    self.add = function(group) {
        /**:DummyGroupsResource.add(group)

        Adds an already created group to the resource's store.

        :param Group group:
            The group to add.
        */
        /**:DummyGroupsResource.add(attrs)
        Adds an group to the resource via a data object.

        :param object attrs:
            The attributes to initialise a group with.
        */
        if (!(group instanceof Group)) {
            group = self.create(group);
        }

        self.store.push(group);
        return group;
    };

    self.handlers.get = function(cmd) {
        var group = _.find(self.store, {key: cmd.key});

        if (!group) {
            throw new DummyResourceError("Group not found");
        }

        return {
            success: true,
            group: group.do.serialize()
        };
    };

    self.handlers.get_by_name = function(cmd) {
        var groups = _.where(self.store, {name: cmd.name});
        var group = groups[0];

        if (groups.length > 1) {
            throw new DummyResourceError("Multiple groups found");
        }

        if (!group) {
            throw new DummyResourceError("Group not found");
        }

        return {
            success: true,
            group: group.do.serialize()
        };
    };

    self.handlers.get_or_create_by_name = function(cmd) {
        var groups = _.where(self.store, {name: cmd.name});
        var group = groups[0];

        if (groups.length > 1) {
            throw new DummyResourceError("Multiple groups found");
        }

        var created = false;
        if (!group) {
            created = true;
            group = self.create({name: cmd.name});
            self.add(group);
        }

        return {
            success: true,
            created: created,
            group: group.do.serialize()
        };
    };

    self.handlers.update = function(cmd) {
        var group = _.find(self.store, {key: cmd.key});

        if (!group) {
            throw new DummyResourceError("Group not found");
        }

        _.assign(group, _.pick(cmd, 'name', 'query'));

        return {
            success: true,
            group: group.do.serialize()
        };
    };

    self.handlers.search = function(cmd) {
        var groups = _(self.search_results[cmd.query] || [])
            .map(function(key) {
                return _.find(self.store, {key: key});
            })
            .compact()
            .map(function(group) {
                return group.do.serialize();
            })
            .value();

        return {
            success: true,
            groups: groups
        };
    };

    self.handlers.list = function(cmd) {
        return {
            success: true,
            groups: _.invoke(self.store, 'serialize')
        };
    };

    self.handlers.count_members = function(cmd) {
        var group = _.find(self.store, {key: cmd.key});

        if (!group) {
            throw new DummyResourceError("Group not found");
        }

        var count = !_.isString(group.query)
            ? _.where(self.contacts.store, {groups: [group.key]}).length
            : (self.contacts.search_results[group.query] || []).length;

        return {
            success: true,
            group: group,
            count: count 
        };
    };
});


this.DummyContactsResource = DummyContactsResource;
this.DummyGroupsResource = DummyGroupsResource;
