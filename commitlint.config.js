module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that do not affect the meaning of the code
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Code change that improves performance
        'test',     // Adding missing tests or correcting existing tests
        'build',    // Changes that affect the build system or external dependencies
        'ci',       // Changes to CI configuration files and scripts
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',     // TC-Frontend changes
        'backend',      // TC-Backend changes
        'shared',       // Shared packages changes
        'config',       // Configuration changes
        'deps',         // Dependency updates
        'monorepo',     // Monorepo structure changes
        'docs',         // Documentation
        'ci',           // CI/CD changes
        'docker',       // Docker configuration
        'database',     // Database schema or migrations
        'auth',         // Authentication related
        'api',          // API changes
        'ui',           // UI components
        'types',        // TypeScript types
        'utils',        // Utility functions
        'workflows',    // Temporal workflows
        'search',       // Search functionality
        'social',       // Social features
        'notifications', // Notification system
      ],
    ],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'body-leading-blank': [1, 'always'],
    'footer-leading-blank': [1, 'always'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 100],
  },
};