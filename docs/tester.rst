AppTester
=========


API
---

.. autojs:: ../lib/tester/tester.js

Setup Tasks
~~~~~~~~~~~

Setup tasks are used to configure the sandbox app's config and store data before any interaction and checking is done.

.. autojs:: ../lib/tester/setups.js

Interaction Tasks
~~~~~~~~~~~~~~~~~

Interaction tasks are used to simulate interaction with the sandbox. *Input*
interactions are the most common, where the sandbox receives a message sent in
by a user.

.. autojs:: ../lib/tester/interactions.js

Checking Tasks
~~~~~~~~~~~~~~

Checking tasks are used to check the state of the sandbox application and its
currently associated user (the user which sent in a message to the sandbox
application). The check tasks are where the test assertions happen.

.. autojs:: ../lib/tester/checks.js


Under the Hood
--------------

If need be, one can always add custom task types. AppTester's *setup*,
*interaction* and *check* tasks all extend the same class,
:class:`AppTesterTasks`.

.. autojs:: ../lib/tester/tasks.js
