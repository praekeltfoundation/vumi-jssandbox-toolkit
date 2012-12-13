// Test simple_example.js

var assert = require("assert");

var simple_example = require("../../examples/simple_example");
var api = simple_example.api;

describe("on_inbound_message", function () {
    it("should return a reply", function () {
        api.reset();
        api.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: "1234",
                content: "hello",
                message_id: "1"
            }
        });
        var reply = api.request_calls.shift();
        assert.ok(reply);
        assert.equal(reply.content, "Echoing: hello");
        assert.equal(api.done_calls, 1);
    });
});

describe("on_inbound_event", function () {
    it("should do nothing", function () {
        api.reset();
        api.on_inbound_message({
            cmd: "inbound-event",
            msg: {
                user_message_id: "123",
                event_id: "1",
                event_type: "ack"
            }
        });
        assert.equal(api.done_calls, 1);
    });
});

describe("on_unknown_command", function () {
    it("should log a message", function () {
        api.reset();
        api.on_unknown_command({
            cmd: "something-unexpected",
        });
        assert.equal(api.done_calls, 1);
        assert.deepEqual(api.logs, ["Received unknown command: {\"cmd\":" +
                                    "\"something-unexpected\"}"]);
    });
});
