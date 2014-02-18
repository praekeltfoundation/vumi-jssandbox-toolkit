var _ = require("underscore");

var utils = require('../utils');
var Extendable = utils.Extendable;

var api = require('./api');
var HttpRequest = api.HttpRequest;
var HttpResponse = api.HttpResponse;

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var HttpFixture = Extendable.extend(function(self, data) {
    /**class:HttpFixture(data)

    Encapsulates an expected http request and the responses that be sent back.

    :type data.request.url:
        string or :class:`RegExp`
    :param data.request.url:
        The request url
    :param string data.request.method:
        The request method. Defaults to 'GET'.
    :param object data.request.data:
        The request's un-encoded body data. Optional.
    :param object data.request.body:
        The request's already encoded body data. Optional.
    :type data.request.params:
        object or array
    :param data.request.params:
        The request's params. See :class:`UrlParams`
    :param object data.request.headers:
        An object mapping each header name to an array of header values.
    :param object data.response:
        A single response to use for this fixture, for cases where one request
        is sent out.
    :param integer data.response.code:
        The response's status code
    :param object data.response.data:
        The responses's decoded body data. Optional.
    :param object data.response.body:
        The response's un-decoded body data. Optional.
    :params array data.responses:
        An array of response data objects to use one after the other each time
        a new request is sent out.
    :param boolean data.opts.json:
        Whether the fixture should json-encode and decode the request and
        responses.

    Either ``data.response`` or ``data.responses` can be specified, or
    neither, but not both. If no responses are given, an 'empty' response with
    a status code of 200 is used.
    */
    self.defaults = {};
    self.defaults.opts = {json: true};
    self.defaults.request = {method: 'GET'};
    self.defaults.response = {code: 200};

    self.init = function(data) {
        data.opts = _(data.opts || {}).defaults(self.defaults.opts);
        data.responses = data.responses || [data.response || {}];

        self.json = data.opts.json;
        self.request = self.parse.request(data.request);
        self.responses = data.responses.map(self.parse.response);
        self.reset();
    };

    self.reset = function() {
        self.uses = 0;
    };

    self.parse = {};

    self.parse.request = function(request) {
        _(request).defaults(self.defaults.request);

        if (self.json) {
            request.encoder = JSON.stringify;
        }

        request = new HttpRequest(request.method, request.url, request);
        request.encode();
        return request;
    };

    self.parse.response = function(response) {
        _(response).defaults(self.defaults.response);

        if (self.json) {
            response.decoder = JSON.parse;
        }

        if (self.json && response.data) {
            response.body = JSON.stringify(response.data);
        }

        response = new HttpResponse(self.request, response.code, response);
        response.decode();
        return response;
    };

    self.use = function() {
        /**:HttpFixture.use()
        Returns the fixture's next unused :class:`HttpResponse`.
        */
        if (self.uses === self.responses.length) {
            throw new DummyResourceError([
                "All of the fixture's responses have been used up: " + self
            ].join(' '));
        }

        return self.responses[self.uses++];
    };

    self.toString = function() {
        return [
            "(request: " + self.request + ")",
            "(responses: " + self.responses + ")",
            "(uses: " + self.uses + ")"
        ].join(' ');
    };

    self.init(data);
});


