# TCWatch Testing Guidelines

## Overview

This document outlines comprehensive testing practices for the TCWatch True Crime Tracker application. Our testing strategy follows the testing pyramid principle and ensures high-quality, reliable software delivery.

## Testing Philosophy

### Testing Pyramid
```
                    E2E Tests (10%)
                 ┌─────────────────────┐
                 │   Critical Flows    │
                 │   User Journeys     │
                 └─────────────────────┘
                Integration Tests (20%)
             ┌─────────────────────────────┐
             │    API Endpoints           │
             │    Database Operations     │
             │    External Integrations   │
             └─────────────────────────────┘
              Unit Tests (70%)
        ┌───────────────────────────────────────┐
        │     Component Logic                   │
        │     Service Methods                   │
        │     Utility Functions                 │
        │     Business Logic                    │
        └───────────────────────────────────────┘
```

### Testing Principles

1. **Test-Driven Development (TDD)**: Write tests before implementing features when possible
2. **Coverage Requirements**: Maintain minimum 80% code coverage, 95% for critical paths
3. **Test Isolation**: Each test should be independent and not rely on other tests
4. **Fast Feedback**: Unit tests run in under 10 seconds, full suite under 10 minutes
5. **Realistic Data**: Use representative test data that mirrors production scenarios

## Test Categories

### 1. Unit Tests (70% of test suite)

**Purpose**: Test individual functions, components, and modules in isolation.

**Tools**:
- Backend: Jest + ts-jest
- Frontend: Jest + React Native Testing Library

**Coverage Requirements**:
- General code: 80% minimum
- Critical business logic: 95% minimum
- Service layers: 95% minimum
- Authentication middleware: 95% minimum

**Example Structure**:
```typescript
describe('ContentService', () => {
  describe('searchContent', () => {
    it('should return paginated results for valid query', () => {
      // Arrange: Set up test data and mocks
      // Act: Execute the function under test
      // Assert: Verify expected behavior
    });

    it('should handle empty search results', () => {
      // Test edge cases
    });

    it('should validate input parameters', () => {
      // Test error conditions
    });
  });
});
```

**Best Practices**:
- Use descriptive test names that explain the scenario
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies
- Test both happy path and error conditions
- Keep tests focused on a single behavior

### 2. Integration Tests (20% of test suite)

**Purpose**: Test interactions between components, services, and external systems.

**Tools**:
- Backend: Jest + Supertest + Test Database
- Frontend: Jest + MSW (Mock Service Worker)

**Scope**:
- API endpoint testing
- Database operations
- External API integrations
- Authentication flows
- Cross-service communication

**Example Structure**:
```typescript
describe('Content API Integration', () => {
  beforeEach(async () => {
    await dbHelper.cleanDatabase();
    await dbHelper.seedTestData();
  });

  it('should create and retrieve content via API', async () => {
    // Test full request/response cycle
    const response = await apiHelper.authenticatedRequest('user-id')
      .post('/api/content')
      .send(contentData);

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();

    // Verify in database
    const dbRecord = await dbHelper.assertRecordExists('content', {
      id: response.body.id
    });
  });
});
```

### 3. End-to-End (E2E) Tests (10% of test suite)

**Purpose**: Test complete user journeys and critical application flows.

**Tools**: Playwright (web) + Detox (mobile future)

**Scope**:
- Critical user journeys
- Cross-browser compatibility
- Authentication flows
- Data synchronization
- Performance validation

**Test Selection Criteria**:
Only test critical paths that:
- Generate revenue or user engagement
- Have high impact if broken
- Cannot be adequately covered by unit/integration tests
- Represent core user workflows

**Example Critical Flows**:
1. User registration and onboarding
2. Content search and discovery
3. Content tracking (add to list, mark as watched)
4. Social features (share lists, follow friends)
5. Cross-device data synchronization

## Testing Standards

### Naming Conventions

**Test Files**:
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.spec.ts`

**Test Names**:
```typescript
// Good: Descriptive and specific
it('should return validation error when email is missing from registration form')

// Bad: Vague and unclear
it('should validate form')
```

**Test Organization**:
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    describe('when condition', () => {
      it('should expected behavior', () => {
        // Test implementation
      });
    });
  });
});
```

### Data Management

**Test Data**:
- Use factories for consistent test data creation
- Clean up test data after each test
- Use realistic data that represents production scenarios
- Avoid hardcoded IDs or timestamps

**Database Testing**:
- Use separate test database
- Reset database state before each test
- Use transactions for isolation when possible
- Test database constraints and relationships

**Mock Management**:
- Mock external dependencies (APIs, services)
- Use MSW for HTTP request mocking
- Reset mocks between tests
- Verify mock interactions when testing integration points

### Performance Testing

**Response Time Requirements**:
- API endpoints: < 500ms p99
- Search queries: < 100ms p90
- Page loads: < 2 seconds initial load
- Component renders: < 16ms (60fps)

