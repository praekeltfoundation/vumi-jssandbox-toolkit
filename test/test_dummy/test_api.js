var assert = require("assert");
var Q = require("q");

var api = require("../../lib/dummy/api");
var DummyApi = api.DummyApi;

var resources = require("../../lib/dummy/resources");
var DummyResource = resources.DummyResource;


var ToyResource = DummyResource.extend(function(self) {
    DummyResource.call(self);

    self.name = 'toy';

    self.handlers.foo = function(cmd) {
        return {
            handler: 'foo',
            cmd: cmd
        };
    };
});

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

    // TODO remove when pending_calls_complete is removed
    it.skip("should dispatch commands asynchronously", function() {
        var has_reply = false;

        api_request("kv.get", {key: "foo"}).then(function (reply) {
            has_reply = true;
            assert(reply.success);
            assert.equal(reply.value, null);
        });

        // check reply wasn't called immediately
        assert(!has_reply);
        return api.pending_calls_complete().then(function () {
            assert(has_reply);
        });
    });

    it("should dispatch commands using its resource controller when possible",
    function() {
        api.resources.add(new ToyResource());
        return api_request('toy.foo', {}).then(function(result) {
            assert.deepEqual(result, {
                handler: 'foo',
                cmd: {cmd: 'toy.foo'}
            });
        });
    });

    describe(".in_logs", function() {
        it("should determine whether the message is in the logs", function() {
            assert(!api.in_logs('foo'));
            api.log_info('foo');
            assert(api.in_logs('foo'));
        });
    });

    describe(".find_contact", function() {
        it("should fail for unknown address types", function() {
            assert.throws(
                function () { api.find_contact("unknown", "+12334"); },
                "/Unsupported delivery class " +
                "(got: unknown with address +12334)/");
        });
    });

    describe("Logging Resource", function () {
        it("should log calls on the known levels", function() {
            var levels = ['info', 'debug', 'warning', 'error', 'critical'];

            return Q.all(levels.map(function(level) {
                var cmd = 'log.' + level;
                return api_request(cmd, {msg: level}).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.cmd, cmd);
                });
            })).then(function() {
                assert.deepEqual(api.logs, levels);
            });
        });
    });

    describe('Groups Resource', function() {
        describe("groups.count_members", function() {
            it("should allow counting of static groups", function() {
                api.add_group({key: 'group-1'});
                api.add_contact({groups:['group-1']});

                return api_request("groups.count_members", {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.count, 1);
                });
            });

            it("should allow counting of smart groups", function() {
                api.add_group({
                    key: 'group-1',
                    query: 'foo'
                });
                api.set_smart_group_query_results(
                    'foo', ['contact-1', 'contact-2']);

                return api_request("groups.count_members", {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.count, 2);
                });
            });
        });

        describe("groups.get", function() {
            it("should retrieve a group by its key", function() {
                api.add_group({key: 'group-1', name: 'Group 1'});
                return api_request('groups.get', {
                    key: 'group-1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.group.key, 'group-1');
                    assert.equal(reply.group.name, 'Group 1');
                });
            });
        });

        describe("groups.get_by_name", function() {
            it("should retrieve a group by its name", function() {
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

                return Q.all(checks);
            });
        });

        describe("groups.get_or_create_by_name", function() {
            it("should retrieve a group by name if it already exists",
            function() {
                var group = api.add_group({
                    key: 'group-1',
                    name: 'Group 1'
                });

                return api_request('groups.get_or_create_by_name', {
                    name: 'Group 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert(!reply.created);
                    assert.equal(reply.group.name, 'Group 1');
                    assert.equal(reply.group.key, group.key);
                });
            });

            it("should create a new group if it does not already exist",
            function() {
                api_request('groups.get_or_create_by_name', {
                    name: 'Group 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert(reply.created);
                    assert.equal(reply.group.name, 'Group 1');
                });
            });
        });

        describe("groups.list", function() {
            it("should list the available groups", function() {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api.add_group({key: 'group-2', name: 'Group 2'});

                api_request('groups.list', {}).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups[0].key, 'group-1');
                    assert.equal(reply.groups[1].key, 'group-2');
                });
            });
        });

        describe("groups.search", function() {
            beforeEach(function() {
                api.add_group({key: 'group-1', name: 'Group 1'});
                api.add_group({key: 'group-2', name: 'Group 2'});
                api.set_group_search_results('query 1', ['group-1', 'group-2']);
            });

            it("should retrieve groups matching the query", function() {
                return api_request('groups.search', {
                    query: 'query 1'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups[0].key, 'group-1');
                    assert.equal(reply.groups[1].key, 'group-2');
                });
            });

            it("should return an 0 results if no groups matched the query",
            function() {
                return api_request('groups.search', {
                    query: 'no-results'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.groups.length, 0);
                });
            });
        });

        describe("groups.update", function() {
            it("should update details of the relevant group", function() {
                api.add_group({key: 'group-1', name: 'Group 1'});

                return api_request('groups.update', {
                    key: 'group-1',
                    name: 'Foo Group'
                }).then(function(reply) {
                    assert(reply.success);
                    assert.equal(reply.group.name, 'Foo Group');

                    var group = api.group_store['group-1'];
                    assert.equal(group.name, 'Foo Group');
                });
            });
        });
    });
});
