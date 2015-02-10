var Q = require('q');
var assert = require('assert');

var vumigo = require('../lib');
var test_utils = vumigo.test_utils;
var User = vumigo.user.User;
var UserNewEvent = vumigo.user.UserNewEvent;
var UserLoadEvent = vumigo.user.UserLoadEvent;
var UserResetEvent = vumigo.user.UserResetEvent;


describe("user", function() {
    describe("User", function() {
        var im;
        var user;

        beforeEach(function() {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
                user = im.user;
            });
        });

        it("should be JSON serializable", function() {
            assert.equal(JSON.stringify(user), JSON.stringify({
                addr: '+27987654321',
                lang: 'af',
                answers: {start: 'ja'},
                metadata: {name: 'jan'},
                in_session: false,
                state: {
                    name: 'start',
                    metadata: {foo: 'bar'},
                    creator_opts: {}
                }
            }));
        });

        describe(".created", function() {
            it("should determine whether the user was created", function() {
                var user1 = new User(im);
                var user2 = new User(im);

                return Q.all([
                    user1.create('1234'),
                    user2.load('+27987654321', {
                        store_name: 'test_app'
                    }),
                ]).then(function() {
                    assert(user1.created);
                    assert(!user2.created);
                });
            });
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
                    assert.equal(user.state.name, 'start');
                    assert.deepEqual(user.state.metadata, {foo: 'bar'});
                    assert.equal(user.i18n(test_utils.$('yes')), 'ja');
                });
            });
        });

        describe(".reset", function() {
            it("should set the creation event to 'user:reset'", function() {
                return user
                    .reset('1234')
                    .then(function() {
                        assert(user.creation_event instanceof UserResetEvent);
                    });
            });
        });

        describe(".create", function() {
            it("should set the creation event to 'user:new'", function() {
                return user
                    .create('1234')
                    .then(function() {
                        assert(user.creation_event instanceof UserNewEvent);
                    });
            });
        });

        describe(".load", function() {
            describe("if the user exists", function() {
                it("should load the user", function() {
                    return user
                        .load('+27987654321', {store_name: 'test_app'})
                        .then(function() {
                            assert.equal(user.addr, '+27987654321');
                            assert.equal(user.lang, 'af');
                            assert.equal(user.get_answer('start'), 'ja');
                            assert.equal(user.state.name, 'start');
                            assert.deepEqual(user.state.metadata, {foo: 'bar'});
                            assert.equal(user.i18n(test_utils.$('yes')), 'ja');
                        });
                });

                it("should set the creation event to 'user:load'", function() {
                    return user
                        .load('+27987654321', {store_name: 'test_app'})
                        .then(function(e) {
                            assert(
                                user.creation_event instanceof UserLoadEvent);
                        });
                });
            });

            describe("if the user does not exist", function() {
                it("should throw an error", function() {
                    return user
                        .load('i-do-not-exist', {store_name: 'test_app'})
                        .catch(function(e) {
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
                    return user
                        .load('+27987654321', {store_name: 'test_app'})
                        .then(function() {
                            assert.equal(user.addr, '+27987654321');
                            assert.equal(user.lang, 'af');
                            assert.equal(user.get_answer('start'), 'ja');
                            assert.equal(user.state.name, 'start');
                            assert.deepEqual(user.state.metadata, {foo: 'bar'});
                            assert.equal(user.i18n(test_utils.$('no')), 'nee');
                        });
                });

                it("should set the creation event to 'user:load'", function() {
                    return user
                        .load('+27987654321', {store_name: 'test_app'})
                        .then(function(e) {
                            assert(
                                user.creation_event instanceof UserLoadEvent);
                        });
                });
            });

            describe("if the user does not exist", function() {
                it("should create a new user", function() {
                    return user
                        .load_or_create('i-do-not-exist', {
                            store_name: 'test_app'
                        })
                        .then(function() {
                            assert.equal(user.addr, 'i-do-not-exist');
                        });
                });

                it("should set the creation event to 'user:new'", function() {
                    return user
                        .load_or_create('i-do-not-exist', {
                            store_name: 'test_app'
                        })
                        .then(function(e) {
                            assert(
                                user.creation_event instanceof UserNewEvent);
                        });
                });
            });
        });

        describe(".default_expiry", function() {
            it("should be seven days if no config is set", function() {
                assert.strictEqual(user.default_expiry(), 604800);
            });

            describe("should be overriden", function() {
                it("when config.user_expiry is an integer", function() {
                    im.config.user_expiry = 60;
                    assert.strictEqual(user.default_expiry(), 60);
                });

                it("when config.user_expiry is null", function() {
                    im.config.user_expiry = null;
                    assert.strictEqual(user.default_expiry(), null);
                });
            });
        });

        describe(".save", function() {
            it("should save the user", function() {
                user.set_answer('why', 'no');

                return user
                    .save()
                    .then(function() {
                        user = new User(im);
                        return user.load('+27987654321', {
                            store_name: 'test_app'
                        });
                    })
                    .then(function() {
                        assert.equal(user.get_answer('why'), 'no');
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

            it("should set the default expiry", function() {
                return user
                    .save()
                    .then(function() {
                        assert.strictEqual(
                            im.api.kv.ttl[user.key()],
                            user.default_expiry());
                    });
            });

            it("should set an integer custom expiry", function() {
                return user
                    .save({seconds: 5})
                    .then(function() {
                        assert.strictEqual(im.api.kv.ttl[user.key()], 5);
                    });
            });

            it("should set a null custom expiry", function() {
                return user
                    .save({seconds: null})
                    .then(function() {
                        assert.strictEqual(
                            user.key() in im.api.kv.ttl, false);
                    });
            });
        });

        describe(".set_lang", function() {
            it("should change the user's language", function() {
                return user.set_lang('jp').then(function() {
                    assert.equal(user.lang, 'jp');
                    assert.equal(user.i18n(test_utils.$('yes')), 'hai');
                });
            });
        });
    });
});
