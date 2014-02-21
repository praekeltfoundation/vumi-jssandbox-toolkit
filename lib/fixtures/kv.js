module.exports = function(name) {
    return {
        '1': {
            'users.test_app.+27123456789': {
                addr: '+27123456789',
                lang: 'en',
                answers: {start: 'hi'},
                state: {
                    name: 'start',
                    metadata: {}
                }
            },
            'users.test_app.+27987654321': {
                addr: '+27987654321',
                lang: 'af',
                answers: {start: 'ja'},
                metadata: {name: 'jan'},
                state: {
                    name: 'start',
                    metadata: {foo: 'bar'}
                },
            }
        }
    }[name || '1'];
};
