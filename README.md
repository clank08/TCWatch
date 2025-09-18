# TCWatch Monorepo

> True Crime Tracker - A cross-platform mobile and web application for tracking True Crime content across 200+ streaming services.

This is a monorepo containing the frontend (React Native/Expo), backend (Fastify/tRPC), and shared packages for the TCWatch application.

## 🏗️ Project Structure

```
TCWatch/
├── TC-Frontend/               # Expo React Native mobile app
├── TC-Backend/                # Fastify backend with tRPC
├── packages/
│   ├── shared-types/          # Shared TypeScript types
│   └── config/                # Shared configuration
├── scripts/                   # Monorepo management scripts
├── project-documentation/     # Product requirements and architecture
└── .vscode/                   # VS Code workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ LTS
- npm 9+
- Docker & Docker Compose (for backend services)
- Expo CLI (`npm install -g @expo/cli`)

### Initial Setup

1. **Clone and setup the monorepo:**
   ```bash
   git clone <repository-url>
   cd TCWatch
   npm run setup
   ```

2. **Start development services:**
   ```bash
   # Frontend (Expo)
   npm run frontend:dev

   # Backend (Node.js)
   npm run backend:dev

   # Backend with Docker services (recommended)
   npm run backend:docker:dev
   ```

## 📱 Development Commands

### Global Commands (from root)

```bash
# Setup development environment
npm run setup

# Development
npm run dev                    # Start all workspaces in dev mode
npm run frontend:dev          # Start Expo development server
npm run backend:dev           # Start backend API server
npm run backend:docker:dev    # Start backend with Docker services

# Building
npm run build                 # Build all workspaces
npm run packages:build        # Build shared packages only

# Code Quality
npm run lint                  # Lint all workspaces
npm run lint:fix             # Fix linting issues
npm run format               # Format all files with Prettier
npm run type-check           # TypeScript type checking

# Testing
npm run test                 # Run tests in all workspaces
npm run frontend:test        # Run frontend tests
npm run backend:test         # Run backend tests

# Maintenance
npm run clean                # Clean all build outputs and node_modules
npm run fresh                # Clean and reinstall everything
```

### Frontend Specific

```bash
cd TC-Frontend

npm run dev                  # Start Expo dev server
npm run android             # Run on Android device/emulator
npm run ios                 # Run on iOS device/simulator
npm run web                 # Run in web browser
npm run build               # Build for production
npm run lint                # Lint frontend code
npm run test                # Run frontend tests
```

### Backend Specific

```bash
cd TC-Backend

npm run dev                 # Start with nodemon
npm run build              # Build TypeScript
npm run start              # Start production server
npm run docker:dev         # Start with Docker services
npm run docker:dev:down    # Stop Docker services
npm run test               # Run backend tests
npm run db:migrate         # Run Prisma migrations
npm run db:generate        # Generate Prisma client
```

## 🛠️ Development Tools

### Code Quality

- **ESLint**: Configured for TypeScript, React Native, and Node.js
- **Prettier**: Consistent code formatting across all packages
- **Husky**: Pre-commit hooks for linting and formatting
- **Commitlint**: Conventional commit message enforcement

### VS Code Integration

Open the workspace file for the best development experience:
```bash
code TCWatch.code-workspace
```

Features included:
- Multi-root workspace setup
- Debugging configurations for frontend and backend
- Task definitions for common operations
- Extension recommendations
- Optimal settings for TypeScript and React Native

### Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(frontend): add user authentication flow
fix(backend): resolve database connection issue
docs(readme): update setup instructions
chore(deps): update dependencies
```

Scopes: `frontend`, `backend`, `shared`, `config`, `deps`, `ci`, etc.

## 📦 Shared Packages

### @tcwatch/shared-types

TypeScript type definitions shared between frontend and backend:

```typescript
import { User, ContentItem, ApiError } from '@tcwatch/shared-types';
import { ContentRouter } from '@tcwatch/shared-types/api';
import { DatabaseUser } from '@tcwatch/shared-types/database';
```

### @tcwatch/config

Shared configuration constants and validation schemas:

```typescript
import { APP_CONFIG, validateBackendEnv } from '@tcwatch/config';
import { CONTENT_TYPES, PAGINATION } from '@tcwatch/config';
```

## 🏃‍♂️ Getting Started

### First Time Setup

1. **Environment Variables**: Copy backend environment template:
   ```bash
   cd TC-Backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Database Setup**: Start Docker services and run migrations:
   ```bash
   npm run backend:docker:dev
   npm run backend:db:migrate
   ```

3. **Mobile Development**: Install Expo Go app on your device or setup an emulator

### Development Workflow

1. **Start Backend Services**:
   ```bash
   npm run backend:docker:dev
   ```

2. **Start Frontend**:
   ```bash
   npm run frontend:dev
   ```

3. **Open on Device**: Scan QR code with Expo Go or press 'a' for Android, 'i' for iOS

### Building Shared Packages

When you modify shared packages, rebuild them:
```bash
npm run packages:build
```

The packages are automatically linked via npm workspaces.

## 🔧 Troubleshooting

### Common Issues

**Metro bundler cache issues:**
```bash
cd TC-Frontend
npx expo start --clear
```

**TypeScript path resolution:**
```bash
npm run packages:build
npm run type-check
```

**Docker services not starting:**
```bash
npm run backend:docker:dev:down
npm run backend:docker:dev
```

**Node modules issues:**
```bash
npm run clean
npm run fresh
```

### Debugging

- **Frontend**: Use Expo Dev Tools and browser debugger
- **Backend**: VS Code debugger configurations are included
- **Shared Packages**: Built with source maps for debugging

## 📚 Architecture

For detailed technical architecture, see:
- [Architecture Documentation](./project-documentation/architecture-output.md)
- [Product Requirements](./project-documentation/product-requirements.md)
- [Development Tasks](./TASKS.MD)

## 🤝 Contributing

1. Follow the conventional commit format
2. Ensure all tests pass: `npm run test`
3. Ensure code quality: `npm run lint && npm run format`
4. Update documentation as needed

## 📄 License

MIT License - see LICENSE file for details.