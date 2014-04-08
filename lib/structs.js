var _ = require('lodash');
var util = require('util');

var utils = require('./utils');
var Extendable = utils.Extendable;
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

    self.do.parse = function(attrs) {
        /**:Model.do.parse(attrs)

        Parses attributes given to a model on a :meth:`Model.init` or
        :meth:`Model.reset`, before the attributes are set on the model and
        validated. By default, this is an identity function, and should be
        overriden if parsing is needed.

        :param object attrs:
            the model's attributes
        */
        return attrs;
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
        attrs = self.do.parse(attrs);
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


var Opts = Extendable.extend(function(self, items) {
    /**class:Opts([items])

    A structure for managing an object of options.

    :param object items:
        The initial options to use.
    */

    self.items = {};
    self.do = {};

    self.do.set = function(name, value) {
        /**:Opts.do.set(name, value)

        Sets the given option.

        :param string name:
            the name of the option to be set.
        :type value:
            Function or non-function
        :param value
            The value to set the option to. If a function is given, the
            function is invoked on retrieval.
        */
        if (!(name in self)) {
            throw new Error(util.format(
                "Cannot set '%s', option not supported", name));
        }

        self.items[name] = value;
        return self;
    };

    self.do.update = function(items) {
        /**:Opts.do.update(items)

        Updates the options from an options object.

        :param items:
            Pairs of name-value mappings for the options to be set
        */
        items = _.defaults(items || {}, self.constructor.defaults);

        _.each(items || {}, function(value, name) {
            self.do.set(name, value);
        });

        return self;
    };

    self.do.get = function(name) {
        /**:Opts.do.get(name[, arg1[, arg2[, ...]]])

        Gets the given option's value.

        :param string name:
            The name of the option to get.
        :params arguments arg1, arg2, ...
            arguments to invoke the option with (for cases where the option was
            set using a function).
        */
        if (!(name in self)) {
            throw new Error(util.format(
                "Cannot get '%s', option not supported", name));
        }

        var args = Array.prototype.slice.call(arguments, 1);
        return utils.maybe_call(self.items[name], self, args);
    };

    self.do.update(items);
});


Opts.support = function(name, opts) {
    /**Opts.support(name[, opts])

    Adds support for the given option.

    :param string name:
        The name of the option to support.
    :param object opts.default:
        The default value to use for the option.
    */
    opts = opts || {};

    if (opts.default) {
        this.defaults[name] = opts.default;
    }

    this.prototype[name] = function() {
        Array.prototype.unshift.call(arguments, name);

        return arguments.length > 1
            ? this.do.set.apply(this, arguments)
            : this.do.get.apply(this, arguments);
    };

    return this;
};


Opts.extend = function() {
    var Child = Extendable.extend.apply(this, arguments);
    Child.defaults = _.clone(this.defaults || {});
    return Child;
};


this.Opts = Opts;
this.Model = Model;
this.ValidationError = ValidationError;
