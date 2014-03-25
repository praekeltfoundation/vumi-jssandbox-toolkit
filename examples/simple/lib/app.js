var vumigo = require('../../../lib');

var App = vumigo.App;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.InteractionMachine;


// `App` is the base class that needs to be extended and given app-specific
// logic by adding the different states that the user will visit.
var SimpleApp = App.extend(function(self) {
    // Set the app up to start at the state with the name 'states:start'
    App.call(self, 'states:start');

    // Add the start state. We create a `ChoiceState`, which asks the user a
    // question, along with a list of choices they can choose from. We then
    // determine which state to go to next based on their choice.
    self.states.add('states:start', function(name) {
        return new ChoiceState(name, {
            question: 'Tea or coffee?',

            choices: [
                new Choice('tea', 'Tea'),
                new Choice('coffee', 'Coffee')],

            next: function(choice) {
                return {
                    tea: 'states:tea',
                    coffee: 'states:coffee'
                }[choice.value];
            }
        });
    });

    // Add the state reached when the user chooses 'tea' in the start state. We
    // create an `EndState`, which shows the user some text, then ends the
    // session. We then tell the state to go to the start state when the user
    // starts a new session.
    self.states.add('states:tea', function(name) {
        return new EndState(name, {
            text: 'Meh. Bye.',
            next: 'states:start'
        });
    });

    // Add the state reached when the user chooses 'coffee' in the start state.
    // We again create an `EndState`, showing the user some text and ending the
    // session. Again, we then tell the state to go to the start state when the
    // user starts a new session.
    self.states.add('states:coffee', function(name) {
        return new EndState(name, {
            text: 'Cool :) Bye.',
            next: 'states:start'
        });
    });
});


// if we have the real api, this is not a test, start the interaction machine
if (typeof api != 'undefined') {
    new InteractionMachine(api, new SimpleApp());
}


// export the app so we can require it in our tests
this.SimpleApp = SimpleApp;
