// http_api.js
//  - Utilities for HTTP API.

var promise = require("./promise.js");
var Promise = promise.Promise;


function HttpApiError(msg) {
    /**class:HttpApiError(msg)

    Thrown when an error occurs while making an HTTP request.

    :param string msg:
        a description of the error.
    */

    this.name = "HttpApiError";
    this.message = msg;
}
HttpApiError.prototype = new Error();
HttpApiError.prototype.constructor = HttpApiError;


function HttpApi(im, opts) {
    /**class:HttpApi(im, opts)

    A helper class for making HTTP requests via the HTTP sandbox resource.

    :param InteractionMachine im:
        The interaction machine to use when making requests.
    :param object opts.headers:
        Default headers to use in HTTP requests.
    :param object opts.auth:
        Adds a HTTP Basic authentication to the default headers. Should
        contain ``username`` and ``password`` attributes.
    */

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
        /**:HttpApi.decode_response_body(body)

        :param string body:
            The body to decode.

        Sub-classes should override this to decode the response body and throw
        an exception if the body cannot be parsed. This base implementation
        returns the body as-is (i.e. decoding is left to the code calling the
        :class:`HttpApi`).
        */
        return body;
    };

    self.encode_request_data = function(data) {
        /**:HttpApi.encode_request_data(data)

        :param object data:
            The data to encode.

        Sub-classes should override this to encode the request body and throw
        an exception if the data cannot be encoded. This base implementation
        returns the data as-is (i.e. encoding is left to code calling the
        :class:`HttpApi`).
        */
        return data;
    };

    self.create_headers = function(headers) {
        /**:HttpApi.create_headers(headers)

        Combines a set of custom headers with the default headers passed to
        :class:`HttpApi`.

        :param object headers:
            Additional HTTP headers. Attributes are header names. Values are
            header values.

        Returns the complete set of HTTP headers.
        */
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
        /**:HttpApi.check_reply(reply, method, url, request_body)

        Check an HTTP reply and raise an :class:`HttpApiError` if the response
        status code is not in the 200 range or the reply body cannot be
        decoded.

        Logs an error via the sandbox logging resource in an error is raised.

        :param object reply:
            Raw response to the sandbox API command.
        :param string method:
            The HTTP method used in the request (for use in error messages).
        :param string url:
            The URL the HTTP request was made to (for use in error messages).
        :param string request_body:
            The body of the HTTP request (for use in error messages).

        Returns the decoded response body or raises an :class:`HttpApiError`.
        */
        var error;
        if (reply.success) {
            if (200 <= reply.code && reply.code < 300) {
                try {
                    return self.decode_response_body(reply.body);
                }
                catch (e) {
                    error = ("Could not parse response (" + e.toString() +
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
        /**:HttpApi.request(method, url, opts)

        :param string method:
            The HTTP method to use (e.g. `GET`, `POST`).
        :param string url:
            The URL to make the request to.
        :param object opts.params:
            Key-value pairs to append to the URL as query parameters.
        :param object opts.data:
            Data to pass as the request body. Will be encoded using
            :func:`HttpApi.encode_request_data` before being sent.
        :param object opts.headers:
            Additional headers to add to the default headers.

        Returns a promise that fires once the request is completed.
        The value returned by the promise is the body of the response
        decoded using :func:`HttpApi.decode_response_body` or an object
        containing an attribute named `error` whose value is the error
        message.
        */
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
        /**:HttpApi.get(url, opts)

        Make an HTTP GET request.

        :param string url:
            The URL to make the request to.
        :param object opts:
            Options to pass to :func:`HttpApi.request`.

        Returns a promise which fires with the decoded value of the
        response body or an object with an error attribute containing
        the error message.
        */
        return self.request('GET', url, opts);
    };

    self.head = function(url, opts) {
        /**:HttpApi.head(url, opts)

        Make an HTTP HEAD request.

        :param string url:
            The URL to make the request to.
        :param object opts:
            Options to pass to :func:`HttpApi.request`.

        Returns a promise which fires with the decoded value of the
        response body or an object with an error attribute containing
        the error message.
        */
        return self.request('HEAD', url, opts);
    };

    self.post = function(url, opts) {
        /**:HttpApi.post(url, opts)

        Make an HTTP POST request.

        :param string url:
            The URL to make the request to.
        :param object opts:
            Options to pass to :func:`HttpApi.request`.

        Returns a promise which fires with the decoded value of the
        response body or an object with an error attribute containing
        the error message.
        */
        return self.request('POST', url, opts);
    };

    self.put = function(url, opts) {
        /**:HttpApi.put(url, opts)

        Make an HTTP PUT request.

        :param string url:
            The URL to make the request to.
        :param object opts:
            Options to pass to :func:`HttpApi.request`.

        Returns a promise which fires with the decoded value of the
        response body or an object with an error attribute containing
        the error message.
        */
        return self.request('PUT', url, opts);
    };

    self.delete = function(url, opts) {
        /**:HttpApi.delete(url, opts)

        Make an HTTP DELETE request.

        :param string url:
            The URL to make the request to.
        :param object opts:
            Options to pass to :func:`HttpApi.request`.

        Returns a promise which fires with the decoded value of the
        response body or an object with an error attribute containing
        the error message.
        */
        return self.request('DELETE', url, opts);
    };
}


function JsonApi(im, opts) {
    /**class:JsonApi(im, opts)

    A helper class for making HTTP requests that send and receive JSON
    encoded data.

    :param InteractionMachine im:
        The interaction machine to use when making requests.
    :param object opts.headers:
        Default headers to use in HTTP requests. The ``Content-Type``
        header is overridden to be ``application/json; charset=utf-8``.
    :param object opts.auth:
        Adds a HTTP Basic authentication to the default headers. Should
        contain ``username`` and ``password`` attributes.
    */

    var self = this;
    HttpApi.call(self, im, opts);

    self.default_headers['Content-Type'] = ['application/json; charset=utf-8'];

    self.decode_response_body = function(body) {
        /**:JsonApi.decode_response_body(body)

        Decode an HTTP response body using ``JSON.parse()``.

        :param string body:
            Raw HTTP response body to parse.

        Returns the decoded response body.
        */
        return JSON.parse(body);
    };

    self.encode_request_data = function(data) {
        /**:JsonApi.encode_request_data(data)

        Encode an object as JSON using ``JSON.stringify()``.

        :param object data:
            Object to encode to JSON.

        Returns the serialized object as a string.
        */
        return JSON.stringify(data);
    };
}

// exports

this.HttpApiError = HttpApiError;
this.HttpApi = HttpApi;
this.JsonApi = JsonApi;
