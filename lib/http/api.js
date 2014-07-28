var _ = require('lodash');
var url_utils = require('url');

var utils = require('../utils');
var BaseError = utils.BaseError;
var Extendable = utils.Extendable;

var events = require('../events');
var Eventable = events.Eventable;


var HttpApiError = BaseError.extend(function(self) {
    /**class:HttpApiError()

    Thrown when an error occurs while making and checking an HTTP request and
    the corresponding API reply.
    */
    self.name = "HttpApiError";
});


var HttpRequestError = BaseError.extend(function(self, request, reason) {
    /**class:HttpRequestError(request, reason)

    Thrown when an error occurs while making and checking an HTTP request.

    :param HttpRequest request: the request.
    :param string reason: the reason for the failure. Optional.
    */
    self.name = "HttpRequestError";
    self.request = request;
    self.reason = reason || null;

    self.serialize = function() {
    };

    if (self.reason) {
        self.message = [self.reason, self.request].join(' ');
    } else {
        self.message = self.request.toString();
    }
});


var HttpResponseError = BaseError.extend(function(self, response, reason) {
    /**class:HttpResponseError(response, reason)

    Thrown when an error response is returned by an HTTP request or if the HTTP
    response body cannot be parsed.

    :param HttpResponse response: the response.
    :param string reason: the reason for the failure. Optional.
    */
    self.name = "HttpResponseError";
    self.response = response;
    self.reason = reason || null;

    if (self.reason) {
        self.message = [self.reason, self.response].join(' ');
    } else {
        self.message = self.response.toString();
    }
});


var HttpRequest = Extendable.extend(function(self, method, url, opts) {
    /**class:HttpRequest(request, code, opts)

    Encapsulates information about an HTTP request made by the
    :class:`HttpApi`. Once :meth:`HttpRequest.encode` has been invoked,
    the request's data is encoded and made available as the request's body.

    :param string method:
        the HTTP request method.
    :param string url:
        the url to send the request to.
    :param string opts.data:
        the request's data to be encoded as the request's body. Optional.
    :param opts.params:
        An object of key-value pairs to append to the URL as query
        parameters. Can be in any form accepted by node.js's querystring
        module
    :param string opts.verify_options:
        A list of options to verify when doing an HTTPS request. Optional.
    :param string opts.ssl_method:
        A request for a specific ssl method to be attempted. Optional.
    */
    Extendable.call(self);

    opts = _.defaults(opts || {}, {
        headers: null,
        body: null,
        data: null,
        params: {},
        encoder: _.identity,
        verify_options: null,
        ssl_method: null
    });

    self.url = url;
    if (_.isString(self.url)) {
        self.url = url_utils.format(url_utils.parse(url));
    }

    self.method = method.toUpperCase();
    self.headers = opts.headers;
    self.data = opts.data;
    self.body = opts.body;
    self.params = opts.params;
    self.encoder = opts.encoder;
    self.verify_options = opts.verify_options;
    self.ssl_method = opts.ssl_method;

    self.encode = function() {
        /**:HttpRequest.encode()

        Encodes the request data (if available).
        */
        if (self.data !== null) {
            try {
                self.body = self.encoder(self.data);
            }
            catch (e) {
                throw new HttpRequestError(
                    self, "Could not parse request (" + e.toString() + ")");
            }
        }
    };

    self.to_cmd = function() {
        /**:HttpRequest.to_cmd()

        Returns a sandbox API command that can be used to initiate this request
        via the sandbox API.
        */
        var cmd = {};
        cmd.data = {};
        cmd.name = 'http.' + self.method.toLowerCase();

        var url_data = url_utils.parse(self.url);
        url_data.query = self.params;
        cmd.data.url = url_utils.format(url_data);

        if (self.headers !== null) {
            cmd.data.headers = self.headers;
        }

        if (self.body !== null) {
            cmd.data.data = self.body;
        }

        if (self.verify_options !== null) {
            cmd.data.verify_options = self.verify_options;
        }

        if (self.ssl_method !== null) {
            cmd.data.ssl_method = self.ssl_method;
        }
        
        return cmd;
    };

    self.serialize = function() {
      var data = {
        url: self.url,
        method: self.method
      };

      if (self.body !== null) { data.body = self.body; }
      if (_.size(self.params)) { data.params = self.params; }
      return data;
    };

    self.toJSON = self.serialize;
});


