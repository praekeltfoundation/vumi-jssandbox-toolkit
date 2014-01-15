// index.js
//  - State classes.

var state = require("./state");
var booklet = require("./booklet");
var choices = require("./choices");
var freetext = require("./freetext");
var end = require("./end");


// exports

this.StateError = state.StateError;

this.StateSetupEvent = state.StateSetupEvent;
this.StateInputEvent = state.StateInputEvent;
this.StateEnterEvent = state.StateEnterEvent;
this.StateExitEvent = state.StateExitEvent;

this.State = state.State;
this.BookletState = booklet.BookletState;
this.Choice = choices.Choice;
this.ChoiceState = choices.ChoiceState;
this.LanguageChoice = choices.LanguageChoice;
this.PaginatedChoiceState = choices.PaginatedChoiceState;
this.FreeText = freetext.FreeText;
this.EndState = end.EndState;