var HttpFixtures = Extendable.extend(function(self, opts) {
    /**class:HttpFixtures(opts)
    
    Manages a set of :class:`HttpFixture`s.

    :param boolean opts.json:
        Whether the fixtures should json-encode and decode requests and
        responses.
    :params function match:
        A function of the form ``f(request, fixture)``, where ``request`` is
        the request that needs a match, and ``fixture`` is the current
        :class:`HttpFixture` being tested as a match. Should return ``true`` if
        the request and fixture match or ``false`` if they do not match.
    */
    opts = _(opts || {}).defaults({json: true});
    self.json = opts.json;
    self.fixtures = [];

    self.matcher = opts.match || function(request, fixture) {
        return self.matchers.params(request, fixture)
            && self.matchers.body(request, fixture);
    };
    
    self.match = function(request, fixture) {
        return self.matchers.method(request, fixture)
            && self.matchers.url(request, fixture)
            && self.matcher.call(self, request, fixture);
    };

    self.matchers = {};

    self.matchers.method = function(request, fixture) {
        return fixture.request.method === request.method;
    };

    self.matchers.url = function(request, fixture) {
        return _(fixture.request.url).isRegExp()
            ? fixture.request.url.test(request.url)
            : fixture.request.url === request.url;
    };

    self.matchers.params = function(request, fixture) {
        return utils.deep_equals(
            request.params.param_list, 
            fixture.request.params.param_list);
    };

    self.matchers.body = function(request, fixture) {
        return self.json
           && fixture.json
           && request.data
           && fixture.request.data
            ? utils.deep_equals(request.data, fixture.request.data)
            : request.body === fixture.request.body;
    };

    self.add = function(obj) {
        /**:HttpFixtures.add(data)
        Adds an http fixture to the fixture set from raw data.

        :param object data:
            The properties of the fixture to be added.
            See :class:`HttpFixture`.
        */
        /**HttpFixtures.add(fixture)
        Adds an already initialised fixture to the fixture set.

        :param HttpFixture fixture:
            The fixture to be added
        */
        if (!(obj instanceof HttpFixture)) {
            obj = self.create(obj);
        }
        self.fixtures.push(obj);
    };

    self.create = function(data) {
        data.opts = _(data.opts || {}).defaults({json: self.json});
        return new HttpFixture(data);
    };

    self.find = function(request) {
        /**:HttpFixtures.find(request)
        Finds the fixtures that match the given request.

        :param HttpRequest request:
            The request to find a match for.
        */
        var fixtures = self.fixtures.filter(function(fixture) {
            return self.match(request, fixture);
        });

        if (fixtures.length !== 1) {
            throw new DummyResourceError([
                "Found " + fixtures.length + " matching fixtures,",
                "expected 1: " + request
            ].join(' '));
        }

        return fixtures[0];
    };
});


var DummyHttpResource = DummyResource.extend(function(self, opts) {
    /**class:DummyHttpResource(opts)
    
    Handles api requests to the http resource from :class:`DummyApi`.

    :param boolean opts.json:
        Whether the resource's fixtures should json-encode and decode requests
        and responses.
    */
    DummyResource.call(self);
    opts = _(opts || {}).defaults({json: true});

    self.name = 'http';
    self.json = opts.json;

    /**attribute:DummyHttpResource.requests
    A list of http requests that have been sent to the resource, where each is
    of type :class:`HttpRequest`.
    */
    self.requests = [];

    /**attribute:DummyHttpResource.fixtures
    The resource's fixture set to use to send out responses to requests.
    See :class:`HttpFixtures`.
    */
    self.fixtures = new HttpFixtures(opts);

    self.url_data = function(url) {
        var data = {};
        var url_parts = url.split('?', 2);

        if (!url_parts[1]) {
            data.params = [];
        }
        else {
            data.params = url_parts[1]
                .split('&')
                .map(function(param) {
                    var parts = param.split('=', 2);

                    return {
                        name: parts[0],
                        value: parts[1]
                    };
                });
        }

        data.url = url_parts[0];
        return data;
    };

    self.request_from_cmd = function(cmd) {
        var method = cmd.cmd.split('.', 2)[1];
        var url_data = self.url_data(cmd.url);

        var opts = {
            body: cmd.data,
            params: url_data.params,
            headers: cmd.headers
        };

        if (self.json && cmd.data) {
            opts.encoder = JSON.stringify;
            opts.data = JSON.parse(cmd.data);
        }

        var request = new HttpRequest(method, url_data.url, opts);
        request.encode();
        return request;
    };

    self.handle_request = function(cmd) {
        var request = self.request_from_cmd(cmd);
        var response = self.fixtures.find(request).use();
        self.requests.push(request);

        return {
            success: true,
            code: response.code,
            body: response.body
        };
    };

    self.handlers.get = self.handle_request;
    self.handlers.head = self.handle_request;
    self.handlers.post = self.handle_request;
    self.handlers.put = self.handle_request;
    self.handlers.delete = self.handle_request;
});


this.HttpFixture = HttpFixture;
this.HttpFixtures = HttpFixtures;
this.DummyHttpResource = DummyHttpResource;
