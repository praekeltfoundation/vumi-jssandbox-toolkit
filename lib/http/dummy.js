var _ = require("underscore");

var utils = require('../utils');
var Extendable = utils.Extendable;

var api = require('./api');
var HttpRequest = api.HttpRequest;
var HttpResponse = api.HttpResponse;

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;
var DummyResourceError = resources.DummyResourceError;


var encodings = {
    none: {
        encoder: _.identity,
        decoder: _.identity
    },
    json: {
        encoder: JSON.stringify,
        decoder: JSON.parse
    }
};

var HttpFixture = Extendable.extend(function(self, opts) {
    /**class:HttpFixture(opts)

    Encapsulates an expected http request and the responses that be sent back.

    :type opts.request.url:
        string or :class:`RegExp`
    :param opts.request.url:
        The request url
    :param string opts.request.method:
        The request method. Defaults to 'GET'.
    :param object opts.request.data:
        The request's un-encoded body data. Optional.
    :param object opts.request.body:
        The request's already encoded body data. Optional.
    :type opts.request.params:
        object or array
    :param opts.request.params:
        The request's params. See :class:`UrlParams`
    :param object opts.request.headers:
        An object mapping each header name to an array of header values.
    :param object opts.response:
        A single response to use for this fixture, for cases where one request
        is sent out.
    :param integer opts.response.code:
        The response's status code
    :param object opts.response.data:
        The responses's decoded body data. Optional.
    :param object opts.response.body:
        The response's un-decoded body data. Optional.
    :params array opts.responses:
        An array of response data objects to use one after the other each time
        a new request is sent out.
    :params string opts.encoding:
        The encoding to use for encoding requests and decoding responses.
        Possible values are 'json' and 'none'. If the request's 'Content-Type'
        header is set, the encoding is inferred using that instead.

    Either ``opts.response`` or ``opts.responses` can be specified, or
    neither, but not both. If no responses are given, an 'empty' response with
    a status code of 200 is used.
    */
    self.defaults = {
        encoding: 'none',
        request: {method: 'GET'},
        response: {code: 200}
    };

    self.init = function(opts) {
        var request = opts.request;
        var responses = opts.responses || [opts.response || {}];
        _(opts).defaults(self.defaults);

        if ('Content-Type' in (request.headers || {})) {
            self.encoding = infer_encoding(request.headers);
        } else {
            self.encoding = encodings[opts.encoding];
        }

        self.request = self.parse.request(request);
        self.responses = responses.map(self.parse.response);
        self.reset();
    };

    self.reset = function() {
        self.uses = 0;
    };

    self.parse = {};

    self.parse.request = function(request) {
        _(request).defaults(self.defaults.request);
        request.encoder = self.encoding.encoder;

        request = new HttpRequest(request.method, request.url, request);
        request.encode();
        return request;
    };

    self.parse.response = function(response) {
        _(response).defaults(self.defaults.response);
        response.decoder = self.encoding.decoder;

        if (response.data) {
            response.body = self.encoding.encoder(response.data);
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

    self.init(opts);
});

var HttpFixtures = Extendable.extend(function(self, opts) {
    /**class:HttpFixtures(opts)
    
    Manages a set of :class:`HttpFixture`s.

    :params function opts.match:
        A function of the form ``f(request, fixture)``, where ``request`` is
        the request that needs a match, and ``fixture`` is the current
        :class:`HttpFixture` being tested as a match. Should return ``true`` if
        the request and fixture match or ``false`` if they do not match.
    :param boolean opts.defaults:
        Defaults to use for each added fixture.
    :params string opts.encoding:
        The encoding to use for encoding requests and decoding responses.
        Possible values are 'json' and 'none'. If a request's 'Content-Type'
        header is set, the encoding is inferred using that instead.
    */
    opts = _(opts || {}).defaults({
        defaults: {},
        encoding: 'none'
    });

    self.encoding = encodings[opts.encoding];
    self.fixture_defaults = _(opts.defaults).defaults({
        request: {},
        response: {},
        encoding: opts.encoding
    });
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
        return request.data && fixture.request.data
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
        _(data).defaults({
            request: {},
            response: {},
        });
        _(data.request).defaults(self.fixture_defaults.request);
        _(data.response).defaults(self.fixture_defaults.response);
        _(data).defaults(self.fixture_defaults);
        return new HttpFixture(data);
    };

    self.filter = function(request) {
        /**:HttpFixtures.filter(request)
        Finds the fixtures that match the given request.

        :param HttpRequest request:
            The request to find a match for.
        */
        return self.fixtures.filter(function(fixture) {
            return self.match(request, fixture);
        });
    };

    self.find = function(request) {
        /**:HttpFixtures.find(request)
        Returns the first fixture that matches the given request.

        :param HttpRequest request:
            The request to find a match for.
        */
       // TODO short circuit on first match
       return self.filter(request)[0];
    };
});


var DummyHttpResource = DummyResource.extend(function(self, opts) {
    /**class:DummyHttpResource(opts)
    
    Handles api requests to the http resource from :class:`DummyApi`.

    :params string opts.encoding:
        The encoding to use for encoding requests and decoding responses.
        Possible values are 'json' and 'none'. If a request's 'Content-Type'
        header is set, the encoding is inferred using that instead.
    */
    DummyResource.call(self);
    opts = _(opts || {}).defaults({encoding: 'none'});
    self.encoding = encodings[opts.encoding];
    self.name = 'http';

    /**attribute:DummyHttpResource.requests
    A list of http requests that have been sent to the resource, where each is
    of type :class:`HttpRequest`.
    */
    self.requests = [];

    /**attribute:DummyHttpResource.fixtures
    The resource's fixture set to use to send out responses to requests.
    See :class:`HttpFixtures`.
    */
    self.fixtures = new HttpFixtures({encoding: opts.encoding});

    self.request_from_cmd = function(cmd) {
        var method = cmd.cmd.split('.', 2)[1];
        var url_data = split_url_params(cmd.url);

        var encoding;
        if ('Content-Type' in (cmd.headers || {})) {
            encoding = infer_encoding(cmd.headers);
        }
        else {
            encoding = self.encoding;
        }

        var opts = {
            body: cmd.data,
            params: url_data.params,
            headers: cmd.headers,
            encoder: encoding.encoder
        };

        if (cmd.data) {
            opts.data = encoding.decoder(cmd.data);
        }

        var request = new HttpRequest(method, url_data.url, opts);
        request.encode();
        return request;
    };

    self.handle_request = function(cmd) {
        var request = self.request_from_cmd(cmd);
        var fixtures = self.fixtures.filter(request);

        if (!fixtures.length) {
            throw new DummyResourceError([
                "Found no matching fixtures",
                "(request: " + request + ")",
            ].join(' '));
        }

        if (fixtures.length > 1) {
            throw new DummyResourceError([
                "Found " + fixtures.length + " matching fixtures, expected 1",
                "(request: " + request + ")",
                "(fixtures: " + fixtures + ")"
            ].join(' '));
        }

        var response = fixtures[0].use();
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

function infer_encoding(headers) {
    function content_is(content_type) {
        return _(headers['Content-Type'] || []).find(function(v) {
            return v.indexOf(content_type) > -1;
        });
    }

    if (content_is('application/json')) {
        return encodings.json;
    }

    return encodings.none;
}

function split_url_params(url) {
    var url_parts = url.split('?', 2);

    var data = {
        url: url_parts[0],
        params: []
    };

    if (url_parts[1]) {
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

    return data;
}


this.HttpFixture = HttpFixture;
this.HttpFixtures = HttpFixtures;
this.DummyHttpResource = DummyHttpResource;

this.split_url_params = split_url_params;
this.infer_encoding = infer_encoding;
