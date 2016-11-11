Creating states
===============

States are the building blocks of sandbox applications. In this section we will learn how to create states using `CTA train tracker <https://github.com/praekelt/go-jsbox-http-request-example>`_ sandbox application.


Overview of States
------------------

The states that we used for this sandbox appication are:

- StartState
- ChoiceState
- MenuState
- EndState


StartState
----------

A state when the user starts a session on the USSD. The following is an example of a StartState:

::

	self.states.add('states:start', function(name) {
	    return new MenuState(name, {
	        question: 'Welcome to CTA train tracker.Pick a route:',

	        choices: [
	            new Choice('states:red', 'Red Line'),
	            new Choice('states:blue', 'Blue Line'),
	            new Choice('states:brown', 'Brown Line'),
	            new Choice('states:green', 'Green Line'),
	            new Choice('states:orange', 'Orange Line'),
	            new Choice('states:purple', 'Purple Line'),
	            new Choice('states:pink', 'Pink Line'),
	            new Choice('states:exit', 'Exit')]
	    });
	});

The example above also uses **ChoiceState** and **MenuState** which displays a list of numbered choices and allows a user to respond by selecting one of the choices. E.g Red line, Blue line, Brown line etc.

EndState
--------
This displays text and then terminates a session when the user is on the exit state. The following is an example of a EndState:

::

	self.states.add('states:exit', function(name, opts) {
	    var result = _.map(opts.echo.ctatt.route, function(route){
	        return 'There are ' + route.train.length + ' trains on the ' + route['@name'] + ' line.';
	    });
	    return new EndState(name, {
	        text: [
	            'Thanks for using CTA tran tracker.',
	            result.join(';')
	        ].join(' '),
	        next: 'states:start'
	    });
	});

Read more about States `here <http://vumi-jssandbox-toolkit.readthedocs.io/en/latest/states/index.html>`_.
