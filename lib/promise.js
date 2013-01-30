// promise.js
//  - Simple promises implementation.


function PromiseError(msg) {
    var self = this;
    self.msg = msg;

    self.toString = function() {
        return "<PromiseError: " + self.msg + ">";
    };
}


function maybe_promise(result) {
    if (result && result.is_promise) {
        return result;
    }
    var p = new Promise();
    p.callback(result);
    return p;
}


function success(result) {
    var p = new Promise();
    p.callback(result);
    return p;
}


var _PAUSED = {};


function Promise() {
    var self = this;
    self.is_promise = true;
    self.fired = false;
    self.firing = false;
    self.result = null;
    self.callback_chain = [];

    self.callback = function(result) {
        if (self.fired) {
            throw new PromiseError("Promise already fired.");
        }
        else {
            self.run_remaining_callbacks(result);
        }
    };

    self.run_remaining_callbacks = function(result) {
        self.firing = true;
        self.result = result;
        var cb;
        while (self.callback_chain.length) {
            cb = self.callback_chain.shift();
            result = cb(self.result);
            if (result === _PAUSED) {
                return _PAUSED;
            }
            else if (result && result.is_promise) {
                if (result.fired) {
                    self.result = result.result;
                }
                else {
                    result.add_callback(self.run_remaining_callbacks);
                    return _PAUSED;
                }
            }
            else {
                self.result = result;
            }
        }
        self.fired = true;
        return self.result;
    };

    self.add_callback = function(f) {
        self.callback_chain.push(f);
        if (self.fired) {
            self.fired = false;
            self.run_remaining_callbacks(self.result);
        }
    };

    self.chain = function(p) {
        self.add_callback(p.callback);
    };
}


// exports

this.Promise = Promise;
this.PromiseError = PromiseError;
this.success = success;
this.maybe_promise = maybe_promise;
