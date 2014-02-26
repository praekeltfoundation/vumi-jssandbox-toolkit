var _ = require('lodash');

var events = require('./events');
var Eventable = events.Eventable;


var Model = Eventable.extend(function(self, attrs) {
    /**class:Model(attrs)
    A structure with attributes that can be validated and serialized.

    :param object attrs:
        the model's attributes
    */
    Eventable.call(self);

    self.init = function(attrs) {
        /**:Model.init(attrs)

        Initialises a model. If :class:`Model` is extended, it is the
        subclass's responsibility to invoke this method.

        :param object attrs:
            the model's attributes
        */
        self.reset(attrs);
    };

    self.reset = function(attrs) {
        /**:Model.reset(attrs)

        Resets a model's attributes, then re-validates the model. All of the
        model's current attributes will be cleared.

        :param object attrs:
            the model's new attributes
        */
        self.attrs = attrs || {};
        self.validate();
    };

    self.validate = function() {
        /**:Model.validate()

        Should be overriden and throw an error if the model has an invalid
        attribute. Invoked after resetting and before serializing a model.
        */
    };

    self.serialize = function() {
        /**:Model.serialize()

        Returns a deep copy of the of the model's attributes.
        */
        self.validate();
        return _.cloneDeep(self.attrs);
    };

    self.toJSON = self.serialize;

    if (self.constructor === Model) {
        self.init(attrs);
    }
});


this.Model = Model;
