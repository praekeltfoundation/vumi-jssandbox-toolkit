var vumigo = require('vumigo_v02');

var App = vumigo.App;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.InteractionMachine;


var ContactsApp = App.extend(function(self) {
    App.call(self, 'states:start');

    self.init = function() {
        return self.im
            .contacts.for_user()
            .then(function(user_contact) {
                self.contact = user_contact;
            });
    };

    self.states.add('states:start', function(name) {
        if (self.contact.extra.registered === 'true') {
            return self.states.create('states:registered');
        }
        else {
            return self.states.create('states:registration:name');
        }
    });
    
    self.states.add('states:registered', function(name) {
        return new EndState(name, {
            text: [
                "Hello " + self.contact.name + ".",
                "I hear you like " + self.contact.extra.beverage + ".",
                "That's nice. Bye."
            ].join(' ')
        });
    });

    self.states.add('states:registration:name', function(name) {
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
