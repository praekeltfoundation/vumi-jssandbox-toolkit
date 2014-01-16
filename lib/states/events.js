function StateEvent(name, state, data) {
    /**:class.StateEvent(name, state, data)
    An event relating to a state.

    :param string name: the event type's name.
    :param State state: the state associated to the event.
    :param object data: additional event data.
    */
    var self = this;

    data = data || {};
    data.state = state;

    return new Event(name, data);
}

function StateInputEvent(state, content) {
    /**:class.StateInputEvent(content)
    Emitted when the user has given input to the state.
    
    :param State state: the state that the input was given to.
    :param string content: text from the user.

    The event type is ``state:input``.
    */
   return new Event('state:input', {
       state: state,
       content: content
   });
}

function StateEnterEvent(state) {
    /**:State.StateEnterEvent()
    Emitted when the state is entered by a user.

    The event type is ``state:enter``.

    :param State state: the state being entered.
    */
   return new Event('state:enter', {state: state});
}

function StateExitEvent(state) {
    /**:State.StateEnterEvent()
    Called when the state is exited by the user.

    The event type is ``state:exit``.

    :param State state: the state being exited.
    */
   return new Event('state:exit', {state: state});
}


this.StateEvent = StateEvent;
this.StateInputEvent = StateInputEvent;
this.StateEnterEvent = StateEnterEvent;
this.StateExitEvent = StateExitEvent;
