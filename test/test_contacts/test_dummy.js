describe("DummyContactsResource", function() {
    describe(".add", function() {
        describe(".add(contact)", function() {
            it("should add the contact to the store");
        });

        describe(".add(data)", function() {
            it("should add a corresponding contact to the store");
        });
    });

    describe(".handlers", function() {
        describe(".get", function() {
            it("retrieve the contact if it exists");
            it("should fail if no contact is found");
        });

        describe(".get_or_create", function() {
            it("retrieve the contact if it exists");
            it("should create a new contact if it does not yet exist");
        });

        describe(".new", function() {
            it("should create a new contact");
        });

        describe(".save", function() {
            it("should save the contact if it exists");
            it("should fail if the contact does not exist");
        });
    });
});