var HttpResponse = Extendable.extend(function(self, request, code, opts) {
    /**class:HttpResponse(request, code, opts)

    Encapsulates information about an HTTP response given to the
    :class:`HttpApi`. Once :meth:`HttpResponse.decode` has been invoked,
    the response's body is decoded and made available as the response's data.

    :param HttpRequest request:
        the request that caused the response.
    :param integer code:
        the status code for the HTTP response.
    :param string opts.body:
        the response's body to be decoded as the response's data. Optional.
    */
    Extendable.call(self);

    opts = _.defaults(opts || {}, {
        data: null,
        body: null,
        decoder: _.identity
    });

    self.request = request;
    self.code = code;
    self.data = opts.data;
    self.body = opts.body;
    self.decoder = opts.decoder;

    self.decode = function() {
        /**:HttpResponse.decode()

        Decodes the responses body (if available).
        */
        if (self.body !== null) {

            try {
                self.data = self.decoder(self.body);
            }
            catch (e) {
                throw new HttpResponseError(
                    self, "Could not parse response (" + e.toString() + ")");
            }
        }
    };

    self.serialize = function() {
        var data = {
            code: self.code,
            request: self.request.serialize()
        };

        if (self.body !== null) { data.body = self.body; }
        return data;
    };

    self.toJSON = self.serialize;
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
    :param string opts.verify_options:
        The default list of options to verify when doing HTTPS requests.
        Optional.
    :param string opts.ssl_method:
       The default ssl method to attempt for HTTPS requests. Optional.
    */
    opts = _.defaults(opts || {}, {headers: {}});

    self.im = im;
    self.defaults = _.pick({
        headers: opts.headers,
        auth: opts.auth,
        verify_options: opts.verify_options,
        ssl_method: opts.ssl_method
    }, utils.exists);

    self.make_auth = utils.basic_auth;

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

    self.parse_opts = function(opts) {
        var headers = _.extend({}, self.defaults.headers);
        opts = _.defaults(opts || {}, self.defaults);

        if (opts.auth) {
            headers.Authorization = [self.make_auth(
                opts.auth.username,
                opts.auth.password)];
        }

        opts.headers = _.defaults({}, opts.headers, headers);
        opts.encoder = self.encode_request_data;
        return opts;
    };

    self.parse_reply = function(reply, request) {
        /**:HttpApi.parse_reply(reply, request)

        Check an HTTP reply and throw an :class:`HttpRequestError` if the
        sandbox API command was unsuccessful, or otherwise parse the sandbox's
        reply into a response.  If the response status code is not in the 200
        range or the reply body cannot be decoded, throw an
        :class:`HttpResponseError`.

        Logs an error via the sandbox logging resource in an error is raised.

        :param object reply:
            Raw response to the sandbox API command.
        :param HttpRequest request:
            The request that initiated the sandbox API command.

        Returns an :class:`HttpResponse` or throws an :class:`HttpApiError`
        (either the :class:`HttpRequestError` or :class:`HttpResponseError`
        derivative, depending on what error occured).
        */
        var response = new HttpResponse(request, reply.code, {
            body: reply.body,
            decoder: self.decode_response_body
        });

        response.decode();

        if (response.code < 200 || response.code >= 300) {
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
        :param opts.params:
            An object of key-value pairs to append to the URL as query
            parameters. Can be in any form accepted by node.js's querystring
            module
        :param object opts.data:
            Data to pass as the request body. Will be encoded using
            :func:`HttpApi.encode_request_data` before being sent.
        :param object opts.headers:
            Additional headers to add to the default headers.

        Returns a :class:`HttpResponse` via a promise. Failures while making
        and checking the request will be thrown as :class:`HttpApiError`s, and
        can be caught with a Q errback. See :meth:`HttpApi.parse_reply` for
        more on the response parsing and error throwing.
        */
        var request = new HttpRequest(method, url, self.parse_opts(opts));
        request.encode();

        var cmd = request.to_cmd();
        return self
            .im.api_request(cmd.name, cmd.data)
            .then(
                function(reply) {
                    return self.parse_reply(reply, request);
                }, function(e) {
                    throw new HttpRequestError(request, e.reply.reason);
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

    self.defaults.headers['Content-Type'] = ['application/json; charset=utf-8'];

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


this.HttpApi = HttpApi;
this.JsonApi = JsonApi;

this.HttpApiError = HttpApiError;
this.HttpRequestError = HttpRequestError;
this.HttpResponseError = HttpResponseError;
this.HttpRequest = HttpRequest;
this.HttpResponse = HttpResponse;
