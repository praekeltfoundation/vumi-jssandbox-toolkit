describe("Contact", function() {
    describe(".validate", function() {
        it("should throw an error for non-string groups");
        it("should throw an error for non-string extras");
        it("should throw an error for null or undefined fields");
    });

    describe(".serialize", function() {
        it("should validate the contact");
        it("should serialize the contact");
    });
});
