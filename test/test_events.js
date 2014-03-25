var Q = require('q');
var assert = require('assert');

var vumigo = require('../lib');
var Event = vumigo.events.Event;
var Eventable = vumigo.events.Eventable;


describe("events", function() {
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

        describe(".on", function() {
            it("should accept a single listener", function() {
                var foos = 0;
                var thing = new Eventable();

                thing.on('foo', function() {
                    foos++;
                });

                return Q.all([
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('foo'))
                ]).then(function() {
                    assert.equal(foos, 2);
                });
            });

            it("should accept an object of listeners", function() {
                var foos = 0;
                var bars = 0;
                var thing = new Eventable();

                thing.on({
                    foo: function() {
                        foos++;
                    },
                    bar: function() {
                        bars++;
                    }
                });

                return Q.all([
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('bar')),
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('bar'))
                ]).then(function() {
                    assert.equal(foos, 2);
                    assert.equal(bars, 2);
                });
            });

            it("should support delegation to members", function(done) {
                var thing = new Eventable();
                thing.subthing = {subsubthing: new Eventable()};

                thing.on('subthing.subsubthing foo', function() {
                    done();
                });

                thing.subthing.subsubthing.emit(new Event('foo'));
            });
        });

        describe(".once", function() {
            it("should accept a single listener", function() {
                var foos = 0;
                var thing = new Eventable();

                thing.once('foo', function() {
                    foos++;
                });

                return Q.all([
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('foo'))
                ]).then(function() {
                    assert.equal(foos, 1);
                });
            });

            it("should accept an object of listeners", function() {
                var foos = 0;
                var bars = 0;
                var thing = new Eventable();

                thing.once({
                    foo: function() {
                        foos++;
                    },
                    bar: function() {
                        bars++;
                    }
                });

                return Q.all([
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('bar')),
                    thing.emit(new Event('foo')),
                    thing.emit(new Event('bar'))
                ]).then(function() {
                    assert.equal(foos, 1);
                    assert.equal(bars, 1);
                });
            });

            it("should support delegation to members", function(done) {
                var thing = new Eventable();
                thing.subthing = {subsubthing: new Eventable()};

                thing.on('subthing.subsubthing foo', function() {
                    done();
                });

                thing.subthing.subsubthing.emit(new Event('foo'));
            });
        });

        describe(".once.resolved", function() {
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
                            assert.equal(
                                eventable.listeners('foo').length,
                                0);
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
});
