var assert = require("assert");
var sinon = require("sinon");
var http_api = require("../../lib/http_api.js");


var HttpApi = http_api.HttpApi;
var JsonApi = http_api.JsonApi;


function DummyIm() {
    var self = this;
    self.log = sinon.spy();
    self.api = { request: sinon.stub() };

    self.request_succeeds = function(body) {
        self.api.request.callsArgWith(2, {
            success: true,
            code: 200,
            body: body,
            reason: null
        });
    };

    self.check_request = function(method, url, cmd_opts) {
        var cmd = { url: url };
        for (var k in cmd_opts) {
            cmd[k] = cmd_opts[k];
        }
        assert(self.api.request.calledOnce);
        try {
            assert(self.api.request.calledWith(
                method,
                sinon.match(cmd)
            ));
        }
        catch (e) {
            console.log(self.api.request.args);
            throw e;
        }
    };
}


describe("test HttpApi", function() {
    it("should be constructable", function() {
        var api = new HttpApi(new DummyIm());
    });

    function simple_success_check(api_method, resource_method, done) {
        var im = new DummyIm();
        var api = new HttpApi(im);
        im.request_succeeds("foo");
        var p = api[api_method]("http://www.example.com/");
        im.check_request(resource_method, "http://www.example.com/",
                         {headers: {}});
        p.add_callback(function (r) { assert.equal(r, "foo"); });
        p.add_callback(done);
    }

    it("should respond when .get(...) is called", function(done) {
        simple_success_check('get', 'http.get', done);
    });

    it("should respond when .head(...) is called", function(done) {
        simple_success_check('head', 'http.head', done);
    });

    it("should respond when .post(...) is called", function(done) {
        simple_success_check('post', 'http.post', done);
    });

    it("should respond when .put(...) is called", function(done) {
        simple_success_check('put', 'http.put', done);
    });

    it("should respond when .delete(...) is called", function(done) {
        simple_success_check('delete', 'http.delete', done);
    });

    it("should return an appropriate failure on 404", function(done) {
        var im = new DummyIm();
        var api = new HttpApi(im);
        im.api.request.callsArgWith(2, {
            success: true,
            code: 404,
            body: "404 Not Found",
            reason: null
        });
        var p = api.request("get", "http://www.example.com/");
        im.check_request("http.get", "http://www.example.com/", {});
        p.add_callback(function (r) {
            assert.deepEqual(r, {
                error: "<HttpApiError: HTTP API GET to http://www.example.com/ failed: 404 Not Found>"
            });
        });
        p.add_callback(done);
    });

    it("should return an appropriate failure on sandbox API failure", function(done) {
        var im = new DummyIm();
        var api = new HttpApi(im);
        im.api.request.callsArgWith(2, {
            success: false,
            reason: "Something broke."
        });
        var p = api.request("get", "http://www.example.com/");
        im.check_request("http.get", "http://www.example.com/", {});
        p.add_callback(function (r) {
            assert.deepEqual(r, {
                error: "<HttpApiError: HTTP API GET to http://www.example.com/ failed: Something broke.>"
            });
        });
        p.add_callback(done);
    });

    it("should send data if requested", function(done) {
        var im = new DummyIm();
        var api = new HttpApi(im);
        im.request_succeeds("foo");
        var p = api.post("http://www.example.com/", {data: "bar"});
        im.check_request("http.post", "http://www.example.com/",
                         {headers: {}, data: "bar"});
        p.add_callback(function (r) { assert.equal(r, "foo"); });
        p.add_callback(done);
    });

    it("should add parameters if requested", function(done) {
        var im = new DummyIm();
        var api = new HttpApi(im);
        im.request_succeeds("foo");
        var p = api.get("http://www.example.com/",
                        {params: {a: 1, b: 2}});
        im.check_request("http.get", "http://www.example.com/?a=1&b=2",
                        {headers: {}});
        p.add_callback(function (r) { assert.equal(r, "foo"); });
        p.add_callback(done);
    });

    it("should add basic auth headers if requested", function(done) {
        var im = new DummyIm();
        var api = new HttpApi(im, {
            auth: {username: "me", password: "pw"}
        });
        im.request_succeeds("foo");
        var p = api.get("http://www.example.com/");
        im.check_request("http.get", "http://www.example.com/",
                         {
                             headers: {
                                 'Authorization': ['Basic bWU6cHc=']
                             }
                         });
        p.add_callback(function (r) { assert.equal(r, "foo"); });
        p.add_callback(done);
    });
})


describe("test JsonApi", function() {
    it("should be constructable", function() {
        var api = new JsonApi(new DummyIm());
    });

    it("should perform simple request", function (done) {
        var im = new DummyIm();
        var api = new JsonApi(im);
        var req_data = {req: "val1"};
        var rsp_data = {rsp: "val2"};

        im.request_succeeds(JSON.stringify(rsp_data));
        var p = api.post("http://www.example.com/", {data: req_data});
        im.check_request("http.post", "http://www.example.com/",
                         {
                             headers: {
                                 'Content-Type':
                                 ['application/json; charset=utf-8']
                             },
                             data: JSON.stringify(req_data)
                         });
        p.add_callback(function (r) { assert.deepEqual(r, rsp_data); });
        p.add_callback(done);
    });


    it("should decode JSON body response", function() {
        var api = new JsonApi(new DummyIm());
        var val = {a: 1, b: "2"};
        assert.deepEqual(
            api.decode_response_body(JSON.stringify(val)),
            val);
    });

    it("should encode request data to JSON", function() {
        var api = new JsonApi(new DummyIm());
        var val = {a: 1, b: "2"};
        assert.deepEqual(api.encode_request_data(val),
                         JSON.stringify(val));
    });
})
