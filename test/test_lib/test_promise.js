var assert = require("assert");
var promise = require("../../lib/promise.js");
var dummy_api = require("../../lib/dummy_api");


describe("test Promise", function() {
    it("should fire deferreds returned by callbacks", function() {
        var p1 = new promise.Promise();
        var p2 = new promise.Promise();
        var p3 = new promise.Promise();
        var r = [];

        p1.add_callback(function () { return p2; });
        p1.add_callback(function () { r[r.length] = 1; });
        p2.add_callback(function () { return p3; });
        p2.add_callback(function () { r[r.length] = 2; });
        p3.add_callback(function () { r[r.length] = 3; });
        p1.callback();
        p2.callback();
        p3.callback();

        assert.deepEqual(r, [3, 2, 1]);
    });
    it("should correctly order calls when new callbacks are added", function() {
        var p1 = new promise.Promise();
        var p2 = new promise.Promise();
        var r = [];

        p1.add_callback(function () { r.push(1); });
        p1.callback();
        p1.add_callback(function () {
            p2.add_callback(function () { r.push(2); });
            return p2;
        });
        p1.add_callback(function () { r.push(3); });
        p2.callback();

        assert.deepEqual(r, [1, 2, 3]);
    });
});