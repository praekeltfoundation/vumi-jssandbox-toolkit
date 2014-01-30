var assert = require('assert');

var app = require('../../lib/app');
var App = app.App;

var tester = require('../../lib/tester/tester');
var AppTester = tester.AppTester;

var tasks = require('../../lib/tester/tasks');
var TaskMethodError = tester.TaskMethodError;

describe("AppTester Interaction Tasks", function() {
    var app;
    var tester;
    var tasks;

    beforeEach(function() {
        app = new App('start');
        tester = new AppTester(app);
        tasks = tester.tasks.get('interactions');
    });

    describe("if checking tasks have already been scheduled", function() {
        beforeEach(function() {
            var checks = tester.tasks.get('checks');
            checks.methods.check = function() {};
            tester.tasks.attach();
        });

        it("should throw an error when scheduling interaction tasks", function() {
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
        });

        it("should send the message into the sandbox", function() {
            return tasks.send(msg).then(function() {
                assert.equal(tester.im.msg.message_id, '1');
                assert.equal(tester.im.msg.content, 'hello');
                assert.equal(tester.im.msg.session_event, 'resume');
            });
        });

        it("should use the same shutdown handling as the im", function() {
            var p = tester.im.once.resolved('im:shutdown');
            return tasks.send(msg).thenResolve(p);
        });

        describe("when an error occurs in the sandbox", function() {
            var error;

            beforeEach(function() {
                error = new Error(':(');

                app.states.add('start', function() {
                    throw new Error(':(');
                });
            });

            it("should use the same error handling as the im", function() {
                var p = tester.im.once.resolved('im:error');

                return tasks
                    .send(msg)
                    .catch(function() {})
                    .thenResolve(p);
            });

            it("should rethrow the error", function() {
                return tasks.send(msg).catch(function(e) {
                    assert.equal(e.message, ':(');
                    assert.equal(error.message, e.message);
                });
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
                        assert.equal(tester.im.msg.content, 'hello');
                        assert.equal(tester.im.msg.session_event, 'resume');
                    });
            });
        });

        describe(".input(fn)", function() {
            it("should update the message with the function's result",
            function() {
                return tester
                    .input(function(msg) {
                        msg.content = 'hello';
                        return msg;
                    })
                    .input(function(msg) {
                        msg.session_event = 'resume';
                        return msg;
                    })
                    .run()
                    .then(function() {
                        assert.equal(tester.im.msg.content, 'hello');
                        assert.equal(tester.im.msg.session_event, 'resume');
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
                        assert.equal(tester.im.msg.content, 'hello');
                        assert.equal(tester.im.msg.session_event, 'resume');
                    });
            });
        });

        describe(".input(content)", function() {
            it("should update the content of the message", function() {
                return tester.input('hello').run().then(function() {
                    assert.equal(tester.im.msg.content, 'hello');
                });
            });
        });

        describe(".input()", function() {
            it("should update the content of the message to null", function() {
                return tester.input().run().then(function() {
                    assert.strictEqual(tester.im.msg.content, null);
                });
            });

            it("should default the session event to 'new'", function() {
                return tester.input().run().then(function() {
                    assert.strictEqual(tester.im.msg.session_event, 'new');
                });
            });
        });
    });

    describe(".input.content", function() {
        it("should update the content of the message", function() {
            return tester.input.content('hello').run().then(function() {
                assert.equal(tester.im.msg.content, 'hello');
            });
        });
    });

    describe(".input.session_event", function() {
        it("should update the session event of the message", function() {
            return tester.input.session_event('close').run().then(function() {
                assert.equal(tester.im.msg.session_event, 'close');
            });
        });
    });
});
