// Shared ESLint configurations

export const baseEslintConfig = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.spec.ts', '**/__tests__/**/*.ts'],
      env: {
        jest: true,
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        'no-console': 'off',
      },
    },
  ],
  ignorePatterns: [
    'dist/',
    'build/',
    'node_modules/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
};

export const reactNativeEslintConfig = {
  ...baseEslintConfig,
  extends: [
    ...baseEslintConfig.extends,
    'expo',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react-native/all',
  ],
  env: {
    ...baseEslintConfig.env,
    'react-native/react-native': true,
  },
  plugins: [...baseEslintConfig.plugins, 'react', 'react-hooks', 'react-native'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    ...baseEslintConfig.rules,
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-native/no-unused-styles': 'error',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
  overrides: [
    ...baseEslintConfig.overrides,
    {
      files: ['app/**/*.tsx', 'app/**/*.ts'],
      rules: {
        'react-native/no-raw-text': 'off',
      },
    },
    {
      files: ['*.test.tsx', '*.spec.tsx', '**/__tests__/**/*.tsx'],
      env: {
        jest: true,
      },
      rules: {
        'react-native/no-inline-styles': 'off',
      },
    },
  ],
  ignorePatterns: [
    ...baseEslintConfig.ignorePatterns,
    '.expo/',
    'android/',
    'ios/',
  ],
};

export const backendEslintConfig = {
  ...baseEslintConfig,
  rules: {
    ...baseEslintConfig.rules,
    'no-console': ['warn', { allow: ['info', 'warn', 'error'] }],
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      },
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
  },
  overrides: [
    ...baseEslintConfig.overrides,
    {
      files: ['src/scripts/**/*.ts'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      files: ['prisma/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
  ],
};