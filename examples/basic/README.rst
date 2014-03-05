Basic App
=========

A simple app with three states. The start state is a ChoiceState, and asks the
user if they would like tea or coffee. Based on their response, the user is
sent to either the tea state or the coffee state. The tea and coffee states are
both EndStates, so they show the user some text, then end the session.
