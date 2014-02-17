var utils = require("../utils");
var BaseError = utils.BaseError;


var DummyApiError = BaseError.extend(function(self, msg) {
    self.name = "DummyApiError";
    self.message = msg;
});


this.DummyApiError = DummyApiError;
