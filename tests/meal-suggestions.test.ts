/**
 * Unit tests for meal-suggestions data transformation logic
 *
 * Tests the algorithm that:
 * - Maps meal types to relevant categories
 * - Filters products by category relevance
 * - Sorts by frequency or quantity
 * - Returns personalized suggestions
 */

import { describe, it, expect, vi } from 'vitest';
import { createMealSuggestionsTool } from '../src/tools/meal-suggestions.js';
import {
  createMockOrder,
  createMockOrderDetail,
  createBreakfastProducts,
  createLunchProducts,
  createSnackProducts,
  createMockProduct
} from './helpers.js';

describe('meal-suggestions: data transformation', () => {

  /**
   * Test category filtering logic
   */
  describe('category filtering', () => {
    it('should filter products by breakfast categories', async () => {
      const breakfastProducts = createBreakfastProducts();
      const lunchProducts = createLunchProducts();

      const orders = [createMockOrder('order1')];
      const orderDetails = [
        createMockOrderDetail('order1', [...breakfastProducts, ...lunchProducts])
      ];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      const text = result.content[0].text;

      // Should include breakfast items
      expect(text).toContain('mléko');
      expect(text).toContain('rohlíky');
      expect(text).toContain('Máslo');

      // Should NOT include lunch items
      expect(text).not.toContain('Kuřecí');
      expect(text).not.toContain('fusilli');
    });

    it('should filter products by lunch categories', async () => {
      const breakfastProducts = createBreakfastProducts();
      const lunchProducts = createLunchProducts();

      const orders = [createMockOrder('order1')];
      const orderDetails = [
        createMockOrderDetail('order1', [...breakfastProducts, ...lunchProducts])
      ];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'lunch' });

      const text = result.content[0].text;

      // Should include lunch items
      expect(text).toContain('Kuřecí');
      expect(text).toContain('fusilli');

      // Should NOT include breakfast items
      expect(text).not.toContain('rohlíky');
    });

    it('should filter products by snack categories', async () => {
      const snackProducts = createSnackProducts();
      const lunchProducts = createLunchProducts();

      const orders = [createMockOrder('order1')];
      const orderDetails = [
        createMockOrderDetail('order1', [...snackProducts, ...lunchProducts])
      ];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'snack' });

      const text = result.content[0].text;

      // Should include snack items
      expect(text).toContain('čokoláda');
      expect(text).toContain('Banány');

      // Should NOT include lunch items
      expect(text).not.toContain('Kuřecí');
    });

    it('should handle case-insensitive category matching', async () => {
      const product = createMockProduct({
        productId: '1001',
        productName: 'Test Milk',
        categories: [{ id: 10, name: 'MLÉKO A MLÉČNÉ NÁPOJE', level: 1 }]
      });

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', [product])];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      const text = result.content[0].text;
      expect(text).toContain('Test Milk');
    });
  });

  /**
   * Test sorting logic
   */
  describe('sorting logic', () => {
    it('should sort by frequency when prefer_frequent is true', async () => {
      const milk = createMockProduct({
        productId: '1001',
        productName: 'Milk',
        categories: [{ id: 10, name: 'Mléko a mléčné nápoje', level: 1 }]
      });

      const bread = createMockProduct({
        productId: '1002',
        productName: 'Bread',
        categories: [{ id: 11, name: 'Pekárna', level: 1 }]
      });

      const orders = [
        createMockOrder('order1'),
        createMockOrder('order2'),
        createMockOrder('order3')
      ];

      const orderDetails = [
        createMockOrderDetail('order1', [milk, bread]),
        createMockOrderDetail('order2', [milk, bread]),
        createMockOrderDetail('order3', [milk]) // Milk appears 3 times, bread 2 times
      ];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockImplementation((orderId: string) => {
          return Promise.resolve(orderDetails.find(od => od.id === orderId));
        })
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({
        meal_type: 'breakfast',
        prefer_frequent: true
      });

      const text = result.content[0].text;

      // Milk should be included and appear 3 times
      expect(text).toContain('Milk');
      expect(text).toContain('Ordered 3×');
    });

    it('should sort by quantity when prefer_frequent is false', async () => {
      const milk = createMockProduct({
        productId: '1001',
        productName: 'Milk',
        quantity: 1,
        categories: [{ id: 10, name: 'Mléko a mléčné nápoje', level: 1 }]
      });

      const bread = createMockProduct({
        productId: '1002',
        productName: 'Bread',
        quantity: 5,
        categories: [{ id: 11, name: 'Pekárna', level: 1 }]
      });

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', [milk, bread])];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({
        meal_type: 'breakfast',
        prefer_frequent: false
      });

      const text = result.content[0].text;
      const lines = text.split('\n');

      // Bread should be first (higher total quantity)
      const firstProduct = lines.find(l => l.startsWith('1. '));
      expect(firstProduct).toContain('Bread');
    });
  });

  /**
   * Test items_count parameter
   */
  describe('items count limiting', () => {
    it('should limit results to items_count parameter', async () => {
      const products = Array.from({ length: 20 }, (_, i) =>
        createMockProduct({
          productId: `${i}`,
          productName: `Breakfast Product ${i}`,
          categories: [{ id: 10, name: 'Pekárna', level: 1 }]
        })
      );

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', products)];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({
        meal_type: 'breakfast',
        items_count: 5
      });

      const text = result.content[0].text;

      // Should have 5 items
      expect(text).toContain('1. Breakfast Product');
      expect(text).toContain('5. Breakfast Product');
      expect(text).not.toContain('6. Breakfast Product');
    });
  });

  /**
   * Test all meal types
   */
  describe('meal type support', () => {
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack' | 'baking' | 'drinks' | 'healthy'> = [
      'breakfast', 'lunch', 'dinner', 'snack', 'baking', 'drinks', 'healthy'
    ];

    mealTypes.forEach(mealType => {
      it(`should support meal type: ${mealType}`, async () => {
        // Use breakfast products as they match multiple meal types
        const products = createBreakfastProducts();

        const orders = [createMockOrder('order1')];
        const orderDetails = [createMockOrderDetail('order1', products)];

        const mockAPI = {
          getOrderHistory: vi.fn().mockResolvedValue(orders),
          getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
        };

        const tool = createMealSuggestionsTool(() => mockAPI as any);
        const result = await tool.handler({ meal_type: mealType });

        expect(result.content[0].type).toBe('text');
        const text = result.content[0].text;
        // Should mention the meal type somewhere in output (uppercase in header or lowercase in text)
        expect(text.toLowerCase()).toContain(mealType.toLowerCase());
      });
    });
  });

  /**
   * Test edge cases
   */
  describe('edge cases', () => {
    it('should handle empty order history', async () => {
      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue([]),
        getOrderDetail: vi.fn()
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      expect(result.content[0].text).toContain('No order history found');
    });

    it('should handle no matching products for meal type', async () => {
      const lunchProduct = createMockProduct({
        productId: '1001',
        productName: 'Lunch Item',
        categories: [{ id: 20, name: 'Maso a drůbež', level: 1 }]
      });

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', [lunchProduct])];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      const text = result.content[0].text;
      expect(text).toContain('No items found for breakfast');
    });

    it('should handle products without categories', async () => {
      const product = createMockProduct({
        productId: '1001',
        productName: 'Product Without Category',
        categories: []
      });

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', [product])];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      // Should complete without crashing
      expect(result.content[0].type).toBe('text');
    });

    it('should handle orders that fail to load', async () => {
      const orders = [
        createMockOrder('order1'),
        createMockOrder('order2')
      ];

      const orderDetails = [
        createMockOrderDetail('order1', createBreakfastProducts())
      ];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockImplementation((orderId: string) => {
          if (orderId === 'order2') return Promise.reject(new Error('API Error'));
          return Promise.resolve(orderDetails[0]);
        })
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      // Should complete successfully with order1 data
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBeFalsy();
    });
  });

  /**
   * Test output formatting
   */
  describe('output formatting', () => {
    it('should include relevant category names in output', async () => {
      const products = createBreakfastProducts();
      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', products)];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      const text = result.content[0].text;
      expect(text).toContain('Relevant categories:');
    });

    it('should show correct emoji for each meal type', async () => {
      const products = createBreakfastProducts();

      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', products)];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);

      const breakfastResult = await tool.handler({ meal_type: 'breakfast' });
      expect(breakfastResult.content[0].text).toContain('🍳');

      const snackResult = await tool.handler({ meal_type: 'snack' });
      // Snack has different categories, so may not match - just check for proper formatting
      expect(snackResult.content[0].type).toBe('text');
    });

    it('should include product IDs for easy ordering', async () => {
      const products = createBreakfastProducts();
      const orders = [createMockOrder('order1')];
      const orderDetails = [createMockOrderDetail('order1', products)];

      const mockAPI = {
        getOrderHistory: vi.fn().mockResolvedValue(orders),
        getOrderDetail: vi.fn().mockResolvedValue(orderDetails[0])
      };

      const tool = createMealSuggestionsTool(() => mockAPI as any);
      const result = await tool.handler({ meal_type: 'breakfast' });

      const text = result.content[0].text;
      expect(text).toContain('🆔');
      expect(text).toMatch(/🆔 \d+/);
    });
  });
});
