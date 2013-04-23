var assert = require("assert");


function maybe_call(f, that, args) {
    // call a function if it is defined
    if (typeof f != "undefined" && f !== null) {
        f.apply(that, args);
    }
}


function opt_or_default(opt_value, default_value) {
    // return opt_value if defined, else default
    return ((typeof opt_value != 'undefined')
            ? opt_value : default_value);
}

function assert_opt_exists(opt) {
    // raise error if opt not defined
    assert.ok((typeof opt != "undefined"));
    return opt;
}


function ImTester(api, opts) {
    // a utility for testing state machine transitions
    // optional opts:
    //   - custom_setup: setup(api)
    //   - custom_teardown: teardown(api, saved_user)
    //   - max_response_length: maximum length of responses
    //                          (default: 163, use null to disable check)

    var self = this;

    var opts = opts || {};
    self.custom_setup = opts.custom_setup;
    self.custom_teardown = opts.custom_teardown;
    self.max_response_length = opt_or_default(opts.max_response_length,
                                             163);

    self.api = api;

    self.refresh_api = function () {
        self.api.reset();
        self.api.reset_im();
        return api;
    };

    self.format_logs = function(msg) {
        var logs = "Logs:\n\n" + self.api.logs.join("\n");
        return msg ? (msg + "\n" + logs) : logs;
    };

    self.assert_ok = function(value, msg) {
        assert.ok(value, self.format_logs(msg));
    };

    self.assert_equal = function(actual, expected, msg) {
        assert.equal(actual, expected, self.format_logs(msg));
    };

    self.assert_deep_equal = function(actual, expected, msg) {
        assert.deepEqual(actual, expected, self.format_logs(msg));
    };

    self.check_state = function (opts) {
        // required opts:
        //   - user: current user dictionary
        //   - content: content to send from user
        //   - next_state: expected state after processing message
        //   - response: expected response to user
        // optional opts:
        //   - setup: setup(api)
        //   - teardown: teardown(api, saved_user)
        //   - from_addr: user's address (default: "1234567")
        //   - session_event: session event from user (default: "continue")
        //   - message_id: sandbox message id (default: "123")
        //   - max_response_length: maximum allowed response length
        //                          (default: self.max_response_length,
        //                           use null to disable check)

        var opts = opts || {};

        var user = assert_opt_exists(opts.user);
        var next_state = assert_opt_exists(opts.next_state);
        var content = assert_opt_exists(opts.content);
        var expected_response = assert_opt_exists(opts.response);

        var from_addr = opt_or_default(opts.from_addr, "1234567");
        var session_event = opt_or_default(opts.session_event, "continue");
        var message_id = opt_or_default(opts.message_id, "123");
        var max_response_length = opt_or_default(opts.max_response_length,
                                                self.max_response_length);

        // setup api
        var api = self.refresh_api();
        var user_key = "users." + from_addr;
        api.kv_store[user_key] = user;

        maybe_call(self.custom_setup, self, [api]);
        maybe_call(opts.setup, self, [api]);

        api.add_reply({
            cmd: "outbound.reply_to"
        });

        // send message
        api.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: from_addr,
                content: content,
                message_id: message_id,
                session_event: session_event
            }
        });

        // check result
        var saved_user = api.kv_store[user_key];
        self.assert_equal(saved_user.current_state, next_state);
        var reply = api.request_calls.shift();
        var response = reply.content;

        self.assert_ok(response, "Reply content empty.");
        self.assert_ok(response.match(expected_response),
                       "Reply '" + response + "' did not match '" +
                       expected_response + "'");
        if (max_response_length !== null) {
            self.assert_ok(response.length <= max_response_length,
                           "Reply '" + response + "' (length: " +
                           response.length + ") is longer than " +
                           max_response_length + " characters");
        }

        self.assert_deep_equal(api.request_calls, []);
        self.assert_equal(api.done_calls, 1);

        maybe_call(self.custom_teardown, self, [api, saved_user]);
        maybe_call(opts.teardown, self, [api, saved_user]);
    }

    self.check_close = function(opts) {
        // required opts:
        //   - user: user dictionary
        //   - next_state: expected next state
        // optional opts:
        //   - setup: setup(api) (default: do nothing)
        //   - teardown: teardown(api, saved_user) (default: do nothing)
        //   - user: user dictionary (default: {})
        //   - from_addr: user's address (default: "1234567")
        //   - session_event: session event (default: "close")
        //   - message_id: message id (default: "123")
        //   - content: message content (default: "User Timeout")

        var opts = opts || {};

        var user = assert_opt_exists(opts.user);
        var next_state = assert_opt_exists(opts.next_state);

        var from_addr = opt_or_default(opts.from_addr, "1234567");
        var session_event = opt_or_default(opts.session_event, "close");
        var message_id = opt_or_default(opts.message_id, "123");
        var content = opt_or_default(opts.content, "User Timeout");

        // setup api
        var api = self.refresh_api();
        var user_key = "users." + from_addr;
        api.kv_store[user_key] = user;

        maybe_call(self.custom_setup, self, [api]);
        maybe_call(opts.setup, self, [api]);

        // send message
        api.on_inbound_message({
            cmd: "inbound-message",
            msg: {
                from_addr: from_addr,
                session_event: session_event,
                content: content,
                message_id: message_id
            }
        });

        // check result
        var saved_user = api.kv_store[user_key];
        self.assert_equal(saved_user.current_state, next_state);
        self.assert_deep_equal(api.request_calls, []);
        self.assert_equal(api.done_calls, 1);

        maybe_call(self.custom_teardown, self, [api, saved_user]);
        maybe_call(opts.teardown, self, [api, saved_user]);
    }
}

// exports

this.ImTester = ImTester;