// Shared Prettier configurations

export const basePrettierConfig = {
  semi: true,
  trailingComma: 'es5' as const,
  singleQuote: true,
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid' as const,
  endOfLine: 'lf' as const,
  quoteProps: 'as-needed' as const,
  jsxSingleQuote: true,
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always' as const,
      },
    },
  ],
};

export const prettierIgnorePatterns = [
  // Dependencies
  'node_modules/',
  'package-lock.json',
  'yarn.lock',

  // Build outputs
  'dist/',
  'build/',
  '.expo/',
  'android/',
  'ios/',
  'coverage/',

  // Logs
  '*.log',
  'logs/',

  // Environment variables
  '.env',
  '.env.*',

  // Generated files
  '*.generated.*',
  '*.tsbuildinfo',

  // Documentation
  'CHANGELOG.md',

  // Git
  '.git/',

  // IDE
  '.vscode/',
  '.idea/',

  // OS
  '.DS_Store',
  'Thumbs.db',

  // Prisma
  'prisma/migrations/',

  // Docker
  'docker/data/',
];

// Platform-specific configurations
export const reactNativePrettierConfig = {
  ...basePrettierConfig,
  // React Native specific overrides can go here
};

export const backendPrettierConfig = {
  ...basePrettierConfig,
  // Backend specific overrides can go here
};