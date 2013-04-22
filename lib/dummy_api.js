var fs = require("fs");


function DummyApiError(msg) {
    var self = this;

    self.toString = function () {
        return "<DummyApiError " + self.msg + ">";
    };
}


function DummyApi() {
    var self = this;

    // test hooks

    self.reset = function() {
        self.kv_store = {};
        self.config_store = {};
        self.metrics = {};
        self.http_get = {};
        self.http_post = {};
        self.outbound_sends = [];
        self.logs = [];
        self.request_calls = [];
        self.waiting_replies = [];
        self.done_calls = 0;
    };
    self.reset();

    self.add_reply = function(reply) {
        self.waiting_replies.push(reply);
    };

    self.load_http_fixture = function(filename) {
        var data = fs.readFileSync(filename);
        var fixture = JSON.parse(data);
        self.add_http_fixture(fixture);
    };

    self._format_http_post_data = function(content_type, data) {
        // convert a JSON fixture data into the required
        // content type.
        if (content_type == "application/json")
            return JSON.stringify(data);
        return data;
    };

    self._order_json_data = function(data) {
        // return JSON data with consistent key ordering
        // FIXME: This assumes the JSON data is a JS object
        var json = JSON.parse(data);
        var keys = Object.keys(json).sort();
        var frags = keys.map(function (k) {
            return '"' + k + '":' + JSON.stringify(json[k]);
        });
        data = "{" + frags.join(",") + "}";
        return data;
    };

    self._http_request_key = function(method, url, content_type, data) {
        if (content_type == "application/json") {
            data = self._order_json_data(data);
        }
        return url + "|" + content_type + "|" + data;
    };

    self.add_http_fixture = function(fixture) {
        if (fixture.method == "POST") {
            var content_type = fixture.content_type || "application/json";
            var data = self._format_http_post_data(content_type, fixture.data);
            var key = self._http_request_key('POST', fixture.url, content_type, data);
            self.http_post[key] = JSON.stringify(fixture.body);
        }
        else {
            self.http_get[fixture.url] = JSON.stringify(fixture.body);
        }
    };

    self._dispatch_command = function(cmd, reply) {
        var handler_name = ("_handle_" +
                            cmd.cmd.replace('.', '_').replace('-', '_'));
        var handler = self[handler_name];
        if (!handler) {
            throw new DummyApiError("Unknown command " + cmd.cmd);
        }
        if (handler) {
            handler.call(self, cmd, reply);
        }
    };

    self._populate_reply = function(orig_cmd, reply) {
        reply.cmd = orig_cmd.cmd;
        return reply;
    };

    self._handle_kv_get = function(cmd, reply) {
        var value = self.kv_store[cmd.key];
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
    };

    self._handle_kv_set = function(cmd, reply) {
        self.kv_store[cmd.key] = cmd.value;
        reply(self._populate_reply(cmd, {
            success: true
        }));
    };

    self._handle_kv_incr = function(cmd, reply) {
        var orig_value = self.kv_store[cmd.key];
        orig_value = (typeof orig_value == 'undefined') ? 0 : orig_value;
        orig_value = Number(orig_value);
        var amount = cmd.amount;
        amount = (typeof amount == 'undefied') ? 1 : amount;
        self.kv_store[cmd.key] = orig_value + amount;
        reply(self._populate_reply(cmd, {
            success: true,
            value: self.kv_store[cmd.key]
        }));
    };

    self._handle_config_get = function(cmd, reply) {
        var value = self.config_store[cmd.key];
        reply(self._populate_reply(cmd, {
            success: true,
            value: value
        }));
    };

    self._record_metric = function (store_name, metric_name, value, agg) {
        var store = self.metrics[store_name];
        if (typeof store == 'undefined') {
            self.metrics[store_name] = store = {};
        }
        var metric = store[metric_name];
        if (typeof metric == 'undefined') {
            store[metric_name] = metric = {'agg': agg, values: []};
        }
        if (metric.agg != agg) return false;
        metric.values.push(value);
        return true;
    };

    self._handle_metrics_fire = function(cmd, reply) {
        var success = self._record_metric(cmd.store, cmd.metric, cmd.value,
                                          cmd.agg);
        reply(self._populate_reply(cmd, {
            success: success
        }));
    };

    self._handle_http_method = function(method, key, cmd, reply) {
        var store = (method == "POST") ? self.http_post : self.http_get;
        var reply_data = {};
        var data = store[key];
        if (typeof data != 'undefined') {
            reply_data.success = true;
            reply_data.body = data;
            reply_data.code = 200;
        }
        else {
            reply_data.success = false;
            reply_data.reason = method + " from unknown key: " + key;
            console.log(reply_data.reason);
        }
        reply(self._populate_reply(cmd, reply_data));
    };

    self._handle_http_get = function(cmd, reply) {
        self._handle_http_method("GET", cmd.url, cmd, reply);
    };

    self._handle_http_post = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('POST', cmd.url, content_type, cmd.data);
        self._handle_http_method("POST", key, cmd, reply);
    };

    self._handle_http_put = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('PUT', cmd.url, content_type, cmd.data);
        self._handle_http_method("PUT", key, cmd, reply);
    };

    self._handle_http_delete = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('DELETE', cmd.url, content_type);
        self._handle_http_method("DELETE", key, cmd, reply);
    };

    self._handle_http_head = function(cmd, reply) {
        var headers = cmd.headers || {};
        var content_types = headers['Content-Type'] || [];
        var content_type = content_types[0];
        var key = self._http_request_key('HEAD', cmd.url, content_type);
        self._handle_http_method("HEAD", key, cmd, reply);
    };

    self._handle_outbound_reply_to = function(cmd, reply) {
         self.request_calls.push(cmd);
         reply(self.waiting_replies.shift());
    };

    self._handle_outbound_send_to_tag = function(cmd, reply) {
        self.outbound_sends.push(cmd);
        reply(self._populate_reply(cmd, {success: true}));
    };

    // original api

    self.populate_command = function(cmd_name, cmd) {
        cmd.cmd = cmd_name;
        return cmd;
    };

    self.request = function(cmd_name, cmd_data, reply) {
        var cmd = self.populate_command(cmd_name, cmd_data);
        self._dispatch_command(cmd, reply);
    };

    self.log_info = function(msg) {
        self.logs.push(msg);
    };

    self.done = function() {
        self.done_calls += 1;
    };
}

// exports
this.DummyApi = DummyApi;
