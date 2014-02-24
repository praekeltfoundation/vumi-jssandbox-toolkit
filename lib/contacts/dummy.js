var _ = require("underscore");

var api = require('./api');
var utils = require('../utils');
var resources = require('../dummy/resources');

var Contact = api.Contact;
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
    A list of the resource's currently stored contacts
    */
    self.store = [];

    self.create = function(data) {
        data = _(data || {}).defaults({
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

        return new Contact(data);
    };

    self.add = function(contact) {
        /**:DummyContactsResource.add(contact)

        Adds an already created contact to the resource's store.

        :param Contact contact:
            The contact to add
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
    };

    self.find_where = function(attrs) {
        return _(self.store).find(function(contact) {
            return utils.deep_matches(contact.attrs, attrs);
        });
    };

    self._bad_delivery_class = function(cmd) {
        return new DummyResourceError([
            "Unsupported delivery class",
            "(got: " + cmd.delivery_class + " with address " + cmd.addr + ")"
        ].join(' '));
    };

    self.handlers.get = function(cmd) {
        var type = infer_addr_type(cmd.delivery_class);

        if (!type) {
            throw self._bad_delivery_class(cmd);
        }

        var attrs = {};
        attrs[type] = format_addr(cmd.addr, type);

        var contact = self.find_where(attrs);
        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        return {
            success: true,
            contact: contact.serialize()
        };
    };

    self.handlers.get_or_create = function(cmd) {
        var type = infer_addr_type(cmd.delivery_class);

        if (!type) {
            throw self._bad_delivery_class(cmd);
        }

        var attrs = {};
        attrs[type] = format_addr(cmd.addr, type);

        var contact = self.find_where(attrs);
        var created = false;

        if (!contact) {
            created = true;
            contact = self.create(attrs);
            self.add(contact);
        }

        return {
            success: true,
            created: created,
            contact: contact.serialize()
        };
    };

    self.handlers.new = function(cmd) {
        var contact = self.create(cmd.contact);
        self.add(contact);

        return {
            success: true,
            contact: contact.serialize()
        };
    };

    self.handlers.save = function(cmd) {
        var contact = self.find_where({key: cmd.contact.key});

        if (!contact) {
            throw new DummyResourceError("Contact not found");
        }

        contact.reset(cmd.contact);

        return {
            success: true,
            contact: contact.serialize()
        };
    };
});


function format_addr(addr, type) {
    var formatter = format_addr[type] || _.identity;
    return formatter(addr);
}

format_addr.msisdn = function(addr) {
    return '+' + addr.replace('+', '');
};

format_addr.gtalk_id = function(addr) {
    return addr.split('/')[0];
};

function infer_addr_type(delivery_class) {
    return {
        sms: 'msisdn',
        ussd: 'msisdn',
        gtalk: 'gtalk_id',
        twitter: 'twitter_handle'
    }[delivery_class];
}


this.DummyContactsResource = DummyContactsResource;
this.infer_addr_type = infer_addr_type;
this.format_addr = format_addr;
