var Q = require('q');
var _ = require('lodash');

var events = require('events');
var EventEmitter = events.EventEmitter;

var utils = require('./utils');
var Extendable = utils.Extendable;


var Event = Extendable.extend(function(self, name, data) {
    /**class:Event

    A structure for events fired in various parts of the toolkit.

    :param string name: the event's name.
    :param string data: the event's data. Optional.
    */
    self.name = name;
    _.defaults(self, data || {});
});


var SetupEvent = Event.extend(function(self, instance) {
    /**class:SetupEvent(instance)

    Emitted when an instance of something has been constructed.

    :param object instance: the constructed instance.
    */
    Event.call(self, 'setup');
    self.instance = instance;
});


var TeardownEvent = Event.extend(function(self, instance) {
    /**class:TeardownEvent(instance)

    Emitted when an instance of something has completed the tasks it needs to
    complete before it can be safely disposed of.

    :param object instance: the instance.
    */
    Event.call(self, 'teardown');
    self.instance = instance;
});


var Eventable = utils.inherit(EventEmitter, function() {
    /**class:Event()

    Lightweight wrapper around :class:`EventEmitter` for working better with Q
    promises and the toolkit's :class:`Event` objects.
    */
    var self = this;
    EventEmitter.call(self);

    self.on = function(obj, listener) {
        return self._bind('on', obj, listener);
    };

    self.once = function(obj, listener) {
        return self._bind('once', obj, listener);
    };

    self._bind = function(method, obj, listener) {
        if (_.isString(obj)) {
            self._bind.each(method, obj, listener);
        } else {
            _.each(obj, function(listener, name) {
                self._bind.each(method, name, listener);
            });
        }

        return self;
    };

    self._bind.each = function(method, name, listener) {
        var target = self;
        var parts = name.split(' ');
        name = parts[0];

        if (parts[1]) {
            name = parts[1];

            target = parts[0].split('.').reduce(function(obj, prop_name) {
                return obj[prop_name];
            }, self);
        }

        EventEmitter.prototype[method].call(target, name, listener);
        return self;
    };

    self.once.resolved = function(event_name) {
        /**:Eventable.once.resolved(event_name)
        Returns a promise that will be fulfilled once the event has been
        emitted. Since a promise can only be fulfilled once, the event listener
        is removed after the event is emitted. Useful for testing events.

        :param string event_name: the event to listen for.
        */
        var d = Q.defer();
        self.once(event_name, d.resolve);
        return d.promise;
    };

    self.teardown_listeners = function() {
        /**:Eventable.teardown_listeners()

        Removes all event listeners, with the following exception: listeners
        for :class:`TeardownEvent`\s get rebound using :class:`Eventable.once`,
        regardless of whether they were orginally bound using
        :class:`Eventable.on` or :class:`Eventable.once`. This allows us to
        remove all event listeners for instances of :class:`Eventable`,
        while still allowing other entities to know when the teardown
        of the entity has completed.

        Not that it is up to the caller to emit the :class:`TeardownEvent`
        to clear the listeners.
        */
        var teardowns = self.listeners('teardown');
        self.removeAllListeners();
        teardowns.forEach(function(t) { self.once('teardown', t); });
    };

    self.emit = function(event) {
        /**:Eventable.emit(event)

        Emits the given event and returns a promise that will be fulfilled once
        each listener is done. This allows listeners to return promises.

        :param Event event: the event to emit.
        */
        return Q.all(self.listeners(event.name).map(function(listener) {
            return Q(listener.bind(self)).fcall(event);
        }));
    };

    self.emit.setup = function() {
        /**:Eventable.emit.setup()

        Shortcut for emitting a setup event for the instance (since this is done
        quite often). See :class:`SetupEvent`.
        */
        return self.emit(new SetupEvent(self));
    };

    self.emit.teardown = function() {
        /**:Eventable.emit.teardown()

        Shortcut for emitting a teardown event for the instance.
        See :class:`TeardownEvent`.
        */
        return self.emit(new TeardownEvent(self));
    };
});
Eventable.extend = Extendable.extend;


this.Event = Event;
this.SetupEvent = SetupEvent;
this.Eventable = Eventable;
