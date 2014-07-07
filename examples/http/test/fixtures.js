// we make the fixtures function that simply returns the fixtures. This ensures
// we have a deep copy of all the fixtures.
module.exports = function() {
    return [
        {
        "request": {
            "method": "PUT",
            "url": "http://httpbin.org/put",
            "data": {
                "message": "hello world!"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "form": {},
                "headers": {
                    "Accept-Encoding": "gzip, deflate",
                    "Cookie": "",
                    "Content-Length": "26",
                    "Host": "httpbin.org",
                    "Connection": "close",
                    "Content-Type": "application/json",
                    "X-Request-Id": "4cd50631-7b53-4687-8f5f-df24cfd6ff84"
                },
                "files": {},
                "origin": "192.168.0.23",
                "url": "http://httpbin.org/put",
                "data": "{\"message\":\"hello world!\"}",
                "args": {},
                "json": {
                    "message": "hello world!"
                }
            }
        }
    },
    {
        "request": {
            "method": "POST",
            "url": "http://httpbin.org/post",
            "data": {
                "message": "hello world!"
            }
        },
        "response": {
            "code": 200,
            "data": {
                "data": "{\"message\":\"hello world!\"}",
                "form": {},
                "origin": "192.168.0.23",
                "url": "http://httpbin.org/post",
                "args": {},
                "files": {},
                "headers": {
                    "Content-Type": "application/json",
                    "Host": "httpbin.org",
                    "Cookie": "",
                    "X-Request-Id": "a3b50df8-d3d0-40cb-ab33-bcada3e7d012",
                    "Content-Length": "26",
                    "Accept-Encoding": "gzip, deflate",
                    "Connection": "close"
                },
                "json": {
                    "message": "hello world!"
                }
            }
        }
    },
    {
        "request": {
          "method": "GET",
          "url": "http://httpbin.org/status/418"
        },
        "response": {
          "code": 418,
          "data": {}
        }
    }
    ];
};
