var Q = require("q");

var events = require("events");
var EventEmitter = events.EventEmitter;

var utils = require("./utils");
var Extendable = utils.Extendable;


var Event = Extendable.extend(function(self, name, data) {
    /**class:Event

    A structure for events fired in various parts of the tookit.

    :param string name: the event's name.
    :param string data: the event's data. Optional.
    */
    self.name = name;
    utils.set_defaults(self, data || {});
});

var SetupEvent = Event.extend(function(self, instance) {
    /**class:SetupEvent(instance)

    Emitted when an instance of something has been constructed.

    :param object instance: the constructed instance.
    */
    Event.call(self, 'setup');
    self.instance = instance;
});

var Eventable = utils.inherit(EventEmitter, function() {
    /**class:Event()

    Lightweight wrapper around :class:`EventEmitter` for working better with Q
    promises and the toolkit's :class:`Event` objects.
    */
    var self = this;
    EventEmitter.call(self);

    self.once = function() {
        EventEmitter.prototype.once.apply(self, arguments);
        return self;
    };

    self.once.resolved = function(event_name) {
        /**:Event.once.resolved(event_name)
        Returns a promise that will be fulfilled once the event has been
        emitted. Since a promise can only be fulfilled once, the event listener
        is removed after the event is emitted. Useful for testing events.

        :param string event_name: the event to listen for.
        */
        var d = Q.defer();
        self.once(event_name, d.resolve);
        return d.promise;
    };

    self.emit = function(event) {
        /**:Eventable.emit(event)

        Emits the given event and returns a promise that will be fulfilled once
        each listener is done. This allows listeners to return promises.

        :param Event event: the event to emit.
        */
        return Q.all(self.listeners(event.name).map(function(listener) {
            return listener.call(self, event);
        })).thenResolve(self);
    };

    self.emit.setup = function() {
        /**:Event.emit.setup()

        Shortcut for emitting a setup event for the instance (since this is done
        quite often). See :class:`SetupEvent`.
        */
        return self.emit(new SetupEvent(self));
    };
});
Eventable.extend = Extendable.extend;


this.Event = Event;
this.SetupEvent = SetupEvent;
this.Eventable = Eventable;
