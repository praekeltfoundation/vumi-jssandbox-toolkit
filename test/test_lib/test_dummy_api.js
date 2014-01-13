var assert = require("assert");
var Q = require("q");
var vumigo = require("../../lib");

var DummyApi = vumigo.dummy_api.DummyApi;

describe("DummyApi", function () {
    var api;

    function api_request(name, data) {
        var d = Q.defer();

        api.request(name, data, function(reply) {
            d.resolve(reply);
        });

        return d.promise;
    }

    beforeEach(function () {
        api = new DummyApi();
    });

    it("should dispatch commands asynchronously", function(done) {
        var has_reply = false;

        api_request("kv.get", {key: "foo"}).then(function (reply) {
            has_reply = true;
            assert(reply.success);
            assert.equal(reply.value, null);
        });

        // check reply wasn't called immediately
        assert(!has_reply);
        api.pending_calls_complete().then(function () {
            assert(has_reply);
        }).nodeify(done);
    });

    describe("find_contact", function() {
        it("should fail for unknown address types", function() {
            assert.throws(
                function () { api.find_contact("unknown", "+12334"); },
                "/Unsupported delivery class " +
                "(got: unknown with address +12334)/");
        });
    });

    describe("Contacts Resource", function () {
        var assert_fails = function(cmd_name, cmd, reason) {
            return api_request(cmd_name, cmd).then(function(reply) {
                assert(!reply.success);
                assert.equal(reply.reason, reason);
            });
        };

        describe("contacts.get", function() {
            it("should retrieve existing contacts", function(done) {
                api.add_contact({msisdn: "+12345", name: "Bob"});

                api_request("contacts.get", {
                    delivery_class: "sms",
                    addr: "+12345"
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact.name, "Bob");
                    assert.equal(reply.contact.surname, null);
                }).nodeify(done);
            });

            it("should fail to find non-existant contacts", function(done) {
                assert_fails(
                    "contacts.get", {
                        delivery_class: "sms",
                        addr: "+12345"
                    },
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.get_or_create", function() {
            it("retrieve existing contacts", function(done) {
                api.add_contact({msisdn: "+12345", name: "Bob"});

                api_request("contacts.get_or_create", {
                    delivery_class: "sms",
                    addr: "+12345"
                }).then(function(reply) {
                    assert(reply.success);
                    assert(!reply.created);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact.name, "Bob");
                    assert.equal(reply.contact.surname, null);
                }).nodeify(done);
            });

            it("should create new contacts", function(done) {
                api_request("contacts.get_or_create", {
                    delivery_class: "sms",
                    addr: "+12345"
                }).then(function(reply) {
                    assert(reply.success);
                    assert(reply.created);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact.name, null);
                    assert.equal(reply.contact.surname, null);

                    var contact = api.contact_store[reply.contact.key];
                    assert.equal(contact.msisdn, "+12345");
                }).nodeify(done);
            });
        });

        describe("contacts.update", function() {
            it("should update existing contacts", function(done) {
                var contact = api.add_contact({
                    msisdn: "+12345",
                    name: "Bob"
                });

                api_request("contacts.update", {
                    key: contact.key,
                    fields: {
                        name: "Bob",
                        surname: "Smith"
                    }
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact.name, "Bob");
                    assert.equal(reply.contact.surname, "Smith");
                    assert.equal(contact.name, "Bob");
                    assert.equal(contact.surname, "Smith");
                }).nodeify(done);
            });

            it("should fail to update non-existant contacts", function(done) {
                assert_fails(
                    "contacts.update", {
                        key: "unknown",
                        fields: {}
                    },
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.update_extras", function() {
            it("should update existing contacts", function(done) {
                var contact = api.add_contact({msisdn: "+12345", name: "Bob"});

                api_request("contacts.update_extras", {
                    key: contact.key,
                    fields: {
                        foo: "Foo",
                        bar: "Bar"
                    }
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact['extras-foo'], "Foo");
                    assert.equal(reply.contact['extras-bar'], "Bar");
                    assert.equal(contact['extras-foo'], "Foo");
                    assert.equal(contact['extras-bar'], "Bar");
                }).nodeify(done);
            });

            it("should fail to update non-existant contacts", function(done) {
                assert_fails(
                    "contacts.update_extras", {
                        key: "unknown",
                        fields: {}
                    },
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.update_subscriptions", function() {
            it("should update existing contacts", function(done) {
                var contact = api.add_contact({msisdn: "+12345", name: "Bob"});

                api_request("contacts.update_subscriptions", {
                    key: contact.key,
                    fields: {
                        foo: "Foo",
                        bar: "Bar",
                    }
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact['subscription-foo'], "Foo");
                    assert.equal(reply.contact['subscription-bar'], "Bar");

                    assert.equal(contact['subscription-foo'], "Foo");
                    assert.equal(contact['subscription-bar'], "Bar");
                }).nodeify(done);
            });

            it("should fail to update non-existant contacts", function(done) {
                assert_fails(
                    "contacts.update_subscriptions", {
                        key: "unknown",
                        fields: {}
                    },
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.new", function() {
            it("should create new contacts", function(done) {
                api_request("contacts.new", {
                    contact: {
                        name: "Bob",
                        surname: "Smith",
                        msisdn: "+12345"
                    }
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.name, "Bob");
                    assert.equal(reply.contact.surname, "Smith");
                    assert.equal(reply.contact.msisdn, "+12345");

                    var contact = api.find_contact("sms", "+12345");
                    assert.equal(contact.name, "Bob");
                    assert.equal(contact.surname, "Smith");
                    assert.equal(contact.msisdn, "+12345");
                }).nodeify(done);
            });
        });

        describe("contacts.save", function() {
            it("should save existing contacts", function(done) {
                var contact = api.add_contact({msisdn: "+12345", name: "Bob"});

                api_request("contacts.save", {
                    contact: {
                        key: contact.key,
                        msisdn: "+12345",
                        name: "Robert",
                        surname: "Smith",
                    }
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.msisdn, "+12345");
                    assert.equal(reply.contact.name, "Robert");
                    assert.equal(reply.contact.surname, "Smith");

                    contact = api.contact_store[contact.key];
                    assert.equal(contact.msisdn, "+12345");
                    assert.equal(contact.name, "Robert");
                    assert.equal(contact.surname, "Smith");
                }).nodeify(done);
            });

            it("should fail for non-existant contacts", function (done) {
                assert_fails(
                    "contacts.save",
                    {contact: {key: "unknown"}},
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.get_by_key", function() {
            it("should retrieve existing contact", function (done) {
                api.add_contact({key: "1", msisdn: "+12345", name: "Bob"});

                // should retrieve 1 result
                api_request(
                    "contacts.get_by_key",
                    {key: "1"}
                ).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.contact.key, "1");
                }).nodeify(done);
            });

            it("should fail if contact does not exist", function (done) {
                assert_fails(
                    "contacts.get_by_key",
                    {key: "790"},
                    "Contact not found"
                ).nodeify(done);
            });
        });

        describe("contacts.search", function() {
            it("should retrieve existing contact keys", function (done) {
                api.add_contact({key: "1", msisdn: "+12345", name: "Bob"});
                api.set_contact_search_results('name:"Bob"', ['1']);

                api_request("contacts.search", {
                    query: 'name:"Bob"'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.keys.length, 1);
                    assert.equal(reply.keys[0], 1);
                }).nodeify(done);
            });

            it("should retrieve 0 results for a query which matches no " +
            "contacts", function (done) {
                api_request("contacts.search", {
                    query: 'name:"Anton"'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.keys.length, 0);
                }).nodeify(done);
            });
        });
    });

    describe("Logging Resource", function () {
        it("should log calls on the known levels", function(done) {
            var levels = ['info', 'debug', 'warning', 'error', 'critical'];

            Q.all(levels.map(function(level) {
                var cmd = 'log.' + level;
                return api_request(cmd, {msg: level}).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.cmd, cmd);
                });
            })).then(function() {
                assert.deepEqual(api.logs, levels);
            }).nodeify(done);
        });
    });

    describe('Groups Resource', function() {
        describe("groups.count_members", function() {
            it("should allow counting of static groups", function(done) {
                api.add_group({key: 'group-1'});
                api.add_contact({groups:['group-1']});

                api_request("groups.count_members", {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.count, 1);
                }).nodeify(done);
            });

            it("should allow counting of smart groups", function(done) {
                api.add_group({
                    key: 'group-1',
                    query: 'foo'
                });
                api.set_smart_group_query_results(
                    'foo', ['contact-1', 'contact-2']);

                api_request("groups.count_members", {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.count, 2);
                }).nodeify(done);
            });
        });

        describe("groups.get", function() {
            it("should retrieve a group by its key", function(done) {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api_request('groups.get', {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.group.key, 'group-1');
                    assert.equal(reply.group.name, 'Group 1');
                }).nodeify(done);
            });
        });

        describe("groups.get_by_name", function() {
            it("should retrieve a group by its name", function(done) {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api.add_group({key: 'group-2', name: 'Foo Group'});
                api.add_group({key: 'group-3', name: 'Foo Group'});

                var checks = [];
                checks.push(api_request('groups.get_by_name', {
                    name: 'Group 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.group.key, 'group-1');
                    assert.equal(reply.group.name, 'Group 1');
                }));

                checks.push(api_request('groups.get_by_name', {
                    name: 'Foo Group'
                }).then(function(reply) {
                    assert(!reply.success);
                    assert.equal(reply.reason, 'Multiple groups found');
                }));

                checks.push(api_request('groups.get_by_name', {
                    name: 'Bar Group'
                }).then(function(reply) {
                    assert(!reply.success);
                    assert.equal(reply.reason, 'Group not found');
                }));

                Q.all(checks).nodeify(done);
            });
        });

        describe("groups.get_or_create_by_name", function() {
            it("should retrieve a group by name if it already exists",
            function(done) {
                var group = api.add_group({
                    key: 'group-1',
                    name: 'Group 1'
                });

                api_request('groups.get_or_create_by_name', {
                    name: 'Group 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert(!reply.created);
                    assert.equal(reply.group.name, 'Group 1');
                    assert.equal(reply.group.key, group.key);
                }).nodeify(done);
            });

            it("should create a new group if it does not already exist",
            function(done) {
                api_request('groups.get_or_create_by_name', {
                    name: 'Group 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert(reply.created);
                    assert.equal(reply.group.name, 'Group 1');
                }).nodeify(done);
            });
        });

        describe("groups.list", function() {
            it("should list the available groups", function(done) {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api.add_group({key: 'group-2', name: 'Group 2'});

                api_request('groups.list', {}).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups[0].key, 'group-1');
                    assert.equal(reply.groups[1].key, 'group-2');
                }).nodeify(done);
            });
        });

        describe("groups.search", function() {
            beforeEach(function() {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api.add_group({key: 'group-2', name: 'Group 2'});
                api.set_group_search_results('query 1', ['group-1', 'group-2']);
            });

            it("should retrieve groups matching the query", function(done) {
                api_request('groups.search', {
                    query: 'query 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups[0].key, 'group-1');
                    assert.equal(reply.groups[1].key, 'group-2');
                }).nodeify(done);
            });

            it("should return an 0 results if no groups matched the query",
            function(done) {
                api_request('groups.search', {
                    query: 'no-results'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups.length, 0);
                }).nodeify(done);
            });
        });

        describe("groups.update", function() {
            it("should update details of the relevant group", function(done) {
                api.add_group({key: 'group-1', name: 'Group 1'});

                api_request('groups.update', {
                    key: 'group-1',
                    name: 'Foo Group'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.group.name, 'Foo Group');

                    var group = api.group_store['group-1'];
                    assert.equal(group.name, 'Foo Group');
                }).nodeify(done);
            });
        });
    });
});
