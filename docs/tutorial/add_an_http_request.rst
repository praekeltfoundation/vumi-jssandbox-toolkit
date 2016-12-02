Add an HTTP request
===================

In this section we will show you how to add an http request to your sandbox application.

As an example, we are going to preform a GET request to `CTA train tracker <http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?key=33305d8dcece4aa58c651c740f88d1e2&rt=red&outputType=JSON>`_. which returns a total number of in-service trains for Red line route.

::

	self.states.add('states:red', function(name) {
	    return self
	        .http.get(
	            'http://lapi.transitchicago.com/api/1.0/ttpositions.aspx?', {
	            params: {rt: 'red', key: '33305d8dcece4aa58c651c740f88d1e2', outputType: 'JSON'}
	        })
	        .then(function(resp) {
	            return self.states.create('states:exit', { echo: resp.data});
	        });
	});

The HTTP request is made to that URL, with the parameters key, train route and the output type as Json. Once you've made the request to that URL, The **.then()** function will create the exit state and returns the results.

Read more about HTTP API `here <http://vumi-jssandbox-toolkit.readthedocs.io/en/latest/http_api.html>`_.
