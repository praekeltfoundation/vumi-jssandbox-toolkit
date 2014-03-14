var assert = require('assert');

var vumigo = require('../../lib');
var test_utils = vumigo.test_utils;

var api = vumigo.http.api;
var HttpApi = api.HttpApi;
var JsonApi = api.JsonApi;
var UrlParams = api.UrlParams;
var HttpRequest = api.HttpRequest;
var HttpResponse = api.HttpResponse;
var HttpResponseError = api.HttpResponseError;
var HttpRequestError = api.HttpRequestError;


describe("http.api", function() {
    describe("HttpRequestError", function() {
        var request;

        beforeEach(function() {
            request = new HttpRequest('GET', 'http://foo.com/');
        });

        describe(".message", function() {
            it("should include the request", function() {
                var error = new HttpRequestError(request);
                assert(error.message.indexOf(request) > -1);
            });

            it("should include the error reason if available", function() {
                var error = new HttpRequestError(request, 'Sigh');
                assert(error.message.indexOf('Sigh') > -1);
            });
        });
    });

    describe("HttpResponseError", function() {
        var response;

        beforeEach(function() {
            var request = new HttpRequest('GET', 'http://foo.com/');
            response = new HttpResponse(request, 404);
        });

        describe(".message", function() {
            it("should include the response", function() {
                var error = new HttpResponseError(response);
                assert(error.message.indexOf(response) > -1);
            });

            it("should include the error reason if available", function() {
                var error = new HttpResponseError(response, 'Sigh');
                assert(error.message.indexOf('Sigh') > -1);
            });
        });
    });

    describe("UrlParams", function() {
        var url_params;

        describe("on creation", function() {
            it("should accept null values", function () {
                url_params = new UrlParams(null);
                assert.deepEqual(url_params.param_list, []);
            });

            it("should accept undefined values", function () {
                url_params = new UrlParams();
                assert.deepEqual(url_params.param_list, []);
            });

            it("should accept arrays of parameters", function() {
                url_params = new UrlParams([
                    {name: "foo", value: "value-1"},
                    {name: "foo", value: "value-2"},
                ]);
                assert.deepEqual(url_params.param_list, [
                    {name: "foo", value: "value-1"},
                    {name: "foo", value: "value-2"},
                ]);
            });

            it("should accept simple objects", function() {
                url_params = new UrlParams({
                    foo: "bar", boo: "far"
                });
                assert.deepEqual(url_params.param_list, [
                    {name: "boo", value: "far"},
                    {name: "foo", value: "bar"},
                ]);
            });
        });

        describe(".append_to", function() {
            it("should not change the URL if there are no parameters", function() {
                url_params = new UrlParams();
                assert.strictEqual(
                    "http://example.com/",
                    url_params.append_to("http://example.com/"));
            });

            it("should append any URL parameters", function() {
                url_params = new UrlParams({foo: "fog", boo: "bog"});
                assert.strictEqual(
                    "http://example.com/?boo=bog&foo=fog",
                    url_params.append_to("http://example.com/"));
            });
        });

        describe(".exist", function() {
            it("should return true if there are parameters", function() {
                url_params = new UrlParams({foo: "bar"});
                assert.strictEqual(true, url_params.exist());
            });

            it("should return false if there are no parameters", function() {
                url_params = new UrlParams();
                assert.strictEqual(false, url_params.exist());
            });
        });

        describe(".toJSON", function() {
            it("should return the list of query parameters", function() {
                url_params = new UrlParams({foo: "bar"});
                assert.strictEqual(
                    '[{"name":"foo","value":"bar"}]',
                    JSON.stringify(url_params));
            });
        });
    });

    describe("HttpRequest", function() {
        describe(".encode", function() {
            it("should encode the request's body if available", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    data: {foo: 'bar'},
                    encoder: JSON.stringify
                });
                request.encode();
                assert.deepEqual(request.body, '{"foo":"bar"}');
            });

            it("should throw an error if encoding fails", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    data: {foo: 'bar'},
                    encoder: function() {
                        throw Error("You shall not parse");
                    }
                });

                assert.throws(function() {
                    request.encode();
                }, HttpRequestError);
            });
        });

        describe(".to_cmd", function() {
            it("should convert the request to a sandbox API command", function() {
                var request = new HttpRequest('GET', 'http://foo.com/');
                assert.deepEqual(request.to_cmd(), {
                    name: 'http.get',
                    data: {url: 'http://foo.com/'}
                });
            });

            it("should include the request headers if available", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    headers: {foo: ['bar']}
                });

                var cmd = request.to_cmd();
                assert.deepEqual(cmd.data.headers, {foo: ['bar']});
            });

            it("should include the url params if passed as a list", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    params: {bar: 'baz'}
                });

                var cmd = request.to_cmd();
                assert.equal(cmd.data.url, 'http://foo.com/?bar=baz');
            });

            it("should include the url params if passed as an object", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    params: {bar: "baz", zar: "zaz"}
                });

                var cmd = request.to_cmd();
                assert.equal(cmd.data.url, 'http://foo.com/?bar=baz&zar=zaz');
            });

            it("should include the request body if available", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    data: {foo: 'bar'},
                    encoder: JSON.stringify
                });
                request.encode();

                var cmd = request.to_cmd();
                assert.equal(cmd.data.data, '{"foo":"bar"}');
            });
        });

        describe(".toString", function() {
            it("should include the request method", function() {
                var request = new HttpRequest('GET', 'http://foo.com/');
                assert(request.toString().indexOf('GET') > -1);
            });

            it("should include the url", function() {
                var request = new HttpRequest('GET', 'http://foo.com/');
                assert(request.toString().indexOf('http://foo.com/') > -1);
            });

            it("should include the body if available", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    data: {foo: 'bar'},
                    encoder: JSON.stringify
                });
                request.encode();

                assert(request.toString().indexOf('{"foo":"bar"}') > -1);
            });

            it("should include the params if available", function() {
                var request = new HttpRequest('GET', 'http://foo.com/', {
                    params: {bar: 'baz'}
                });

                var request_str = request.toString();
                assert(request_str.indexOf(
                    '(params: {"bar":"baz"})') > -1);
            });

            it("should exclude the params if not present", function() {
                var request = new HttpRequest('GET', 'http://foo.com/');
                assert.strictEqual(
                    request.toString().indexOf('(params:'), -1);
            });
        });
    });

    describe("HttpResponse", function() {
        var request;

        beforeEach(function() {
            request = new HttpRequest('GET', 'http://foo.com/');
        });

        describe(".decode", function() {
            it("should decode the response's data if available", function() {
                var response = new HttpResponse(request, 404, {
                    body: '{"foo":"bar"}',
                    decoder: JSON.parse
                });
                response.decode();
                assert.deepEqual(response.data, {foo: 'bar'});
            });

            it("should throw an error if decoding fails", function() {
                var response = new HttpResponse(request, 404, {
                    body: '{"foo":"bar"}',
                    decoder: function() {
                        throw Error("You shall not parse");
                    }
                });

                assert.throws(function() {
                    response.decode();
                }, HttpResponseError);
            });
        });

        describe(".toString", function() {
            it("should include the code", function() {
                var response = new HttpResponse(request, 404);
                assert(response.toString().indexOf(404) > -1);
            });

            it("should include the body if available", function() {
                var response = new HttpResponse(request, 404, {
                    body: '{"foo":"bar"}'
                });
                assert(response.toString().indexOf('{"foo":"bar"}') > -1);
            });
        });
    });

    describe("HttpApi", function() {
        var im;
        var api;

        function make_api(opts) {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
                api = new HttpApi(im, opts);
                return api;
            });
        }

        beforeEach(function() {
            return make_api().then(function(new_api) {
                api = new_api;
                im = api.im;
            });
        });

        describe(".get", function() {
            it("should perform GET requests", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/',
                        headers: {'Content-Type': ['application/json']}
                    },
                    response: {
                        data: {foo: "bar"}
                    }
                });

                return api.get('http://foo.com/').then(function(response) {
                    assert.equal(response.code, 200);
                    assert.equal(response.body, JSON.stringify({foo: "bar"}));
                });
            });
        });

        describe(".head", function() {
            it("should perform HEAD requests", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'HEAD',
                        url: 'http://foo.com/',
                        headers: {'Content-Type': ['application/json']}
                    }
                });

                return api.head('http://foo.com/').then(function(response) {
                    assert.equal(response.code, 200);
                    assert.strictEqual(response.data, null);
                });
            });
        });

        describe(".post", function() {
            it("should perform POST requests", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'POST',
                        url: 'http://foo.com/',
                        data: {lerp: 'larp'},
                        headers: {'Content-Type': ['application/json']}
                    },
                    response: {
                        data: {foo: 'bar'}
                    }
                });

                return api.post('http://foo.com/', {
                    data: JSON.stringify({lerp: 'larp'}),
                    headers: {'Content-Type': ['application/json']}
                }).then(function(response) {
                    assert.equal(response.code, 200);
                    assert.strictEqual(
                        response.data,
                        JSON.stringify({foo: "bar"}));
                });
            });
        });

        describe(".put", function() {
            it("should perform PUT requests", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'PUT',
                        url: 'http://foo.com/',
                        data: {lerp: 'larp'},
                        headers: {'Content-Type': ['application/json']}
                    },
                    response: {
                        data: {foo: 'bar'}
                    }
                });

                return api.put('http://foo.com/', {
                    data: JSON.stringify({lerp: 'larp'}),
                    headers: {'Content-Type': ['application/json']}
                }).then(function(response) {
                    assert.equal(response.code, 200);
                    assert.strictEqual(
                        response.data,
                        JSON.stringify({foo: "bar"}));
                });
            });
        });

        describe(".delete", function() {
            it("should perform DELETE requests", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'DELETE',
                        url: 'http://foo.com/',
                        data: {lerp: 'larp'},
                        headers: {'Content-Type': ['application/json']}
                    },
                    response: {
                        data: {foo: 'bar'}
                    }
                });

                return api.delete('http://foo.com/', {
                    data: JSON.stringify({lerp: 'larp'}),
                    headers: {'Content-Type': ['application/json']}
                }).then(function(response) {
                    assert.equal(response.code, 200);
                    assert.strictEqual(
                        response.data,
                        JSON.stringify({foo: "bar"}));
                });
            });
        });

        describe(".request", function() {
            it("should accept responses in the 200 range", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/'
                    },
                    response: {
                        code: 201,
                        body: '201 Created'
                    }
                });

                return api
                    .request('get', 'http://foo.com/')
                    .then(function(response) {
                        assert.equal(response.code, 201);
                        assert.equal(response.data, '201 Created');
                    });
            });

            it("should support request body data", function() {
                im.api.http.fixtures.add({
                    request: {
                        url: 'http://foo.com/',
                        method: 'POST',
                        body: 'ping'
                    }
                });

                return api.request("post", 'http://foo.com/', {
                    data: 'ping',
                }).then(function() {
                    var request = im.api.http.requests[0];
                    assert.equal(request.body, 'ping');
                });
            });

            it("should support request url params", function() {
                im.api.http.fixtures.add({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/',
                        params: {
                            a: '1',
                            b: '2'
                        }
                    }
                });

                return api.get('http://foo.com/', {
                    params: {
                        a: '1',
                        b: '2'
                    }
                }).then(function(data) {
                    var request = im.api.http.requests[0];
                    assert.deepEqual(request.params, {
                        a: '1',
                        b: '2'
                    });
                });
            });

            it("should support basic auth", function() {
                return make_api({
                    auth: {
                        username: 'me',
                        password: 'pw'
                    }
                }).then(function() {
                    im.api.http.fixtures.add({
                        request: {
                            method: 'GET',
                            url: 'http://foo.com/',
                        }
                    });

                    return api.get('http://foo.com/');
                }).then(function() {
                    var request = im.api.http.requests[0];
                    assert.deepEqual(
                        request.headers.Authorization,
                        ['Basic bWU6cHc=']);
                });
            });

            describe("if the response code is in the error range", function() {
                it("should throw an error", function() {
                    im.api.http.fixtures.add({
                        request: {
                            method: 'GET',
                            url: 'http://foo.com/'
                        },
                        response: {
                            code: 404,
                            body: '404 Not Found'
                        }
                    });

                    var p = api.request("get", "http://foo.com/");
                    return p.catch(function(e) {
                        assert(e instanceof HttpResponseError);
                        assert.equal(e.response.code, 404);
                        assert.equal(e.response.body, '404 Not Found');
                    });
                });
            });

            describe("if the body cannot be parsed", function() {
                it("should throw an error", function() {
                    api.decode_response_body = function() {
                        throw Error("You shall not parse");
                    };

                    im.api.http.fixtures.add({
                        request: {
                            method: 'GET',
                            url: 'http://foo.com/'
                        },
                        response: {
                            code: 200,
                            body: '{"foo": "bar"}'
                        }
                    });

                    var p = api.request('get', 'http://foo.com/');
                    return p.catch(function(e) {
                        assert(e instanceof HttpResponseError);
                        assert.equal(e.reason, [
                            "Could not parse response",
                            "(Error: You shall not parse)"].join(' '));
                        assert.equal(e.response.code, 200);
                        assert.equal(e.response.body, '{"foo": "bar"}');
                    });
                });
            });

            describe("if the sandbox api replies with a failure", function() {
                beforeEach(function() {
                    im.api.request = function(cmd_name, cmd_data, reply) {
                        reply({
                            success: false,
                            reason: 'No apparent reason'
                        });
                    };
                });

                it("should throw an error", function() {
                    im.api.http.fixtures.add({
                        request: {
                            method: 'GET',
                            url: 'http://foo.com/'
                        },
                        response: {
                            code: 200,
                            body: '{"foo": "bar"}'
                        }
                    });

                    var p = api.request('get', 'http://foo.com/');
                    return p.catch(function(e) {
                        assert(e instanceof HttpRequestError);
                        assert.equal(e.reason, 'No apparent reason');
                        assert.equal(e.request.url, 'http://foo.com/');
                        assert.equal(e.request.method, 'GET');
                    });
                });
            });
        });
    });


    describe("JsonApi", function() {
        var im;
        var api;

        function make_api(opts) {
            return test_utils.make_im().then(function(new_im) {
                im = new_im;
                api = new JsonApi(im, opts);
                return api;
            });
        }

        beforeEach(function() {
            return make_api();
        });

        it("should decode JSON body response", function() {
            im.api.http.fixtures.add({
                request: {
                    method: 'GET',
                    url: 'http://foo.com/'
                },
                response: {
                    body: '{"foo": "bar"}'
                }
            });

            return api.request('get', 'http://foo.com/').then(function(response) {
                assert.deepEqual(response.data, {foo: 'bar'});
            });
        });

        it("should encode request data to JSON", function() {
            im.api.http.fixtures.add({
                request: {
                    url: 'http://foo.com/',
                    method: 'POST',
                    body: '{"lerp":"larp"}'
                }
            });

            return api.request("post", 'http://foo.com/', {
                data: {lerp: 'larp'},
            }).then(function(response) {
                assert.equal(response.request.body, '{"lerp":"larp"}');
            });
        });
    });
});
