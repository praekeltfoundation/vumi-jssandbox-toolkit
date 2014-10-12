module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({
        paths: {
            src: {
                app: [
                    'src/app.js'
                ],
                prd: [
                    'src/index.js',
                    '<%= paths.src.app %>',
                    'src/init.js'
                ],
                all: [
                    'src/**/*.js'
                ]
            },
            dest: {
                prd: 'go-app.js'
            },
            test: [
                'test/setup.js',
                '<%= paths.src.app %>',
                'test/**/*.test.js'
            ]
        },

        jshint: {
            options: {jshintrc: '.jshintrc'},
            all: [
                'Gruntfile.js',
                '<%= paths.src.all %>',
                '<%= paths.test %>'
            ]
        },

        watch: {
            src: {
                files: [
                    '<%= paths.src.all %>',
                    '<%= paths.test %>'
                ],
                tasks: ['default'],
                options: {
                    atBegin: true
                }
            }
        },

        concat: {
            options: {
                banner: [
                    '// WARNING: This is a generated file.',
                    '//          If you edit it you will be sad.',
                    '//          Edit src/app.js instead.',
                    '\n' // Newline between banner and content.
                ].join('\n')
            },
            prd: {
                src: ['<%= paths.src.prd %>'],
                dest: '<%= paths.dest.prd %>'
            }
        },

        mochaTest: {
            test: {
                src: ['<%= paths.test %>'],
                options: {
                    reporter: 'spec'
                }
            }
        }
    });

    grunt.registerTask('test', [
        'jshint',
        'build',
        'mochaTest'
    ]);

    grunt.registerTask('build', [
        'concat',
    ]);

    grunt.registerTask('default', [
        'build',
        'test'
    ]);
};