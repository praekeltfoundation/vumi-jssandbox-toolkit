var assert = require("assert");

var resources = require('../../lib/dummy/resources');
var DummyResourceError = resources.DummyResourceError;

var api = require('../../lib/dummy/api');
var DummyApi = api.DummyApi;

var http = require('../../lib/http/dummy');
var HttpFixture = http.HttpFixture;
var HttpFixtures = http.HttpFixtures;


describe("HttpFixture", function () {
    it("should allow a single response to be given", function() {
        var fixture = new HttpFixture({
            request: {url: 'http://example.com'},
            response: {code: 201}
        });

        assert.equal(fixture.responses[0].code, 201);
    });

    it("should allow a multiple responses to be given", function() {
        var fixture = new HttpFixture({
            request: {url: 'http://example.com'},
            responses: [
                {code: 201},
                {code: 403}]
        });

        assert.equal(fixture.responses[0].code, 201);
        assert.equal(fixture.responses[1].code, 403);
    });

    it("should use a default response if no responses are given", function() {
        var fixture = new HttpFixture({
            request: {url: 'http://example.com'}
        });

        assert.equal(fixture.responses[0].code, 200);
    });

    it("should json encode requests if asked", function() {
        var fixture = new HttpFixture({
            opts: {json: true},
            request: {
                url: 'http://example.com',
                data: {foo: 'bar'}
            }
        });

        assert.equal(fixture.request.body, '{"foo":"bar"}');
    });

    it("should json decode responses if asked", function() {
        var fixture = new HttpFixture({
            request: {url: 'http://example.com'},
            responses: [
                {body: '{"foo":"bar"}'},
                {body: '{"baz":"qux"}'}]
        });

        assert.deepEqual(fixture.responses[0].data, {foo: 'bar'});
        assert.deepEqual(fixture.responses[1].data, {baz: 'qux'});
    });

    describe(".use", function() {
        it("should return the next response", function() {
            var fixture = new HttpFixture({
                request: {url: 'http://example.com'},
                responses: [
                    {body: '{"foo":"bar"}'},
                    {body: '{"baz":"qux"}'}]
            });

            assert.strictEqual(fixture.use(), fixture.responses[0]);
            assert.strictEqual(fixture.use(), fixture.responses[1]);
        });

        it("should throw an error if it is used up", function() {
            var fixture = new HttpFixture({
                request: {url: 'http://example.com'},
                responses: [
                    {body: '{"foo":"bar"}'},
                    {body: '{"baz":"qux"}'}]
            });

            fixture.use();
            fixture.use();
            assert.throws(function() {
                fixture.use();
            }, DummyResourceError);
        });
    });
});

describe("HttpFixtures", function () {
    HttpFixtures;

    describe(".add", function() {
        describe(".add(data)", function() {
            it("should allow a single or multiple responses to be given");
        });

        describe(".add(fixture)", function() {
            it("should support adding an already initialised fixture");
        });
    });

    describe(".matchers", function() {
        describe(".url", function() {
            it("should determine whether the request urls match");
            it("should support regexes");
        });

        describe(".params", function() {
            it("should determine whether the request params match");
            it("should return true if both requests have no params");
        });

        describe(".body", function() {
            it("should determine whether the request bodies");
            it("should do a deep equals test for json requests");
            it("should return true if both requests have no bodies");
            it("should return true if both json requests have no data");
        });
    });

    describe(".find", function() {
        it("should return the matching fixture");
        it("should throw an error if there are no matches");
        it("should throw an error if there are multiple matches");
    });
});

describe("DummyHttpResource", function () {
    var api;

    beforeEach(function() {
        api = new DummyApi();
    });

    describe(".request_from_cmd", function() {
        it("should convert the command's headers into request headers");
        it("should convert the command's params into request params");
        it("should decode the request body if it is a json request");
    });

    describe(".handlers", function() {
        describe("request handlers", function() {
            it("should respond with the matching fixture's next response");
            it("should throw an error if the fixture is used up");
            it("should record the request");
        });

        describe(".get", function() {
            it("should perform dummy get requests");
        });

        describe(".head", function() {
            it("should perform dummy head requests");
        });

        describe(".post", function() {
            it("should perform dummy post requests");
        });

        describe(".delete", function() {
            it("should perform dummy delete requests");
        });
    });
});
