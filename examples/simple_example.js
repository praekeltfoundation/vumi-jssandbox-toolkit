/*
   Simple Javascript sandbox application that echoes messages sent to it.

   The `api` variable is supplied by the sandbox. The basic API commands
   are:

   api.done()
     Terminates the sandbox.

   api.log_info(text)
     Logs a message to outside the sandbox.

   api.request(cmd_name, extra_cmd_args, done)
     Asynchronously make a request to a command provided by a sandbox
     resource.

     * `cmd_name`: the name of the command, typically
                   `<resource_name>.<resource_command_name>`.
     * `extra_cmd_args`: determined by the command.
     * `done`: f(response) called once the request completes.

   Commonly available resource commands:

   * outbound.reply_to: Send a reply to a user message.
   * kv.get: Retrieve a value from the key-value resource.
   * kv.set: Store a value in the key-value resource.
   * config.get: Retreive a value from a Go conversation's configuration.
   * http.get: Make a get request via HTTP.
   * http.post: Make a post request via HTTP.
*/

// testing hook that supplies the api when it is not passed in by the real
// sandbox (not needed in really applications but fine to leave in).
if (typeof api === "undefined") {
    var dummy_api = require("../lib/dummy_api");
    var api = this.api = new dummy_api.DummyApi();
}

// handles inbound user messages
api.on_inbound_message = function (cmd) {
    var msg = cmd.msg;
    api.request("outbound.reply_to", {
        content: "Echoing: " + msg.content,
        in_reply_to: msg.message_id,
        continue_session: true,
    }, function (response) {
        // do nothing with response
    });
    api.done();
}

// handles inbound events (acks, delivery reports, etc)
api.on_inbound_event = function (cmd) {
    var event = cmd.msg;
    api.done();
}

// handles unknown commands
api.on_unknown_command = function (cmd) {
    api.log_info("Received unknown command: " + JSON.stringify(cmd));
    api.done();
}