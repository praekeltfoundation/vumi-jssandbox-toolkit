var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var State = vumigo.states.State;
var App = vumigo.app.App;
var AppTester = vumigo.tester.AppTester;
var TaskMethodError = vumigo.tester.TaskMethodError;


describe("AppTester Interaction Tasks", function() {
    var im;
    var app;
    var tester;
    var tasks;

    beforeEach(function() {
        app = new App('start');
        app.states.add(new State('start'));

        tester = new AppTester(app);
        tasks = tester.tasks.get('interactions');
        im = tester.im;
    });

    describe("if checking tasks have already been scheduled", function() {
        beforeEach(function() {
            var checks = tester.tasks.get('checks');
            checks.methods.check = function() {};
            tester.tasks.attach();
        });

        it("should throw an error when scheduling interaction tasks",
        function() {
            tester.check();

            assert.throws(function() {
                tester.setup();
            }, TaskMethodError);
        });
    });

    describe("message sending", function() {
        var msg;

        beforeEach(function() {
            msg = {
                message_id: '1',
                content: 'hello',
                session_event: 'resume'
            };
            
            return tester.run();
        });

        it("should send the message into the sandbox", function() {
            return tasks.send(msg).then(function() {
                assert.equal(im.msg.message_id, '1');
                assert.equal(im.msg.content, 'hello');
                assert.equal(im.msg.session_event, 'resume');
            });
        });

        it("should use the same shutdown handling as the im", function() {
            var p = im.once.resolved('im:shutdown');
            return tasks.send(msg).thenResolve(p);
        });

        describe("when an error occurs in the sandbox", function() {
            beforeEach(function() {
                im.switch_state = function() {
                    throw new Error(':(');
                };
            });

            it("should use the same error handling as the im", function() {
                var p = im.once.resolved('im:error');

                return tasks
                    .send(msg)
                    .catch(function() {})
                    .thenResolve(p);
            });

            it("should rethrow the error", function() {
                return tasks.send(msg).catch(function(e) {
                    assert.equal(e.message, ':(');
                });
            });
        });
    });

    describe(".start()", function() {
        it("should update the content of the message to null", function() {
            return tester.start().run().then(function() {
                assert.strictEqual(im.msg.content, null);
            });
        });

        it("should default the session event to 'new'", function() {
            return tester.start().run().then(function() {
                assert.strictEqual(im.msg.session_event, 'new');
            });
        });
    });

    describe(".input", function() {
        describe(".input(obj)", function() {
            it("should update the properties of the message", function() {
                return tester
                    .input({content: 'hello'})
                    .input({session_event: 'resume'})
                    .run()
                    .then(function() {
                        assert.equal(im.msg.content, 'hello');
                        assert.equal(im.msg.session_event, 'resume');
                    });
            });
        });

        describe(".input(fn)", function() {
            it("should set the message with the function's result",
            function() {
                return tester
                    .input(function(msg) {
                        msg.content = 'hello';
                        msg.session_event = 'resume';
                        return msg;
                    })
                    .input(function(msg) {
                        return msg;
                    })
                    .run()
                    .then(function() {
                        assert.equal(im.msg.content, 'hello');
                        assert.equal(im.msg.session_event, 'resume');
                    });
            });

            it("should allow the function to return its result via a promise",
            function() {
                return tester
                    .input(function(msg) {
                        msg.content = 'hello';
                        msg.session_event = 'resume';
                        return Q(msg);
                    })
                    .run()
                    .then(function() {
                        assert.equal(im.msg.content, 'hello');
                        assert.equal(im.msg.session_event, 'resume');
                    });
            });

            it("should bind the function to the tester instance", function() {
                return tester
                    .input(function(msg) {
                        assert.strictEqual(this, tester);
                        return {};
                    })
                    .run();
            });
        });

        describe(".input(content)", function() {
            it("should update the content of the message", function() {
                return tester.input('hello').run().then(function() {
                    assert.equal(im.msg.content, 'hello');
                });
            });

            it("should default the session event to 'resume'", function() {
                return tester.input('hello').run().then(function() {
                    assert.strictEqual(im.msg.session_event, 'resume');
                });
            });
        });

        describe(".input()", function() {
            it("should update the content of the message to null", function() {
                return tester.input().run().then(function() {
                    assert.strictEqual(im.msg.content, null);
                });
            });

            it("should default the session event to 'new'", function() {
                return tester.input().run().then(function() {
                    assert.strictEqual(im.msg.session_event, 'new');
                });
            });
        });
    });

    describe(".input.content", function() {
        it("should update the content of the message", function() {
            return tester.input.content('hello').run().then(function() {
                assert.equal(im.msg.content, 'hello');
            });
        });

        it("should default the session event to 'resume'", function() {
            return tester.input.content('hello').run().then(function() {
                assert.strictEqual(im.msg.session_event, 'resume');
            });
        });
    });

    describe(".input.session_event", function() {
        it("should update the session event of the message", function() {
            return tester.input.session_event('close').run().then(function() {
                assert.equal(im.msg.session_event, 'close');
            });
        });
    });
});
