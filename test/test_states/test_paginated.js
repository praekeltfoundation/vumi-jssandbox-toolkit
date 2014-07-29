var vumigo = require('../../lib');
var App = vumigo.App;
var AppTester = vumigo.AppTester;
var EndState = vumigo.states.EndState;
var PaginatedState = vumigo.states.PaginatedState;


describe("states.paginated", function() {
    describe("PaginatedState", function() {
        var tester;

        beforeEach(function () {
            var app = new App('states:test');

            app.states.add('states:test', function(name) {
                return new PaginatedState(name, tester.data.opts);
            });

            app.states.add('states:next', function(name) {
                return new EndState(name, {text: 'You are on the next state.'});
            });

            tester = new AppTester(app);
            tester.data.opts = {};
        });
    });
});
