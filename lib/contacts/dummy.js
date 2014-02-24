var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;


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

    self.add = function() {
        /**:DummyContactsResource.add(contact)

        Adds an already created contact to the resource's store.

        :param Contact contact:
            The contact to add
        */
        /**:DummyContactsResource.add(data)
        Adds an contact to the resource via a data object.

        :param object data:
            The data to be used to initialise a contact,
        */
    };

    self.handlers.get = function() {
    };

    self.handlers.get_or_create = function() {
    };

    self.handlers.new = function() {
    };

    self.handlers.save = function() {
    };
});


this.DummyContactsResource = DummyContactsResource;
