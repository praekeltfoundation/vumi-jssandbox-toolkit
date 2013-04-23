var assert = require("assert");
var http_api = require("../../lib/http_api.js");

var HttpApi = http_api.HttpApi;
var JsonApi = http_api.JsonApi;


function DummyIm() {
    var self = this;
}


describe("test HttpApi", function() {
    var im = new DummyIm();

    it("should be constructable", function() {
        var api = new HttpApi(im);
    });
})


describe("test JsonApi", function() {
    var im = new DummyIm();

    it("should be constructable", function() {
        var api = new JsonApi(im);
    });
})
