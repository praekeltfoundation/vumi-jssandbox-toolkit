var _ = require('lodash');

var utils = require('./utils');
var BaseError = utils.BaseError;

var events = require('./events');
var Eventable = events.Eventable;


var ValidationError = BaseError.extend(function(self, model, message) {
    /**class:ValidationError(model, message)

    Thrown when validating a model fails.

    :param Model model: the model that associated to the error.
    :param string message: the reason for the error.
    */
    self.name = "ValidationError";
    self.model = model;
    self.message = message;
});


var Model = extend(Eventable, function(self, attrs) {
    /**class:Model(attrs)

    A structure holding attributes that can be validated and serialized.

    :param object attrs:
        the model's attributes

    Note that when extending :class:`Model`, ``self`` refers to the model's
    attributes, while ``self.cls`` refers to the model class's properties and
    methods.
    */
    Eventable.call(self.cls);

    /**attribute:Model.cls
    Holds a model's class properties, for (eg, defaults). Anything that is not
    an attribute should stored on it. Aliased to ``do`` for better readability
    for methods.
    */
    self.cls;

    /**attribute:Model.defaults
    Default attributes used when resetting or initialising a model.
    */
    self.cls.defaults = {};

    self.do.init = function(attrs) {
        /**:Model.do.init(attrs)

        Initialises a model. If :class:`Model` is extended, it is the
        subclass's responsibility to invoke this method.

        :param object attrs:
            the model's attributes
        */
        self.do.reset(attrs);
    };

    self.do.clear = function() {
        /**:Model.do.reset(attrs)

        Clears all of the model's current attributes.

        :param object attrs:
            the model's new attributes
        */
        _(self).keys().each(function(name) {
            delete self[name];
        });
    };

    self.do.reset = function(attrs) {
        /**:Model.do.reset(attrs)

        Resets a model's attributes, then re-validates the model. All of the
        model's current attributes will be cleared.

        :param object attrs:
            the model's new attributes
        */
        self.do.clear();
        _.assign(self, self.cls.defaults, attrs);
        self.do.validate();
    };

    self.do.validate = function() {
        /**:Model.do.validate()

        Should be overriden and throw an error if the model has an invalid
        attribute. Invoked after resetting and before serializing a model.
        */
    };

    self.do.serialize = function() {
        /**:Model.do.serialize()

        Returns a deep copy of the of the model's attributes.
        */
        self.do.validate();
        return _.cloneDeep(self);
    };

    if (self.constructor === Model) {
        self.do.init(attrs);
    }
});


function extend(Parent, Child) {
    var Surrogate = function() {
        var context;

        if (this.constructor === Surrogate) {
            this.attrs = _.create(this);
            this.cls = this.do = _.create(this, {model: this});
            context = this.attrs;
        } else {
            context = this;
        }

        Array.prototype.unshift.call(arguments, context);
        Child.apply(context, arguments);
        return context;
    };

    return utils.inherit(Parent, Surrogate);
}


Model.extend = function(Child) {
    return extend(this, Child);
};


this.Model = Model;
this.ValidationError = ValidationError;
