module.exports = {
    root: true,
    env: {
        browser: true,
        es6: true,
        node: true,
    },
    extends: [
        "eslint:recommended",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:@typescript-eslint/recommended",
        "airbnb",
        "prettier",
    ],
    rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": "error",
        "no-console": "warn",
        "no-debugger": "warn",

        "react/prop-types": "off",
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",

        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/no-explicit-any": "off",

        "import/extensions": "off",
        "import/prefer-default-export": "off",
        "import/no-extraneous-dependencies": "off",
        "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
        "react/function-component-definition": "off",
        "react/require-default-props": "off",
        "react/jsx-props-no-spreading": "off",
        "react/no-array-index-key": "warn",
        "no-use-before-define": "off",
        "no-underscore-dangle": ["error", { allow: ["_id"] }],
        "no-restricted-syntax": "off",
        "no-continue": "off",
        "no-await-in-loop": "off",
        // Cac component tu tao (Checkbox/RadioGroupItem/Select) dua tren Radix deu render
        // ra phan tu co the nhan focus/id, nhung rule nay mac dinh chi nhan dien input/select/
        // textarea thuan HTML khi kiem tra <label htmlFor>...
        "jsx-a11y/label-has-associated-control": [
            "error",
            {
                controlComponents: [
                    "Checkbox",
                    "RadioGroupItem",
                    "Switch",
                    "Input",
                    "Textarea",
                ],
            },
        ],
    },
    settings: {
        "import/resolver": {
            typescript: {},
        },
    },
};
