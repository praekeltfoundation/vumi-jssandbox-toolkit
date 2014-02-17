var _ = require("underscore");

var utils = require('../utils');
var Extendable = utils.Extendable;

var api = require('./api');
var HttpRequest = api.HttpRequest;
var HttpResponse = api.HttpResponse;

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;


var HttpFixture = Extendable.extend(function(self, request, responses, opts) {
    self.defaults = {};
    self.defaults.opts = {json: true};
    self.defaults.request = {method: 'GET'};
    self.defaults.response = {code: 200};
    self.uses = 0;

    self.init = function(request, responses, opts) {
        opts = _(opts || {}).defaults(self.defaults.opts);
        self.json = opts.json;
        self.used = false;

        self.request = self.parse.request(request);
        self.responses = responses.map(self.parse.response);
    };

    self.parse = {};

    self.parse.request = function(request) {
        _(request).defaults(self.defaults.request);

        if (self.json) {
            request.encoder = JSON.parse;
        }

        request = new HttpRequest(request.method, request.url, request);
        request.encode();
        return request;
    };

    self.parse.response = function(response) {
        _(response).defaults(self.defaults.response);

        if (self.json) {
            response.decoder = JSON.stringify;
        }

        response = new HttpResponse(self.request, response.code, response);
        response.decode();
        return response;
    };

    self.use = function() {
        if (self.uses === self.responses.length) {
            // TODO
        }

        return self.responses[self.uses++];
    };

    self.init(request, responses, opts);
});


var HttpFixtures = Extendable.extend(function(self, opts) {
    opts = _(opts || {}).defaults({json: true});
    self.json = opts.json;
    self.fixtures = [];

    var match = opts.match || function(request, fixture) {
        return self.matchers.params(request, fixture)
            && self.matchers.body(request, fixture);
    };
    
    self.match = function(request, fixture) {
        return !fixture.used
            && self.matchers.url(request, fixture)
            && match.call(self, request, fixture);
    };

    self.matchers = {};

    self.matchers.url = function(request, fixture) {
        var re = new RegEx(fixture.request.url);
        return re.test(request.url);
    };

    self.matchers.params = function(request, fixture) {
        return utils.deep_equal(
            request.params.param_list, 
            fixture.request.params.param_list);
    };

    self.matchers.body = function(request, fixture) {
        return self.json
            ? utils.deep_equals(request.data, fixture.request.data)
            : request.body === fixture.request.body;
    };

    self.add = function(obj) {
        if (!(obj instanceof HttpFixture)) {
            obj = self.create(obj);
        }
        self.fixtures.push(obj);
    };

    self.create = function(data) {
        data.opts = _(data.opts || {}).defaults({json: self.json});
        data.responses = obj.responses || [obj.response];
        return new HttpFixture(data.request, data.responses, data.opts);
    };

    self.add.raw = function(data) {
        opts = _(opts || {}).defaults({json: self.json});
        self.add(data.request, data.response || data.responses);
    };

    self.find = function(request) {
        var fixtures = self.fixtures.filter(self.match);
        if (fixtures.length !== 1) {
            // TODO
        }
        return fixtures[0];
    };

    self.find = function(cmd) {
        var fixture = self.find(self.request_from_cmd(cmd));
        fixture;
    };
});


var DummyHttpResource = DummyResource.extend(function(self, opts) {
    DummyResource.call(self);
    opts = _(opts || {}).defaults({json: true});

    self.name = 'http';
    self.json = opts.json;
    self.requests = [];
    self.fixtures = new HttpFixtures(opts);

    self.url_data = function(url) {
        var data = {};
        var url_parts = url.split('?', 2);

        data.url = url_parts[0];
        data.params = (url_parts[1] || [])
            .split('&')
            .map(function(param) {
                var parts = param.split('=');

                return {
                    name: parts[0],
                    value: parts[1]
                };
            });

        return data;
    };

    self.request_from_cmd = function(cmd) {
        var method = cmd.name.split(2)[1];
        var url_data = self.url_data(cmd.data.url);

        var opts = {
            body: cmd.data.data,
            params: url_data.params,
            headers: cmd.data.headers
        };

        if (self.json) {
            opts.data = JSON.parse(data);
        }

        var request = new HttpRequest(method, url_data.url, opts);
        request.encode();
        return request;
    };

    self.handle_request = function(cmd) {
        var request = self.request_from_cmd(cmd);
        self.requests.push(request);
        return self.fixtures.find(request).use();
    };

    self.handlers.get = self.handle_request;
    self.handlers.head = self.handle_request;
    self.handlers.post = self.handle_request;
    self.handlers.put = self.handle_request;
    self.handlers.delete = self.handle_request;
});


this.HttpFixtures = HttpFixtures;
this.DummyHttpResource = DummyHttpResource;
