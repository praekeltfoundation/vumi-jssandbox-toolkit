var _ = require('lodash');

var utils = require("./utils");
var events = require('./events');
var Eventable = events.Eventable;


var Model = extend(Eventable, function(self, attrs) {
    /**class:Model(attrs)
    A structure holding attributes that can be validated and serialized.

    :param object attrs:
        the model's attributes
    */
    Eventable.call(self.cls);

    /**attribute:Model.cls
    Holds a model class's properties and methods. Anything that isn't a model
    attribute should be put here.
    */
    self.cls;

    /**attribute:Model.defaults
    Default attributes used when resetting or initialising a model.
    */
    self.cls.defaults = {};

    self.cls.init = function(attrs) {
        /**:Model.init(attrs)

        Initialises a model. If :class:`Model` is extended, it is the
        subclass's responsibility to invoke this method.

        :param object attrs:
            the model's attributes
        */
        self.reset(attrs);
    };

    self.cls.clear = function() {
        /**:Model.reset(attrs)

        Clears all of the model's current attributes.

        :param object attrs:
            the model's new attributes
        */
        _(self).keys().each(function(name) {
            delete self[name];
        });
    };

    self.cls.reset = function(attrs) {
        /**:Model.reset(attrs)

        Resets a model's attributes, then re-validates the model. All of the
        model's current attributes will be cleared.

        :param object attrs:
            the model's new attributes
        */
        self.clear();
        _.defaults(self, self.defaults);
        _.assign(self, attrs);
        self.validate();
    };

    self.cls.validate = function() {
        /**:Model.validate()

        Should be overriden and throw an error if the model has an invalid
        attribute. Invoked after resetting and before serializing a model.
        */
    };

    self.cls.serialize = function() {
        /**:Model.serialize()

        Returns a deep copy of the of the model's attributes.
        */
        self.validate();
        return _.cloneDeep(self);
    };

    self.cls.toJSON = self.serialize;

    if (self.cls.constructor === Model) {
        self.init(attrs);
    }
});

function extend(Parent, Child) {
    var Surrogate = function() {
        // Use black magic to make the model's enumerable properties its
        // attributes, but still allowing the model's 'class' properties to be
        // directly accessible by making the class properties the prototype of
        // the attributes object
        var model = this;
        model.cls = model;
        model.attrs = _.create(model);

        Array.prototype.unshift.call(arguments, model.attrs);
        Child.apply(model.attrs, arguments);
        return model.attrs;
    };

    return utils.inherit(Parent, Surrogate);
}

Model.extend = function(Child) {
    return extend(this, Child);
};


this.Model = Model;
