module.exports = function() {
    return {
        'translation.af': JSON.stringify({
            '' : {
                'domain' : 'messages',
                'lang'   : 'af',
                'plural_forms' : 'nplurals=2; plural=(n != 1);'
            },
            'yes' : [null, 'ja'],
            'no' : [null, 'nee'],
            'yes?' : [null, 'ja?'],
            'no!' : [null, 'nee!'],
            'hello': [null, 'hallo'],
            'hello?': [null, 'hallo?'],
            'goodbye': [null, 'totsiens']
        }),
        'translation.jp': JSON.stringify({
            '' : {
                'domain' : 'messages',
                'lang'   : 'af',
                'plural_forms' : 'nplurals=2; plural=(n != 1);'
            },
            'yes' : [null, 'hai'],
            'no' : [null, 'iie']
        }),
        config: JSON.stringify({
            lerp: 'larp',
            metric_store_name: 'luke_the_store'
        }),
        foo: JSON.stringify({bar: 'baz'})
    };
};
