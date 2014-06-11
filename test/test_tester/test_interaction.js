var Q = require('q');
var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;
var AppTester = vumigo.tester.AppTester;
var TaskError = vumigo.tester.tasks.TaskError;
var TaskMethodError = vumigo.tester.TaskMethodError;

var App = vumigo.app.App;
var State = vumigo.states.State;
var Choice = vumigo.states.Choice;
var MenuState = vumigo.states.MenuState;
var EndState = vumigo.states.EndState;


describe("AppTester Interaction Tasks", function() {
    var im;
    var app;
    var tester;
    var tasks;

    beforeEach(function() {
        app = new App('start');
        app.states.add(new State('start'));

        tester = new AppTester(app);
        tester.api.config.app.name = 'test_app';
        tasks = tester.tasks.get('interactions');
        im = tester.im;
    });

    it("should throw an error if both a single and multiple inputs were given",
    function() {
        return tester
            .input('a')
            .inputs('b', 'c')
            .run()
            .then(test_utils.fail, function(e) {
                assert(e instanceof TaskError);
                assert.equal(
                    e.message,
                    ['AppTester expected either a single or multiple inputs',
                    'but was given both.'].join(' '));
            });
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
                    .then(test_utils.fail, function() {})
                    .thenResolve(p);
            });

            it("should rethrow the error", function() {
                return tasks.send(msg).then(test_utils.fail, function(e) {
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

    describe(".inputs", function() {
        beforeEach(function() {
            app.states.add(new MenuState('states:a', {
                question: 'A',
                choices: [
                    new Choice('states:b', 'states:b'),
                    new Choice('states:c', 'states:c')]
            }));

            app.states.add(new MenuState('states:b', {
                question: 'B',
                choices: [
                    new Choice('states:d', 'states:d'),
                    new Choice('states:e', 'states:e')]
            }));

            app.states.add(new EndState('states:c', {text: 'C'}));
            app.states.add(new EndState('states:d', {text: 'D'}));
            app.states.add(new EndState('states:e', {text: 'E'}));
        });

        describe(".inputs(input1[, input2[, ...]])", function() {
            it("should use each input for a new interaction", function() {
                return tester
                    .setup.user.state('states:a')
                    .inputs('1', '2')
                    .check.user.state('states:e')
                    .check.reply('E')
                    .run();
            });

            it("should allow objects to be used as inputs", function() {
                return tester
                    .inputs({content: '1'}, {content: '2'})
                    .check(function(api, im) {
                        assert.strictEqual(im.msg.content, '2');
                    })
                    .run();
            });

            it("should allow strings to be used as inputs", function() {
                return tester
                    .inputs('1', '2')
                    .check(function(api, im) {
                        assert.strictEqual(im.msg.content, '2');
                    })
                    .run();
            });

            it("should allow nulls to be used as inputs", function() {
                return tester
                    .inputs(null, null)
                    .check(function(api, im) {
                        assert.strictEqual(im.msg.content, null);
                    })
                    .run();
            });
        });

        describe(".inputs(fn)", function() {
            it("should set the message with the function's result", function() {
                return tester
                    .setup.user.state('states:a')
                    .inputs(function(msgs) {
                        return msgs.concat('1');
                    })
                    .inputs(function(msgs) {
                        return msgs.concat('2');
                    })
                    .check.user.state('states:e')
                    .check.reply('E')
                    .run();
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
