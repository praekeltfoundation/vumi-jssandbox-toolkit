module.exports = function() {
    return {
        'users.default.+27123456789': {
            addr: '+27123456789',
            lang: 'en',
            answers: {start: 'hi'},
            state: {
                name: 'start',
                metadata: {}
            }
        },
        'users.default.+27987654321': {
            addr: '+27987654321',
            lang: 'af',
            answers: {start: 'ja'},
            state: {
                name: 'start',
                metadata: {foo: 'bar'}
            }
        }
    };
};
