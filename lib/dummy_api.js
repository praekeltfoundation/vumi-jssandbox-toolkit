function DummyApi() {
    var self = this;

    // test hooks

    this.kv_store = {};
    this.config_store = {};

    self.reset = function() {
        self.logs = [];
        self.request_calls = [];
        self.waiting_replies = [];
        self.done_calls = 0;
    }
    self.reset();

    self.add_reply = function(reply) {
        self.waiting_replies.push(reply);
    }

    self._dispatch_command = function(cmd, reply) {
        var handler_name = ("_handle_" +
                            cmd.cmd.replace('.', '_').replace('-', '_'));
        var handler = self[handler_name];
        if (!handler) {
            self.request_calls.push(cmd);
            reply(self.waiting_replies.shift());
        }
        if (handler) {
            handler.call(self, cmd, reply);
        }
    }

    self._populate_reply = function(orig_cmd, reply) {
        reply.cmd = orig_cmd.cmd;
        return reply;
    }

    self._handle_kv_get = function(cmd, reply) {
        var value = self.kv_store[cmd.key];
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
    }

    self._handle_kv_set = function(cmd, reply) {
        self.kv_store[cmd.key] = cmd.value;
        reply(self._populate_reply(cmd, {
            success: true
        }));
    }

    self._handle_config_get = function(cmd, reply) {
        var value = self.config_store[cmd.key];
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
    }

    // original api

    self.populate_command = function(cmd_name, cmd) {
        cmd.cmd = cmd_name;
        return cmd;
    }

    self.request = function(cmd_name, cmd_data, reply) {
        var cmd = self.populate_command(cmd_name, cmd_data);
        self._dispatch_command(cmd, reply);
    }

    self.log_info = function(msg) {
        self.logs.push(msg);
    }

    self.done = function() {
        self.done_calls += 1;
    }
}

// exports
this.DummyApi = DummyApi;
