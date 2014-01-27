var assert = require("assert");

var vumigo = require("../lib");
var test_utils = vumigo.test_utils;
var State = vumigo.states.State;
var User = vumigo.user.User;
var UserStateData = vumigo.user.UserStateData;

describe("UserStateData", function() {
    var state;

    beforeEach(function() {
        state = new UserStateData('test_state', {foo: 'bar'});
    });

    describe(".reset", function() {
        beforeEach(function() {
            state = new UserStateData();
        });

        describe(".reset()", function() {
            it("should reset itself to an undefined state", function() {
                var state = new UserStateData('test_state');
                assert(state.exists());

                state.reset();
                assert(!state.exists());
            });
        });

        describe(".reset(state)", function() {
            it("should reset itself using a state instance", function() {
                assert(typeof state.get_name() == 'undefined');
                assert.deepEqual(state.get_metadata(), {});

                var s = new State('test_state');
                s.metadata = {foo: 'bar'};
                state.reset(s);

                assert.equal(state.get_name(), 'test_state');
                assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            });
        });

        describe(".reset(opts)", function() {
            it("should reset itself using an options object", function() {
                assert(typeof state.get_name() == 'undefined');
                assert.deepEqual(state.get_metadata(), {});

                state.reset({
                    name : 'test_state',
                    metadata: {foo: 'bar'}
                });

                assert.equal(state.get_name(), 'test_state');
                assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            });
        });

        describe(".reset(name, metadata)", function() {
            it("should reset itself using the given name and metadata",
            function() {
                assert(typeof state.get_name() == 'undefined');
                assert.deepEqual(state.get_metadata(), {});

                state.reset('test_state', {foo: 'bar'});

                assert.equal(state.get_name(), 'test_state');
                assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            });
        });
    });

    describe(".change", function() {
        beforeEach(function() {
            state = new UserStateData();
        });

        it("should reset the user's state", function() {
            assert(typeof state.get_name() == 'undefined');
            assert.deepEqual(state.get_metadata(), {});

            state.change('test_state', {foo: 'bar'});
            assert.equal(state.get_name(), 'test_state');

            assert.equal(state.get_name(), 'test_state');
            assert.deepEqual(state.get_metadata(), {foo: 'bar'});
        });

        describe("if a null state was given", function() {
            it("should not reset the user", function() {
                state.reset('test_state', {foo: 'bar'});

                state.change(null);

                assert.equal(state.get_name(), 'test_state');
                assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            });
        });

        describe("if an undefined state was given", function() {
            it("should not reset the user", function() {
                state.reset('test_state', {foo: 'bar'});

                state.change();

                assert.equal(state.get_name(), 'test_state');
                assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            });
        });
    });

    describe(".update_metadata", function() {
        it("should update the metadata", function() {
            assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            state.update_metadata({baz: 'qux'});
            assert.deepEqual(state.get_metadata(), {
                foo: 'bar',
                baz: 'qux'
            });
        });

        it("should overwrite already defined metadata properties", function() {
            assert.deepEqual(state.get_metadata(), {foo: 'bar'});
            state.update_metadata({foo: 'qux'});
            assert.deepEqual(state.get_metadata(), {foo: 'qux'});
        });
    });

    describe(".serialize", function() {
        it("should return the state data as a JSON-serializable object",
        function() {
            assert.deepEqual(state.serialize(), {
                name: 'test_state',
                metadata: {foo: 'bar'}
            });
        });
    });

    describe(".exists", function() {
        it("should determine whether it is in an undefined state", function() {
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



describe("User", function() {
    var im;
    var user;

    beforeEach(function() {
        var msg = require('../test/fixtures/simple-msg-2').call();
        return test_utils.make_im({msg: msg}).then(function(new_im) {
            im = new_im;
            user = im.user;
        });
    });

    it("should be JSON serializable", function() {
        assert.equal(JSON.stringify(user), JSON.stringify({
            addr: '+27987654321',
            lang: 'af',
            answers: {start: 'ja'},
            state: {
                name: 'start',
                metadata: {foo: 'bar'}
            }
        }));
    });

    describe(".setup", function() {
        beforeEach(function() {
            user = new User(im);
        });

        it("should emit a 'setup' event", function() {
            var p = user.once.resolved('setup');
            return user
                .setup('+27987654321')
                .thenResolve(p)
                .then(function(e) {
                    assert.strictEqual(user, e.instance);
                });
        });

        it("should setup the user", function() {
            return user.setup('+27987654321', {
                lang: 'af',
                answers: {start: 'yes'},
                state: {
                    name: 'start',
                    metadata: {foo: 'bar'}
                }
            }).then(function() {
                assert.equal(user.addr, '+27987654321');
                assert.equal(user.lang, 'af');
                assert.equal(user.get_answer('start'), 'yes');
                assert.equal(user.state.get_name(), 'start');
                assert.deepEqual(user.state.get_metadata(), {foo: 'bar'});
                assert.equal(user.i18n.gettext('yes'), 'ja');
            });
        });
    });

    describe(".create", function() {
        it("should emit a 'user:new' event after setting up",
        function() {
            var setup = user.once.resolved('setup');
            var p = user.once.resolved('user:new');

            return user
                .create('1234')
                .thenResolve(p)
                .then(function() {
                    assert(setup.isFulfilled());
                });
        });
    });

    describe(".load", function() {
        describe("if the user exists", function() {
            it("should load the user", function() {
                return user.load('+27987654321').then(function() {
                    assert.equal(user.addr, '+27987654321');
                    assert.equal(user.lang, 'af');
                    assert.equal(user.get_answer('start'), 'ja');
                    assert.equal(user.state.get_name(), 'start');
                    assert.deepEqual(user.state.get_metadata(), {foo: 'bar'});
                    assert.equal(user.i18n.gettext('yes'), 'ja');
                });
            });

            it("should emit a 'user:load' event", function() {
                var p = user.once.resolved('user:load');
                return user
                    .load('+27987654321')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.equal(user, e.user);
                    });
            });
        });

        describe("if the user does not exist", function() {
            it("should throw an error", function() {
                return user.load('i-do-not-exist').catch(function(e) {
                    assert.equal(
                        e.message,
                        "Failed to load user 'i-do-not-exist'");
                });
            });
        });
    });

    describe(".load_or_create", function() {
        describe("if the user exists", function() {
            it("should load the user", function() {
                return user.load('+27987654321').then(function() {
                    assert.equal(user.addr, '+27987654321');
                    assert.equal(user.lang, 'af');
                    assert.equal(user.get_answer('start'), 'ja');
                    assert.equal(user.state.get_name(), 'start');
                    assert.deepEqual(user.state.get_metadata(), {foo: 'bar'});
                    assert.equal(user.i18n.gettext('no'), 'nee');
                });
            });

            it("should emit a 'user:load' event", function() {
                var p = user.once.resolved('user:load');
                return user
                    .load('+27987654321')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.equal(user, e.user);
                    });
            });
        });

        describe("if the user does not exist", function() {
            it("should create a new user", function() {
                return user.load_or_create('i-do-not-exist').then(function() {
                    assert.equal(user.addr, 'i-do-not-exist');
                });
            });

            it("should emit a 'user:new' event", function() {
                var p = user.once.resolved('user:new');
                return user
                    .load_or_create('i-do-not-exist')
                    .thenResolve(p)
                    .then(function(e) {
                        assert.equal(user, e.user);
                    });
            });
        });
    });

    describe(".save", function() {
        it("should save the user", function() {
            user.set_answer('why', 'no');

            user
                .save()
                .then(function() {
                    user = new User();
                    return user.load('+27987654321');
                })
                .then(function() {
                    assert.equal(user.get_answert('why'), 'no');
                });
        });

        it("should emit a 'user:save' event", function() {
            var p = user.once.resolved('user:save');
            return user
                .save()
                .thenResolve(p)
                .then(function(e) {
                    assert.equal(e.user, user);
                });
        });
    });

    describe(".set_lang", function() {
        it("should change the user's language", function() {
            return user.set_lang('jp').then(function() {
                assert.equal(user.lang, 'jp');
                assert.equal(user.i18n.gettext('yes'), 'hai');
            });
        });
    });
});
