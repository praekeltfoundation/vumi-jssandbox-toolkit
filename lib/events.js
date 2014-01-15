var Q = require("q");
var util = require("util");
var events = require("events");

var utils = require("./utils");


var EventEmitter = events.EventEmitter;


function Event(name, data) {
    /**class:Event
    A structure for events fired in various parts of the tookit.

    :param string name: the event's name.
    :param string data: the event's data. Optional.
    */

    var self = this;

    self.name = name;
    utils.set_defaults(self, data || {});
}

function Eventable() {
    /**class:Event
    Lightweight wrapper around event emitter for working better with Q promises
    and the toolkit's :class:`Event` objects.
    */

    var self = this;
    EventEmitter.call(self);

    self.emit = function(event) {
        /**:Eventable.emit(event)
        Emits the given event and returns a promise that will be fulfilled once
        each listener is done. This allows listeners to return promises.

        :param Event event: the event to emit.
        */
        return Q.all(self.listeners(event.name).map(function(listener) {
            return listener(event);
        }));
    };
}
util.inherits(Eventable, EventEmitter);


this.Event = Event;
this.Eventable = Eventable;
