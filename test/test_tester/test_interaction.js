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
            it("should update the properties of the message");
        });

        describe(".input(fn)", function() {
            it("should update the message with the function's result");
            it("should allow the function to return its result via a promise");
        });

        describe(".input(content)", function() {
            it("should update the content of the message");
        });

        describe(".input()", function() {
            it("should update the content of the message to null");
            it("should default the session event to 'new'");
        });
    });

    describe(".input.content", function() {
        it("should update the content of the message");
    });

    describe(".input.session_event", function() {
        it("should update the session event of the message");
    });
});
