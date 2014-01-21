var Q = require("q");
var assert = require("assert");

var events = require("../../lib/events");
var Event = events.Event;
var Eventable = events.Eventable;


describe("Event", function() {
    describe(".subevent", function() {
        it("should set up the prototype chain correctly", function(){
            var ParentEvent = Event.subevent('parent');
            var ChildEvent = ParentEvent.subevent('child');

            var p = new ParentEvent();
            assert(p instanceof Event);
            assert(p instanceof ParentEvent);

            var c = new ChildEvent();
            assert(c instanceof Event);
            assert(c instanceof ParentEvent);
            assert(c instanceof ChildEvent);
        });

        describe("the returned constructor function", function() {
            it("should construct events correctly", function() {
                var TestEvent = Event.subevent('test', function(a) {
                    var self = this;
                    self.a = a;
                    self.b = 'bar';
                });

                var e = new TestEvent('foo');
                assert.equal(e.name, 'test');
                assert.equal(e.a, 'foo');
                assert.equal(e.b, 'bar');
            });

            it("should allow the constructor to be optional", function() {
                var TestEvent = Event.subevent('test');
                var e = new TestEvent();
                assert.equal(e.name, 'test');
            });
        });
    });
});

describe("Eventable", function() {
    var eventable;

    beforeEach(function() {
        eventable = new Eventable();
    });

    it("should be extendable", function() {
        var Thing = Eventable.extend(function() {});
        var thing = new Thing();
        assert(thing instanceof Eventable);
        assert(thing instanceof Thing);
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
