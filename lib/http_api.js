// http_api.js
//  - Utilities for HTTP API.

var promise = require("./promise.js");
var Promise = promise.Promise;


function HttpApiError(msg) {
    var self = this;
    self.msg = msg;

    self.toString = function() {
        return "<HttpApiError: " + self.msg + ">";
    };
}


function HttpApi(im, opts) {

    var self = this;
    var opts = opts || {};

    self.im = im;
    self.default_headers = opts.headers || {};

    if (opts.auth) {
        var hash = (new Buffer(auth.username + ":"
                               + auth.password)).toString('base64');
        self.default_headers['Authorization'] = ['Basic ' + hash];
    }

    self.decode_response_body = function(body) {
        // sub-classes should override this to decode the
        // response body and raise an exception if the
        // body cannot be parsed.
        return body;
    };

    self.encode_request_data = function(data) {
        // sub-classes should override this to encode the
        // request body and raise an exception if the
        // data cannot be encoded.
        return data;
    };

    self.create_headers = function(headers) {
        var all_headers = {};
        for (var k in self.default_headers) {
            all_headers[k] = self.default_headers[k];
        }
        for (var k in headers) {
            all_headers[k] = headers[k];
        }
        return all_headers;
    };

    self.check_reply = function(reply, method, url, request_body,
                                ignore_error) {
        // TODO: replace ignore_error with calls to errbacks once
        //       we have switched to a promises implementation that
        //       supports errors
        var error;
        if (reply.success && reply.code == 200) {
            try {
                return self.decode_response_body(reply.body);
            }
            catch (e) {
                error = ("Could not parse response (" + str(e) +
                         ") [response body: " + reply.body + "]");
            }
        }
        else {
            error = reply.reason;
        }
        var error_msg = ("HTTP API " + method + " to " + url + " failed: " +
                         error);
        if (typeof request_body != 'undefined') {
            error_msg = error_msg + ' [request body: ' + request_body + ']';
        }
        self.im.log(error_msg);
        if (!ignore_error) {
            throw new HttpApiError(error_msg);
        }
    };

    self.api_request = function(method, url, opts) {
        var method = method.toUpperCase();

        var opts = opts || {};
        var params = opts.params;
        var data = opts.data;
        var headers = self.create_headers(opts.headers | {});
        var ignore_error = opts.ignore_error || false;

        if (typeof params != "undefined") {
            for (var key in params) {
                items[items.length] = (encodeURIComponent(key) + '=' +
                                       encodeURIComponent(params[key]));
            }
            if (items.length !== 0) {
                url = url + '?' + items.join('&');
            }
        }

        var cmd_args = {
            url: url,
            headers: headers,
        }

        if (typeof data != "undefined") {
            cmd_args.data = self.encode_request_data(data);
        }

        var p = new Promise();
        self.im.api.request(
            "http." + method.toLowerCase(), cmd_args,
            function(reply) {
                var response_data = self.check_reply(
                    reply, method, url, cmd_args.data, ignore_error);
                p.callback(response_data);
            });
        return p;
    };

    self.api_get = function(url, opts) {
        return self.api_request('GET', url, opts);
    };

    self.api_head = function(url, opts) {
        return self.api_request('HEAD', url, opts);
    };

    self.api_post = function(url, opts) {
        return self.api_request('POST', url, opts);
    };

    self.api_put = function(url, opts) {
        return self.api_request('PUT', url, opts);
    };

    self.api_delete = function(url, opts) {
        return self.api_request('DELETE', url, opts);
    };
}


function JsonApi(im, url, opts) {
    var self = this;
    HttpApi.call(self, im, url, opts);

    self.default_headers['Content-Type'] = ['application/json; charset=utf-8'];

    self.decode_response_body = function(body) {
        return JSON.parse(body);
    };

    self.encode_request_data = function(data) {
        return JSON.stringify(data);
    };
}

// exports

this.HttpApiError = HttpApiError;
this.HttpApi = HttpApi;
this.JsonApi = JsonApi;