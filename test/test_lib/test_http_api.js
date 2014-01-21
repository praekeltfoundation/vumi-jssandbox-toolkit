var assert = require("assert");

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var http_api = vumigo.http_api;
var HttpApi = http_api.HttpApi;
var JsonApi = http_api.JsonApi;
var HttpApiError = http_api.HttpApiError;

var BadToyApi = HttpApi.extend(function(self, im, opts) {
    HttpApi.call(self, im, opts);

    self.decode_response_body = function(body) {
      throw Error("You shall not parse");
    };
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

    beforeEach(function(done) {
        make_api().nodeify(done);
    });

    describe(".get", function() {
        it("should perform GET requests", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'GET',
                    url: 'http://foo.com/',
                },
                response: {
                    body: '{"foo": "bar"}'
                }
            });

            api.get('http://foo.com/').then(function(data) {
                assert.equal(data, '{"foo": "bar"}');
            }).nodeify(done);
        });
    });

    describe(".head", function() {
        it("should perform HEAD requests", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'HEAD',
                    url: 'http://foo.com/',
                }
            });

            api.head('http://foo.com/').then(function(data) {
                assert.strictEqual(data, null);
            }).nodeify(done);
        });
    });

    describe(".post", function() {
        it("should perform POST requests", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'POST',
                    url: 'http://foo.com/',
                    content_type: 'application/json',
                    body: '{"lerp": "larp"}',
                },
                response: {
                    body: '{"foo": "bar"}'
                }
            });

            api.post('http://foo.com/', {
                data: '{"lerp": "larp"}',
                headers: {'Content-Type': ['application/json']}
            }).then(function(data) {
                assert.strictEqual(data, '{"foo": "bar"}');
            }).nodeify(done);
        });
    });

    describe(".put", function() {
        it("should perform PUT requests", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'PUT',
                    url: 'http://foo.com/',
                    body: '{"lerp": "larp"}',
                    content_type: 'application/json',
                },
                response: {
                    body: '{"foo": "bar"}'
                }
            });

            api.put('http://foo.com/', {
                data: '{"lerp": "larp"}',
                headers: {'Content-Type': ['application/json']}
            }).then(function(data) {
                assert.strictEqual(data, '{"foo": "bar"}');
            }).nodeify(done);
        });
    });

    describe(".delete", function() {
        it("should perform DELETE requests", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'DELETE',
                    url: 'http://foo.com/',
                    content_type: 'application/json',
                    body: '{"lerp": "larp"}',
                },
                response: {
                    body: '{"foo": "bar"}'
                }
            });

            api.delete('http://foo.com/', {
                data: '{"lerp": "larp"}',
                headers: {'Content-Type': ['application/json']}
            }).then(function(data) {
                assert.strictEqual(data, '{"foo": "bar"}');
            }).nodeify(done);
        });
    });

    describe(".request", function() {
        it("should accept responses in the 200 range", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'GET',
                    url: 'http://foo.com/'
                },
                response: {
                    code: 201,
                    body: '201 Created'
                }
            });

            api.request('get', 'http://foo.com/').then(function(data) {
                assert.equal(data, '201 Created');
            }).nodeify(done);
        });

        it("should support request body data", function(done) {
            im.api.add_http_fixture({
                request: {
                    url: 'http://foo.com/',
                    method: 'POST',
                    body: 'ping'
                }
            });

            api.request("post", 'http://foo.com/', {
                data: 'ping',
            }).then(function() {
                var request = im.api.http_requests[0];
                assert.equal(request.body, 'ping');
            }).nodeify(done);
        });

        it("should support request url params", function(done) {
            im.api.add_http_fixture({
                request: {
                    method: 'GET',
                    url: 'http://foo.com/?a=1&b=2',
                }
            });

            api.get('http://foo.com/', {
                params: {
                    a: 1,
                    b: 2
                }
            }).then(function(data) {
                var request = im.api.http_requests[0];
                assert.equal(request.url, 'http://foo.com/?a=1&b=2');
            }).nodeify(done);
        });

        it("should support basic auth", function(done) {
            make_api({
                auth: {
                    username: 'me',
                    password: 'pw'
                }
            }).then(function() {
                im.api.add_http_fixture({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/',
                    }
                });

                return api.get('http://foo.com/');
            }).then(function() {
                var request = im.api.http_requests[0];
                assert.deepEqual(
                    request.headers.Authorization,
                    ['Basic bWU6cHc=']);
            }).nodeify(done);
        });

        describe("if the response code is in the error range", function() {
            it("should throw an error", function(done) {
                im.api.add_http_fixture({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/'
                    },
                    response: {
                        code: 404,
                        body: '404 Not Found'
                    }
                });

                api.request("get", "http://foo.com/").catch(function(e) {
                    assert(e instanceof HttpApiError);
                    assert.equal(e.message, [
                        'HTTP API GET to http://foo.com/ failed:',
                        '404 Not Found [Response Body: 404 Not Found]'
                    ].join(" "));
                }).nodeify(done);
            });
        });

        describe("if the body cannot be parsed", function() {
            beforeEach(function() {
                api.decode_response_body = function() {
                    throw Error("You shall not parse");
                };
            });

            it("should throw an error", function(done) {
                im.api.add_http_fixture({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/'
                    },
                    response: {
                        code: 200,
                        body: '{"foo": "bar"}'
                    }
                });

                api.request('get', 'http://foo.com/').catch(function(e) {
                    assert(e instanceof HttpApiError);
                    assert.equal(e.message, [
                        'HTTP API GET to http://foo.com/ failed:',
                        'Could not parse response',
                        '(Error: You shall not parse)',
                        '[Response Body: {"foo": "bar"}]'
                    ].join(" "));
                }).nodeify(done);
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

            it("should throw an error", function(done) {
                im.api.add_http_fixture({
                    request: {
                        method: 'GET',
                        url: 'http://foo.com/'
                    },
                    response: {
                        code: 200,
                        body: '{"foo": "bar"}'
                    }
                });

                api.request('get', 'http://foo.com/').catch(function(e) {
                    assert(e instanceof HttpApiError);
                    assert.equal(e.message, [
                        'HTTP API GET to http://foo.com/ failed:',
                        'No apparent reason'
                    ].join(" "));
                }).nodeify(done);
            });
        });
    });
});


describe("JsonApi", function() {
    function make_api(opts) {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;
            api = new JsonApi(im, opts);
            return api;
        });
    }

    beforeEach(function(done) {
        make_api().nodeify(done);
    });

    it("should decode JSON body response", function(done) {
        im.api.add_http_fixture({
            request: {
                method: 'GET',
                url: 'http://foo.com/',
                content_type: 'application/json; charset=utf-8'
            },
            response: {
                body: '{"foo": "bar"}'
            }
        });

        api.request('get', 'http://foo.com/').then(function(data) {
            assert.deepEqual(data, {foo: 'bar'});
        }).nodeify(done);
    });

    it("should encode request data to JSON", function(done) {
        im.api.add_http_fixture({
            request: {
                url: 'http://foo.com/',
                method: 'POST',
                body: '{"lerp": "larp"}',
                content_type: 'application/json; charset=utf-8'
            }
        });

        api.request("post", 'http://foo.com/', {
            data: {lerp: 'larp'},
        }).then(function() {
            var request = im.api.http_requests[0];
            assert.equal(request.body, '{"lerp":"larp"}');
        }).nodeify(done);
    });
});
