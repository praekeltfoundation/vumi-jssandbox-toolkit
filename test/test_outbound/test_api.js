var assert = require('assert');

var vumigo = require("../../lib");
var test_utils = vumigo.test_utils;
var OutboundHelper = vumigo.outbound.api.OutboundHelper;


describe("outbound.api", function() {
    var im;

    beforeEach(function() {
        return test_utils.make_im().then(function(new_im) {
            im = new_im;
        });
    });

    describe("OutboundHelper", function() {
        describe(".setup", function() {
            it("should emit a 'setup' event", function() {
                var outbound = new OutboundHelper(im);
                var p = outbound.once.resolved('setup');

                return outbound.setup().then(function() {
                    assert(p.isFulfilled());
                });
            });
        });

        describe(".send", function() {
            describe("when an address is given", function() {
                it("should send to the address", function() {
                    return im
                        .outbound.send({
                            to: '+273123',
                            endpoint: 'sms',
                            content: 'hello!'
                        })
                        .then(function() {
                            var sends = im.api.outbound.store;
                            assert.equal(sends.length, 1);
                            assert.deepEqual(sends[0], {
                                to_addr: '+273123',
                                content: 'hello!',
                                endpoint: 'sms'
                            });
                        });
                });
            });

            describe("when a contact is given", function() {
                it("should send to the contact", function() {
                    return im
                        .contacts.create({msisdn: '+273123'})
                        .then(function(contact) {
                            return im.outbound.send({
                                to: contact,
                                content: 'hello!',
                                endpoint: 'sms',
                                delivery_class: 'sms'
                            });
                        })
                        .then(function() {
                            var sends = im.api.outbound.store;
                            assert.equal(sends.length, 1);
                            assert.deepEqual(sends[0], {
                                to_addr: '+273123',
                                content: 'hello!',
                                endpoint: 'sms'
                            });
                        });
                });

                it("should fall back to the endpoint's delivery class",
                function() {
                    var outbound = new OutboundHelper(im);

                    return outbound
                        .setup({
                            endpoints: {
                                'twitter_endpoint': {delivery_class: 'twitter'}
                            }
                        })
                        .then(function() {
                            return im
                                .contacts.create({twitter_handle: '@foo'})
                                .then(function(contact) {
                                    return outbound.send({
                                        to: contact,
                                        content: 'hello!',
                                        endpoint: 'twitter_endpoint'
                                    });
                                })
                                .then(function() {
                                    var sends = im.api.outbound.store;
                                    assert.equal(sends.length, 1);
                                    assert.deepEqual(sends[0], {
                                        to_addr: '@foo',
                                        content: 'hello!',
                                        endpoint: 'twitter_endpoint'
                                    });
                                });
                    });
                });

                it("should finally fall back to the helper's delivery class",
                function() {
                    var outbound = new OutboundHelper(im);

                    return outbound
                        .setup({delivery_class: 'twitter'})
                        .then(function() {
                            return im
                                .contacts.create({twitter_handle: '@foo'})
                                .then(function(contact) {
                                    return outbound.send({
                                        to: contact,
                                        content: 'hello!',
                                        endpoint: 'twitter_endpoint'
                                    });
                                })
                                .then(function() {
                                    var sends = im.api.outbound.store;
                                    assert.equal(sends.length, 1);
                                    assert.deepEqual(sends[0], {
                                        to_addr: '@foo',
                                        content: 'hello!',
                                        endpoint: 'twitter_endpoint'
                                    });
                                });
                    });
                });
            });
        });

        describe(".send_to_user", function() {
            it("should send to the user", function() {
                return im
                    .outbound.send_to_user({
                        endpoint: 'sms',
                        content: 'hello!'
                    })
                    .then(function() {
                        var sends = im.api.outbound.store;
                        assert.equal(sends.length, 1);
                        assert.deepEqual(sends[0], {
                            to_addr: '+27987654321',
                            content: 'hello!',
                            endpoint: 'sms'
                        });
                    });
            });
        });
    });
});
