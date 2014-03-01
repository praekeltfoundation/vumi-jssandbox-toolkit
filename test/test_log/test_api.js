describe("log.api", function() {
    describe("Logger", function() {
        it("should log to the INFO log level if invoked directly");

        describe(".debug", function() {
            it("should log to the DEBUG log level");
        });

        describe(".info", function() {
            it("should log to the DEBUG log level");
        });

        describe(".warning", function() {
            it("should log to the WARNING log level");
        });

        describe(".error", function() {
            it("should log to the ERROR log level");
        });

        describe(".critical", function() {
            it("should log to the CRITICAL log level");
        });
    });
});
