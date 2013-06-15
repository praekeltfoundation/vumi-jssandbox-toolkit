// index.js
//  - State classes.

var state = require("./state.js");
var booklet = require("./booklet.js");
var choices = require("./choices.js");
var freetext = require("./freetext.js");
var end = require("./end.js");


// exports

this.State = state.State;
this.StateError = state.StateError;
this.BookletState = booklet.BookletState;
this.Choice = choices.Choice;
this.ChoiceState = choices.ChoiceState;
this.LanguageChoice = choices.LanguageChoice;
this.PaginatedChoiceState = choices.PaginatedChoiceState;
this.FreeText = freetext.FreeText;
this.EndState = end.EndState;
