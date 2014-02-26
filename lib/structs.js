var _ = require('lodash');

var utils = require("./utils");
var events = require('./events');
var Eventable = events.Eventable;


var Model = extend(Eventable, function(self, attrs) {
    /**class:Model(attrs)

    A structure holding attributes that can be validated and serialized.

    :param object attrs:
        the model's attributes

    Note that when extending :class:`Model`, ``self`` refers to the model's
    attributes, while ``self.cls`` refers to the actual model class's
    properties. Since ``self.cls`` is the prototype of ``self``, the class's
    properties are still accessible. This allows us to interact with the model
    attributes directly, while still having direct access to properties:

    .. code-block:: javascript
        var Thing = Model.extend(function(self, attrs) {
            Model.call(self);
            self.init(attrs);

            // a model attribute
            self.foo = 'bar';

            self.cls.baz = function() {
                return 'qux';
            };

            // actually on ``self.cls``, but directly accessible on ``self``
            self.validate();

            // also actually on ``self.cls``
            self.baz();
        });

    The same applies for the instance returned by the constructor:

    .. code-block:: javascript
        var model = new Model();
        model.foo = 'bar';
        model.validate();
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
        var context;

        // if this was a direct constructor call (not a ``Parent.call``), set
        // the constructor's context to a new object with ``this`` as its
        // prototype. The new context can be used as the model attributes,
        // while ``this`` can hold the class's properties and methods. This
        // allows the class properties to be directly accessible, while
        // ensuring the model attributes are its only enumerable properties.
        if (this.constructor === Surrogate) {
            var model = this;
            model.cls = model;
            model.attrs = _.create(model);
            context = model.attrs;
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
