var lang = require('./lang');

module.exports = function(name) {
    return {
        '1': {
            'translation.af': lang('af').locale_data.messages,
            'translation.jp': lang('jp').locale_data.messages,
            config: {
                name: 'test_app',
                lerp: 'larp'
            },
            foo: {bar: 'baz'}
        }
    }[name || '1'];
};
