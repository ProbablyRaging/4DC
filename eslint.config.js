import globals from 'globals';
import pluginJs from '@eslint/js';

export default [
    {
        languageOptions: {
            globals: globals.node
        },
        rules: {
            'strict': ['error'],
            'no-undef': ['error'],
            'no-unused-expressions': ['error'],
            'no-multiple-empty-lines': ['warn'],
            'linebreak-style': ['warn', 'windows'],
            'quotes': ['warn', 'single'],
            'semi': ['warn', 'always'],
            'no-unreachable': ['error'],
            'no-unused-vars': ['error'],
            'no-sync': ['warn'],
        },
    },
    pluginJs.configs.recommended,
];