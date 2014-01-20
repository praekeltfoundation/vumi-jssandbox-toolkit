module.exports = function() {
    return {
        'users.+27123456789': {
            addr: '+27123456789',
            lang: 'af',
            answers: {start: 'yes'},
            state: {
                name: 'start',
                metadata: {foo: 'bar'}
            }
        }
    };
};
