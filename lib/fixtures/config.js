var lang = require('./lang');

module.exports = function(name) {
    return {
        '1': {
            'translation.af': JSON.stringify(lang('af').locale_data.messages),
            'translation.jp': JSON.stringify(lang('jp').locale_data.messages),
            config: JSON.stringify({
                name: 'test_app',
                lerp: 'larp'
            }),
            foo: JSON.stringify({bar: 'baz'})
        }
    }[name || '1'];
};
