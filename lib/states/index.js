// index.js
//  - State classes.

var state = require("./state.js");
var choices = require("./choice.js");
var freetext = require("./freetext.js");
var end = require("./end.js");


// exports

this.State = state.State;
this.StateError = state.StateError;
this.Choice = choices.Choice;
this.ChoiceState = choices.ChoiceState;
this.LanguageChoice = choices.LanguageChoice;
this.PaginatedChoiceState = choices.PaginatedChoiceState;
this.FreeText = freetext.FreeText;
this.EndState = end.EndState;
