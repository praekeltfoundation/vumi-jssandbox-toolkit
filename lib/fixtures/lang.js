module.exports = function(lang) {
    return {
        af: {
            domain: 'messages',
            locale_data: {
                messages: {
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
                    'goodbye': [null, 'totsiens'],
                    'yes or no?': [null, 'ja of nee?'],
                    'red': [null, 'rooi'],
                    'blue': [null, 'blou'],
                    'green': [null, 'groen']
                }
            }
        },
        jp: {
            domain: 'messages',
            locale_data: {
                messages: {
                    '' : {
                        'domain' : 'messages',
                        'lang'   : 'jp',
                        'plural_forms' : 'nplurals=2; plural=(n != 1);'
                    },
                    'yes' : [null, 'hai'],
                    'no' : [null, 'iie']
                }
            }
        }
    }[lang || 'af'];
};
