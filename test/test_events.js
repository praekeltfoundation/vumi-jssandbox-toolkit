var Q = require("q");
var assert = require("assert");

var events = require("../lib/events");
var Event = events.Event;
var Eventable = events.Eventable;


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

    describe(".once", function() {
        describe(".resolved", function() {
            describe("once the event is emitted", function() {
                it("should fulfull the returned promise", function() {
                    var p = eventable.once.resolved('foo');
                    return eventable
                        .emit(new Event('foo'))
                        .thenResolve(p)
                        .then(function(event) {
                            assert.equal(event.name, 'foo');
                        });
                });

                it("should remove the event listener", function() {
                    var p = eventable.once.resolved('foo');
                    assert.equal(eventable.listeners('foo').length, 1);

                    return eventable
                        .emit(new Event('foo'))
                        .thenResolve(p)
                        .then(function() {
                            assert.equal(eventable.listeners('foo').length, 0);
                        });
                });
            });
        });
    });

    describe(".emit", function() {
        it("should emit the event", function() {
            return eventable
                .once.resolved('foo')
                .then(function(event) {
                    assert.equal(event.name, 'foo');
                    assert.equal(event.a, 'lerp');
                    assert.equal(event.b, 'larp');
                })
                .thenResolve(eventable.emit(new Event('foo', {
                    a: 'lerp',
                    b: 'larp'
                })));
        });

        describe("once all associated listeners are done", function() {
            it("should fulfill the returned promise", function() {
                var d1 = Q.defer();
                var d2 = Q.defer();

                eventable
                    .on('foo', function() {
                        return d1.promise;
                    })
                    .on('foo', function() {
                        return d2.promise;
                    });

                assert(d1.promise.isPending());
                assert(d2.promise.isPending());

                var p = eventable.emit(new Event('foo')).then(function() {
                    assert(d1.promise.isFulfilled());
                    assert(d2.promise.isFulfilled());
                });

                d1.resolve();
                d2.resolve();

                return p;
            });
        });

        describe("if one of the associated listeners throws an error",
        function() {
            it("should reject the returned promise with the error",
            function() {
                var error = new Error(':(');
                eventable.on('foo', function() {});
                eventable.on('foo', function() { throw error; });

                return eventable.emit(new Event('foo')).catch(function(e) {
                    assert.strictEqual(e, error);
                });
            });
        });
    });
});
