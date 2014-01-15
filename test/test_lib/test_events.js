var Q = require("q");
var assert = require("assert");

var events = require("../../lib/events");


var Event = events.Event;
var Eventable = events.Eventable;


describe("Eventable", function() {
    var eventable;

    beforeEach(function() {
        eventable = new Eventable();
    });

    describe("emit", function() {
        it("should emit the event", function(done) {
            eventable.on('foo', function(event) {
                assert.equal(event.name, 'foo');
                assert.equal(event.a, 'lerp');
                assert.equal(event.b, 'larp');
                done();
            });

            eventable.emit(new Event('foo', {
                a: 'lerp',
                b: 'larp'
            }));
        });

        it("should return a promise that is only fulfilled once all its " +
        "listeners are done", function(done) {
            var d1 = Q.defer();
            var d2 = Q.defer();

            eventable
                .on('foo', function() {
                    return d1.promise;
                })
                .on('foo', function() {
                    return d2.promise;
                });

            eventable.emit(new Event('foo')).then(function() {
                assert(d1.promise.isFulfilled());
                assert(d2.promise.isFulfilled());
            }).nodeify(done);

            assert(d1.promise.isPending());
            assert(d2.promise.isPending());
            d1.resolve();
            d2.resolve();
        });
    });
});
