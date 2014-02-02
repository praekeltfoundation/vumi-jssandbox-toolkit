// http_api.js
//  - Utilities for HTTP API.
var Q = require("q");

var utils = require("./utils");
var BaseError = utils.BaseError;
var Extendable = utils.Extendable;

var events = require("./events");
var Event = events.Event;
var Eventable = events.Eventable;


var HttpApiError = BaseError.extend(function(self) {
    /**class:HttpApiError()

    Thrown when an error occurs while making and checking an HTTP request and
    the corresponding API reply.
    */
    self.name = "HttpApiError";
});

var HttpRequestError = BaseError.extend(function(self, request, reason) {
    /**class:HttpRequestError(reason, request)

    Thrown when an error occurs while making and checking an HTTP request.

    :param HttpRequest request: the request.
    :param string reason: the reason for the failure. Optional.
    */
    self.name = "HttpRequestError";
    self.request = request;
    self.reason = reason || null;

    if (self.reason) {
        self.message = [self.reason + ':', self.request].join(' ');
    } else {
        self.message = self.request.toString();
    }
});

var HttpResponseError = BaseError.extend(function(self, response, reason) {
    /**class:HttpResponseError(reason, response)

    Thrown when an error response is given back for an HTTP request.

    :param HttpResponse response: the response.
    :param string reason: the reason for the failure. Optional.
    */
    self.name = "HttpResponseError";
    self.response = response;
    self.reason || null;

    if (self.reason) {
        self.message = [self.reason + ':', self.response].join(' ');
    } else {
        self.message = self.response.toString();
    }
});

var HttpResponse = Extendable.extend(function(self, request, code, opts) {
    Extendable.call(self);

    opts = utils.set_defaults(opts || {}, {
        data: null,
        body: null,
    });

    self.request = request;
    self.http = self.request.http;
    self.code = code;
    self.data = opts.data;
    self.body = opts.body;

    self.decode = function() {
        if (self.data !== null) {
            self.body = self.http.decode_response_data(self.data);
        }
    };

    self.toString = function() {
        var parts = ['[HttpResponse]', 'code: ' + self.code];

        if (self.body !== null) {
            parts.push('body: ' + self.body);
        }

        parts.push('request: ' + self.request);
        return parts.join('\n    ');
    };
});

var HttpRequest = Extendable.extend(function(self, http, method, url, opts) {
    Extendable.call(self);

    opts = utils.set_defaults(opts || {}, {
        headers: null,
        data: null,
        params: null
    });

    self.http = http;
    self.url = url;
    self.method = method.toUpperCase();
    self.headers = opts.headers;
    self.data = opts.data;
    self.body = opts.body;
    self.params = opts.params;

    self.encode = function() {
        if (self.body !== null) {
            self.data = self.http.encode_request_data(self.body);
        }
    };

    self.send = function() {
        var cmd = {};

        cmd.url = self.url;
        if (self.params !== null) {
            cmd.url = [cmd.url, utils.url_encode(self.params)].join('?');
        }

        if (self.headers !== null) {
            cmd.headers = self.headers;
        }

        if (self.body !== null) {
            cmd.data = self.body;
        }

        var cmd_name = 'http.' + self.method.toLowerCase();
        return self.http.im.api_request(cmd_name, cmd);
    };

    self.toString = function() {
        var parts = [
            '[HttpRequest]',
            'method: ' + self.method,
            'url: ' + self.url];

        if (self.body !== null) {
            parts.push('body: ' + self.body);
        }

        if (self.params !== null) {
            parts.push('params: ' + self.params);
        }

        return parts.join('\n    ');
    };

});

var HttpApi = Eventable.extend(function(self, im, opts) {
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
    opts = utils.set_defaults(opts || {}, {
        headers: {},
    });

    self.im = im;
    self.default_headers = opts.headers;

    self.make_auth = utils.basic_auth;

    if (opts.auth) {
        var auth = self.make_auth(opts.auth.username, opts.auth.password);
        self.default_headers.Authorization = [auth];
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
        utils.update(all_headers, self.default_headers);
        utils.update(all_headers, headers);
        return all_headers;
    };

    self.parse_reply = function(reply, request) {
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
        if (!reply.success) {
            throw new HttpRequestError(request, reply.reason);
        }

        var response = new HttpResponse(request, reply.code, reply.body);

        try {
            response.decode();
        }
        catch (e) {
            throw new HttpResponseError(
                response, "Could not parse response (" + e.toString() + ")");
        }

        if (response.code < 200 || reason.code >= 300) {
            throw new HttpResponseError(response);
        }

        return response;
    };

    self.request = function(method, url, opts) {
        /**:HttpApi.request(method, url, opts)

        :param string method:
            The HTTP method to use (e.g. `GET`, `POST`).
        :param string url:
            The URL to make the request to. If you pass in query parameters
            using ``opts.params``, don't include any in the URL itself.
        :param array opts.params:
            Array of key-value pairs to append to the URL as query parameters,
            where each pair takes the form
            ``{name: <param_name>, value: <param_value>}``.
        :param object opts.data:
            Data to pass as the request body. Will be encoded using
            :func:`HttpApi.encode_request_data` before being sent.
        :param object opts.headers:
            Additional headers to add to the default headers.

        Returns a promise that will be fulfilled once the request is completed.
        The value returned by the promise is the body of the response decoded
        using :func:`HttpApi.decode_response_body`. Failures while making and
        checking the request will be thrown as :class:`HttpApiError`s, and can
        be caught with a Q errback.
        */
        var request = new HttpRequest(self, method, url, opts);

        try {
            request.encode();
        }
        catch (e) {
            throw new HttpRequestError(
                request, "Could not parse request (" + e.toString() + ")");
        }

        return request.send().then(function(reply) {
            return self.parse_reply(reply, request);
        });
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
});


var JsonApi = HttpApi.extend(function(self, im, opts) {
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
});


this.HttpApiError = HttpApiError;
this.HttpApi = HttpApi;
this.JsonApi = JsonApi;
