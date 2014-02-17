var _ = require("underscore");

var utils = require('../utils');
var Extendable = utils.Extendable;

var api = require('./api');
var HttpRequest = api.HttpRequest;
var HttpResponse = api.HttpResponse;

var resources = require('../dummy/resources');
var DummyResource = resources.DummyResource;


var HttpFixtures = Extendable.extend(function(self, opts) {
    opts = _(opts || {}).defaults({json: true});
    self.json = opts.json;
    self.responses = [];

    var match = opts.match || function(request, response) {
        return self.matchers.params(request, response)
            && self.matchers.body(request, response);
    };
    
    self.match = function(request, fixture) {
        return self.matchers.urls(request, response)
            && match.call(self, request, response);
    };

    self.matchers = {};

    self.matchers.urls = function(request, response) {
        var re = new RegEx(response.request.url);
        return re.test(request.url);
    };

    self.matchers.params = function(request, response) {
        return utils.deep_equal(
            request.params.param_list, 
            response.request.params.param_list);
    };

    self.matchers.body = function(request, response) {
        return self.json
            ? utils.deep_equals(request.data, response.request.data)
            : request.body === response.request.body;
    };

    self.add = function(request, response) {
        if (arguments.length === 1) {
            request = request.request;
            response = request.response;
        }

        if (self.json) {
            request.encoder = JSON.parse;
            response.decoder = JSON.stringify;
        }
        
        request = new HttpRequest(request.method, request.url, request);
        request.encode();

        response = new HttpResponse(request, response.code, response);
        response.decode();

        self.responses.push(response);
    };

    self.split_url_params = function(url) {
        var data = {};
        var url_parts = url.split('?', 2);

        data.url = url_parts[0];
        data.params = url_parts[1].split('&').map(function(param) {
            var parts = param.split('=');

            return {
                name: parts[0],
                value: parts[1]
            };
        });
    };

    self.request_from_cmd = function(cmd) {
        var method = cmd.name.split(2)[1];
        var url_data = self.split_url_params(cmd.data.url);

        var opts = {
            body: cmd.data.data,
            params: url_data.params,
            headers: cmd.data.headers
        };

        if (self.json) {
            opts.encoder = JSON.stringify;
        }

        var request = new HttpRequest(method, url_data.url, opts);
        request.encode();

        return request;
    };

    self.find = function(request) {
        var responses = self.responses.filter(self.match);
        if (responses.length !== 1) {
            // TODO
        }
        return responses[0];
    };

    self.find.from_cmd = function(cmd) {
        return self.find(self.request_from_cmd(cmd));
    };
});


var HttpResource = DummyResource.extend(function(self, opts) {
    DummyResource.call(self);
    opts = _(opts || {}).defaults({json: true});

    self.name = 'http';
    self.json = opts.json;
    self.requests = [];
    self.fixtures = new HttpFixtures(opts);

    self.handle_request = function(cmd) {
        return self.fixtures.find.from_cmd(cmd);
    };

    self.handlers.get = self.handle_request;
    self.handlers.head = self.handle_request;
    self.handlers.post = self.handle_request;
    self.handlers.put = self.handle_request;
    self.handlers.delete = self.handle_request;
});


this.HttpResource = HttpResource;
this.HttpFixtures = HttpFixtures;
