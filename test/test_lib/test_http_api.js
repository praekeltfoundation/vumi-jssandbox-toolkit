var assert = require("assert");
var sinon = require("sinon");
var http_api = require("../../lib/http_api.js");


var HttpApi = http_api.HttpApi;
var JsonApi = http_api.JsonApi;


function DummyIm() {
    var self = this;
    self.log = sinon.spy();
    self.api = { request: sinon.stub() };

    self.requestSucceeds = function(body) {
        self.api.request.callsArgWith(2, {
            success: true,
            code: 200,
            body: body,
            reason: null
        });
    };

    self.checkRequest = function(method, url, headers) {
        assert(self.api.request.calledOnce);
        assert(self.api.request.calledWith(
            method,
            sinon.match({
                url: url,
                headers: headers
            })
        ));
    };
}



describe("test HttpApi", function() {
    var im = new DummyIm();

    it("should be constructable", function() {
        var api = new HttpApi(im);
    });

    it("should respond when api_get is called", function(done) {
        var api = new HttpApi(im);
        im.requestSucceeds("foo");
        var p = api.api_get("http://www.example.com/");
        im.checkRequest('http.get', "http://www.example.com/", {});
        p.add_callback(function (r) { assert.equal(r, "foo"); });
        p.add_callback(done);
    });
})


describe("test JsonApi", function() {
    var im = new DummyIm();

    it("should be constructable", function() {
        var api = new JsonApi(im);
    });
})
