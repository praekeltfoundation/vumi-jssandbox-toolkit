var assert = require('assert');

var vumigo = require('../../lib');
var State = vumigo.states.State;
var StateData = vumigo.states.StateData;


describe("data", function() {
    describe("StateData", function() {
        var state;

        beforeEach(function() {
            state = new StateData('test_state', {
                metadata: {foo: 'bar'},
                creator_opts: {baz: 'qux'}
            });
        });

        describe(".reset", function() {
            beforeEach(function() {
                state = new StateData();
            });

            describe(".reset()", function() {
                it("should reset itself to an undefined state", function() {
                    var state = new StateData('test_state');
                    assert(state.exists());

                    state.reset();
                    assert(!state.exists());
                });
            });

            describe(".reset(state, opts)", function() {
                it("should reset itself using a state instance and options",
                function() {
                    assert(typeof state.name == 'undefined');
                    assert.deepEqual(state.metadata, {});

                    var s = new State('test_state');
                    s.metadata = {foo: 'bar'};
                    state.reset(s, {creator_opts: {baz: 'qux'}});

                    assert.equal(state.name, 'test_state');
                    assert.deepEqual(state.metadata, {foo: 'bar'});
                    assert.deepEqual(state.creator_opts, {baz: 'qux'});
                });
            });

            describe(".reset(opts)", function() {
                it("should reset itself using an options object",
                function() {
                    assert(typeof state.name == 'undefined');
                    assert.deepEqual(state.metadata, {});

                    state.reset({
                        name: 'test_state',
                        metadata: {foo: 'bar'},
                        creator_opts: {baz: 'qux'}
                    });

                    assert.equal(state.name, 'test_state');
                    assert.deepEqual(state.metadata, {foo: 'bar'});
                    assert.deepEqual(state.creator_opts, {baz: 'qux'});
                });
            });

            describe(".reset(name opts)", function() {
                it("should reset itself using a name and options",
                function() {
                    assert(typeof state.name == 'undefined');
                    assert.deepEqual(state.metadata, {});

                    state.reset('test_state', {
                        metadata: {foo: 'bar'},
                        creator_opts: {baz: 'qux'}
                    });

                    assert.equal(state.name, 'test_state');
                    assert.deepEqual(state.metadata, {foo: 'bar'});
                    assert.deepEqual(state.creator_opts, {baz: 'qux'});
                });
            });
        });

        describe(".serialize", function() {
            it("should return the state data as a JSON-serializable object",
            function() {
                assert.deepEqual(state.serialize(), {
                    name: 'test_state',
                    metadata: {foo: 'bar'},
                    creator_opts: {baz: 'qux'}
                });
            });
        });

        describe(".exists", function() {
            it("should determine whether it is in an undefined state",
            function() {
                assert(state.exists());
                state.reset();
                assert(!state.exists());
            });
        });

        describe(".is", function() {
            it("should compare its state to another by name", function() {
                assert(!state.is('larp_state'));
                assert(state.is('test_state'));
            });
        });
    });
});
