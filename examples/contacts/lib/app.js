var vumigo = require('../../../lib');

var App = vumigo.App;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.InteractionMachine;


var ContactsApp = App.extend(function(self) {
    App.call(self, 'states:start');

    self.init = function() {
        // Fetch the contact from the contact store that matches the current
        // user's address. When we get the contact, we put the contact on the
        // app so we can reference it easily when creating each state.
        return self.im
            .contacts.for_user()
            .then(function(user_contact) {
                self.contact = user_contact;
            });
    };

    self.states.add('states:start', function(name) {
        // 'states:start' is a 'delegate' state. We don't actually create any
        // state here, instead we delegate to other state creators. If the user
        // is registered, we create the 'states:registered' state. If they are
        // not registered, we create the 'states:registration:name' state.
        return self.contact.extra.registered === 'true'
            ?  self.states.create('states:registered')
            :  self.states.create('states:registration:name');
    });
    
    self.states.add('states:registered', function(name) {
        // Since the contact is registered, we have their information that we
        // want to display. The contact `name` is a standard contact field so
        // we can access it via `contact.name`. The beverage field is an
        // 'extra', since it is specific to this app, so we take it from
        // `contact.extra.beverage`.
        return new EndState(name, {
            text: [
                "Hello " + self.contact.name + ".",
                "I hear you like " + self.contact.extra.beverage + ".",
                "That's nice. Bye."
            ].join(' ')
        });
    });

    self.states.add('states:registration:name', function(name) {
        // Here, we ask the user for their name. Once they have given us their
        // name, we can set it on the contact. It is important to note that we
        // need to save the contact to the contact store before carrying on,
        // otherwise this information will be lost when the sandbox shuts down
        // after switching to the next state. Once we have saved the contact,
        // we tell the interaction machine to go to the
        // 'states:registration:beverage' state next.
        return new FreeText(name, {
            question: 'What is your name?',

            next: function(content) {
                self.contact.name = content;

                return self.im
                    .contacts.save(self.contact)
                    .then(function() {
                        return 'states:registration:beverage';
                    });
            }
        });
    });

    self.states.add('states:registration:beverage', function(name) {
        // Here, we ask the user if they like tea or coffee. Once they have
        // made a choice, we save their choice under `contact.extra.beverage`.
        // Since this is an app-specific field (as opposed to `contact.name`,
        // which is a standard field), we store this as a contact extra.
        // Since is the last registration state, we mark this contact as
        // registered.
        return new ChoiceState(name, {
            question: 'Do you like tea or coffee?',

            choices: [
                new Choice('tea', 'Tea'),
                new Choice('coffee', 'Coffee')],

            next: function(choice) {
                self.contact.extra.registered = 'true';
                self.contact.extra.beverage = choice.value;

                return self.im
                    .contacts.save(self.contact)
                    .then(function() {
                        return 'states:registered';
                    });
            }
        });
    });
});


if (typeof api != 'undefined') {
    new InteractionMachine(api, new ContactsApp());
}


this.ContactsApp = ContactsApp;
