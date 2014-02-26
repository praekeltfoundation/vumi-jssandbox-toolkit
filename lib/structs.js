var _ = require('lodash');

var events = require('./events');
var Eventable = events.Eventable;


var Model = Eventable.extend(function(self, attrs) {
    Eventable.call(self);

    self.init = function(attrs) {
        self.reset(attrs);
    };

    self.reset = function(attrs) {
        self.attrs = attrs || {};
        self.validate();
    };

    self.validate = function() {
    };

    self.serialize = function() {
        self.validate();
        return _.cloneDeep(self.attrs);
    };

    self.toJSON = self.serialize;

    if (self.constructor === Model) {
        self.init(attrs);
    }
});


this.Model = Model;
