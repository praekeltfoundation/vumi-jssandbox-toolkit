Deploying to Vumi Go
====================

In this part of the tutorial, we will learn how to deploy our app to `Vumi Go <https://go.vumi.org>`_ using our sandbox skeleton app example.

**1. Set up a Vumi Go account**

You will need a Vumi Go account to deploy our sandbox skeleton app. If you already have a Vumi Go account please move on to Step 2.

- To set up a Vumi Go account please contact the vumi development team via email by joining the the `vumi-dev@googlegroups.com <https://groups.google.com/forum/?fromgroups#!forum/vumi-dev>`_ mailing list or on irc in #vumi on the `Freenode IRC network <https://webchat.freenode.net/?channels=#vumi>`_.

**2. Sign in Vumi Go**

To sign in to Vumi Go account, do the following:

- Go to https://go.vumi.org/accounts/login/?next=/conversations/
- Enter your email address and password
- Click Sign in

After you have signed in, your dashboard panel should look like this:

.. figure::  images/dashboard.png

**3. Create a new channel**

To create a new channel follow the following steps:

- Click new channel

.. figure::  images/new_channel.png

- Select a **destination** and a **channel** as is shown in the picture below. Click **save**.

.. figure::  images/save_new_channel.png

By clicking **save**, you will be taken to the page shown below where you will see your new generated **USSD** code. Click **dashboard**.

.. figure::  images/vumi_startcode.png

.. warning::

   Don't click the release button!

**4. Create new conversation**

To create a new conversation the steps are as follows:

- Click new conversation

.. figure::  images/conversation.png

- Enter a new **conversation name** and **conversation description** and then select a **kind of conversation** of your choice. Please see the picture below. Click **save**.

.. figure::  images/create_new_conversation.png

- Now copy the code in `go-app.js <https://github.com/praekelt/go-jsbox-skeleton/blob/develop/go-app.js>`_ file and paste it here:

.. figure::  images/save_conversation.png

After clicking **save**. You have successfully created a new conversation. Click **dashboard**.

.. figure::  images/conversation_created_successfully.png

**5. Campaign routing**

- Click campaign routing

.. figure::  images/campaign_routing.png

-  Under Channels you will see the channel you created, with a red "default" label. Click and drag on this label to join it with the similar label on the conversation you just created under Conversations. This will allow inbound messages on that channel to reach your conversation. Drag another arrow, this time from the conversation to the channel, this will allow replies from your conversation to reach the channel and be sent back to the user. Click **save**

.. figure::  images/campaign_routing_save.png

 Congratulations, you have successfully deployed your first app to Vumi Go! You can test it by dailing: ``*120*8864*163#``
