# Testing Guide

This directory contains all tests for the Rohlik MCP server.

## Test Structure

```
tests/
├── README.md                    # This file
├── helpers.ts                   # Mock data generators and test utilities
├── frequent-items.test.ts       # Unit tests for frequency analysis
├── meal-suggestions.test.ts     # Unit tests for meal suggestions
├── validate-api.ts              # Integration tests against real API
├── validation-results.json      # API validation results (generated)
└── validation-report.html       # HTML report (generated)
```

## Test Categories

### Unit Tests

Tests for data transformation logic that **doesn't** require API calls:

- **`frequent-items.test.ts`** - Tests frequency counting, average price calculation, sorting, and category grouping
- **`meal-suggestions.test.ts`** - Tests category filtering, meal type mapping, and sorting algorithms

**What we test:**
- ✅ Data transformation algorithms
- ✅ Frequency counting and aggregation
- ✅ Price averaging calculations
- ✅ Category filtering and matching
- ✅ Sorting by frequency/quantity
- ✅ Edge cases (empty data, missing fields, etc.)

**What we DON'T test:**
- ❌ API calls (covered by integration tests)
- ❌ Authentication logic
- ❌ Network requests
- ❌ Simple pass-through tools

### Integration Tests

Tests that verify the MCP works with the real Rohlik API:

- **`validate-api.ts`** - Validates all 11 API endpoints used by the MCP

Run with: `npm run validate-api`

## Running Tests

### Run all unit tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Run API validation (integration tests)
```bash
npm run validate-api
```

## Writing Tests

### Using Mock Helpers

The `helpers.ts` file provides utilities for creating mock data:

```typescript
import {
  createMockProduct,
  createMockOrderDetail,
  createBreakfastProducts,
  createOrdersWithRepeatedProducts
} from './helpers.js';

// Create a single product
const product = createMockProduct({
  productId: '123',
  productName: 'Test Product',
  price: 50.00
});

// Create products for specific meal types
const breakfastItems = createBreakfastProducts();

// Create orders with repeated products (for frequency tests)
const orders = createOrdersWithRepeatedProducts();
```

### Test Structure Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createFrequentItemsTool } from '../src/tools/frequent-items.js';
import { createMockProduct, createMockOrderDetail } from './helpers.js';

describe('feature name', () => {
  describe('specific functionality', () => {
    it('should do something specific', async () => {
      // Arrange: Set up mock data
      const product = createMockProduct();
      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue([...]),
        getOrderDetail: vi.fn().mockResolvedValue(...)
      };

      // Act: Execute the function
      const tool = createFrequentItemsTool(() => mockAPI as any);
      const result = await tool.handler({});

      // Assert: Verify the result
      expect(result.content[0].text).toContain('expected output');
    });
  });
});
```

## Test Coverage

Our tests focus on the **data transformation logic** in smart shopping features:

### `frequent-items.ts` Coverage

| Feature | Test Coverage |
|---------|---------------|
| Frequency counting | ✅ Multiple products across orders |
| Average price calculation | ✅ Including missing prices |
| Quantity aggregation | ✅ Different quantities per order |
| Category grouping | ✅ Per-category breakdown |
| Sorting by frequency | ✅ Descending order |
| Top N items limiting | ✅ Respects `top_items` param |
| Last order date tracking | ✅ Most recent date |
| Edge cases | ✅ Empty history, no products, failed orders |

### `meal-suggestions.ts` Coverage

| Feature | Test Coverage |
|---------|---------------|
| Category filtering | ✅ Breakfast, lunch, dinner, snacks, etc. |
| Case-insensitive matching | ✅ Category name variations |
| Sorting by frequency | ✅ When `prefer_frequent=true` |
| Sorting by quantity | ✅ When `prefer_frequent=false` |
| Items count limiting | ✅ Respects `items_count` param |
| All meal types | ✅ 7 meal types supported |
| Output formatting | ✅ Emojis, product IDs, categories |
| Edge cases | ✅ No matches, empty history, missing data |

## Why Unit Tests?

**Value of unit tests for this project:**

1. **Algorithm verification** - Smart shopping features use non-trivial algorithms:
   - Frequency counting across multiple orders
   - Average price calculation with weighted averages
   - Category filtering with fuzzy matching
   - Multi-level sorting (frequency + recency)

2. **Edge case coverage** - Tests ensure robustness:
   - Empty order history
   - Missing product data (no name, no price, no category)
   - Failed API calls (one order fails, others succeed)
   - Extreme values (0 orders, 100 orders)

3. **Regression prevention** - Tests catch bugs when refactoring:
   - Changing sorting logic
   - Modifying category mappings
   - Updating price calculations

4. **Fast feedback loop** - Unit tests run in milliseconds:
   - No API calls required
   - No authentication needed
   - Instant verification during development

5. **Documentation** - Tests serve as examples of how the algorithms work

## What We Don't Test

To keep tests maintainable and focused, we **don't** test:

- ❌ Simple pass-through tools (`search_products`, `get_cart_content`, etc.)
- ❌ API client methods in `rohlik-api.ts` (integration tests cover this)
- ❌ Authentication flow (complex, requires real credentials)
- ❌ Network error handling (better tested manually)
- ❌ Output formatting details (minor changes shouldn't break tests)

## Integration Testing

For real API verification, use the validation tool:

```bash
npm run validate-api
```

This will:
- Test all 11 API endpoints
- Show detailed HTTP logs
- Generate JSON results: `tests/validation-results.json`
- Create HTML report: `tests/validation-report.html`

**When to use:**
- After Rohlik API changes
- To debug authentication issues
- Before releasing new versions
- To verify endpoint availability

## Continuous Integration

Tests are designed to run in CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: npm test

- name: Generate coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Debugging Tests

### View detailed test output
```bash
npm test -- --reporter=verbose
```

### Run specific test file
```bash
npm test frequent-items.test.ts
```

### Run specific test case
```bash
npm test -- -t "should count product frequency"
```

### Debug with Node inspector
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run
```

## Contributing

When adding new smart features with data transformation logic:

1. **Add mock helpers** in `helpers.ts`
2. **Write unit tests** following the existing structure
3. **Test edge cases** (empty data, missing fields, etc.)
4. **Document what you test** in this README
5. **Run coverage** to ensure good test coverage

### Test Naming Convention

- **Describe blocks**: Feature or functionality being tested
- **It blocks**: Specific behavior in plain English
- **Use "should"**: Clear expectation of behavior

Example:
```typescript
describe('frequency counting', () => {
  it('should count product frequency correctly across multiple orders', () => {
    // test code
  });
});
```

## Troubleshooting

### Tests fail with "Cannot find module"
- Run `npm run build` first to compile TypeScript
- Check that `.js` extensions are used in imports

### Mock API not working
- Ensure you're using `vi.fn().mockResolvedValue()` for async functions
- Check that the mock API matches the expected interface

### Coverage report not generating
- Install coverage provider: `npm install -D @vitest/coverage-v8`
- Run: `npm run test:coverage`

### Integration tests fail
- Check credentials in Claude Desktop config
- Enable debug mode: `ROHLIK_DEBUG=true npm run validate-api`
- Verify network connectivity to Rohlik servers

## Resources

- **Vitest Documentation**: https://vitest.dev/
- **MCP Specification**: https://modelcontextprotocol.io/
- **Project README**: ../README.md
- **User Guide**: ../docs/README.md

---

**Last updated**: 2025-10-09
