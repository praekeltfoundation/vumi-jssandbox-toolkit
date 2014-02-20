module.exports = function(name) {
    return {
        '1': {
            from_addr: '+27987654321',
            content: 'hallo',
            message_id: '1',
            session_event: 'new',
            helper_metadata: {}
        },
        '2': {
            from_addr: '+27123456789',
            content: 'hello',
            message_id: '2',
            session_event: 'new',
            helper_metadata: {}
        }
    }[name || '1'];
};
