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
        var hash = (new Buffer(opts.auth.username + ":"
                               + opts.auth.password)).toString('base64');
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

    self.check_reply = function(reply, method, url, request_body) {
        var error;
        if (reply.success) {
            if (reply.code == 200) {
                try {
                    return self.decode_response_body(reply.body);
                }
                catch (e) {
                    error = ("Could not parse response (" + str(e) +
                             ") [response body: " + reply.body + "]");
                }
            }
            else {
                error = reply.body;
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
        throw new HttpApiError(error_msg);
    };

    self.request = function(method, url, opts) {
        var method = method.toUpperCase();

        var opts = opts || {};
        var params = opts.params;
        var data = opts.data;
        var headers = self.create_headers(opts.headers || {});

        if (typeof params != "undefined") {
            var items = [];
            for (var key in params) {
                items.push(encodeURIComponent(key) + '=' +
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
                try {
                    var response_data = self.check_reply(
                        reply, method, url, cmd_args.data);
                    p.callback(response_data);
                }
                catch (e) {
                    // TODO: call p.errback() once we have a promises
                    //       implementation with errors.
                    p.callback({error: e.toString()});
                }
            });
        return p;
    };

    self.get = function(url, opts) {
        return self.request('GET', url, opts);
    };

    self.head = function(url, opts) {
        return self.request('HEAD', url, opts);
    };

    self.post = function(url, opts) {
        return self.request('POST', url, opts);
    };

    self.put = function(url, opts) {
        return self.request('PUT', url, opts);
    };

    self.delete = function(url, opts) {
        return self.request('DELETE', url, opts);
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