**Load Testing**:
- Test with realistic concurrent user loads
- Verify graceful degradation under stress
- Test rate limiting and circuit breakers
- Monitor memory usage and cleanup

### Accessibility Testing

**Requirements**:
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- Color contrast validation

**Testing Approach**:
- Include accessibility assertions in component tests
- Test keyboard navigation paths
- Verify ARIA labels and roles
- Test with screen reader emulation

## Test Environment Setup

### Local Development

**Prerequisites**:
```bash
# Install dependencies
npm install

# Setup test database
npm run db:test:setup

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e
```

**Environment Variables**:
```bash
# Test environment configuration
NODE_ENV=test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/tcwatch_test
SUPABASE_URL=your_test_supabase_url
SUPABASE_ANON_KEY=your_test_anon_key
```

### CI/CD Integration

**GitHub Actions Workflow**:
- Unit tests run on every PR
- Integration tests run on main branch pushes
- E2E tests run on staging deployments
- Coverage reports uploaded to Codecov
- Performance benchmarks tracked

**Quality Gates**:
- All tests must pass before merge
- Coverage cannot decrease below thresholds
- Performance budgets must be met
- Security scans must pass

## Test Utilities and Helpers

### Backend Test Helpers

```typescript
import { apiHelper, dbHelper, MockDataFactory } from '../tests/utils/test-helpers';

// API testing
const response = await apiHelper.authenticatedRequest('user-id')
  .get('/api/content')
  .expect(200);

// Database operations
await dbHelper.cleanDatabase();
const user = await dbHelper.createTestUser();

// Mock data generation
const mockApiResponse = MockDataFactory.watchmodeResponse();
```

### Frontend Test Helpers

```typescript
import { render, testUtils } from '../__tests__/utils/react-native-test-helpers';

// Component testing with providers
const { getByTestId } = render(<MyComponent />, {
  queryClient: mockQueryClient
});

// User interactions
await testUtils.interaction.typeText(input, 'search query');
await testUtils.interaction.longPress(element);

// Accessibility testing
testUtils.accessibility.testAccessibility(element, {
  label: 'Content card',
  role: 'button'
});
```

### E2E Test Helpers

```typescript
import { TestDataManager } from '../e2e-tests/utils/test-data-manager';

const testDataManager = new TestDataManager();

// Setup test user with data
const user = await testDataManager.setupUserWithViewingHistory();

// Clean up after test
await testDataManager.cleanupTestData();
```

## Testing Checklist

### Before Writing Tests

- [ ] Understand the feature requirements
- [ ] Identify critical paths and edge cases
- [ ] Plan test data requirements
- [ ] Consider accessibility requirements
- [ ] Review existing test patterns

### Test Implementation

- [ ] Write descriptive test names
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Test happy path and error conditions
- [ ] Mock external dependencies appropriately
- [ ] Include performance assertions where relevant
- [ ] Add accessibility checks for UI components

### Test Review

- [ ] Tests are focused and isolated
- [ ] Test data is realistic and well-managed
- [ ] Mocks are appropriate and verified
- [ ] Coverage meets requirements
- [ ] Tests run reliably and quickly
- [ ] Error messages are clear and actionable

### Maintenance

- [ ] Update tests when requirements change
- [ ] Remove obsolete tests
- [ ] Refactor test utilities as needed
- [ ] Monitor test execution time
- [ ] Keep test dependencies updated

## Debugging Tests

### Common Issues

**Flaky Tests**:
- Race conditions in async operations
- Shared state between tests
- External dependency failures
- Timing-dependent assertions

**Solutions**:
- Use `waitFor` for async operations
- Ensure proper test isolation
- Mock external dependencies
- Use deterministic test data

**Performance Issues**:
- Slow database operations
- Large test datasets
- Inefficient test utilities
- Excessive mock setup

**Solutions**:
- Use database transactions for rollback
- Optimize test data creation
- Profile test execution
- Lazy load test utilities

## Continuous Improvement

### Metrics to Track

- Test execution time
- Test coverage percentage
- Test failure rates
- Defect escape rate
- Time to fix broken tests

### Regular Reviews

- Monthly test suite performance review
- Quarterly test strategy assessment
- Annual testing tool evaluation
- Post-incident test gap analysis

### Training and Knowledge Sharing

- Onboarding materials for new team members
- Regular testing best practices sessions
- Code review focus on test quality
- Documentation updates based on learnings

## Resources and Tools

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

### Internal Resources
- Test utility documentation: `/docs/test-utilities.md`
- Test data patterns: `/docs/test-data-patterns.md`
- CI/CD testing pipeline: `/.github/workflows/test.yml`
- Performance benchmarks: `/docs/performance-benchmarks.md`

---

**Last Updated**: September 2024
**Next Review**: December 2024
**Owner**: QA & Engineering Team