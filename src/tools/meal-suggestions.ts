import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

interface ProductFrequency {
  productId: string;
  productName: string;
  brand: string;
  frequency: number;
  totalQuantity: number;
  averagePrice?: number;
  category?: string;
}

// Category mappings for different meal types
const MEAL_CATEGORY_MAPPINGS: Record<string, string[]> = {
  breakfast: [
    "Pekárna",
    "Mléko a mléčné nápoje",
    "Müsli a cereálie",
    "Džemy a pomazánky",
    "Ovoce",
    "Med",
    "Máslo a tuky",
    "Vejce"
  ],
  lunch: [
    "Maso a drůbež",
    "Zelenina",
    "Přílohy",
    "Těstoviny",
    "Rýže",
    "Omáčky a dresinky",
    "Polévky",
    "Luštěniny"
  ],
  dinner: [
    "Maso a drůbež",
    "Ryby a mořské plody",
    "Zelenina",
    "Přílohy",
    "Těstoviny",
    "Rýže",
    "Brambory",
    "Omáčky a dresinky"
  ],
  snack: [
    "Sladkosti",
    "Ovoce",
    "Ořechy a semínka",
    "Jogurty",
    "Sýry",
    "Chipsy a krekry",
    "Tyčinky"
  ],
  baking: [
    "Mouka a směsi",
    "Cukr a sladidla",
    "Pečení a vaření",
    "Čokoláda a kakao",
    "Ořechy a semínka",
    "Vejce",
    "Máslo a tuky",
    "Droždí a kypřidla"
  ],
  drinks: [
    "Nápoje",
    "Káva",
    "Čaj",
    "Mléko a mléčné nápoje",
    "Džusy a smoothies",
    "Minerální vody",
    "Pivo",
    "Víno"
  ],
  healthy: [
    "Bio produkty",
    "Zdravá výživa",
    "Bezlepkové",
    "Veganské",
    "Ovoce",
    "Zelenina",
    "Ořechy a semínka",
    "Luštěniny"
  ]
};

export function createMealSuggestionsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_meal_suggestions",
    definition: {
      title: "Get Meal Suggestions",
      description: "Get smart shopping suggestions for specific meal types (breakfast, lunch, dinner, etc.) based on your purchase history",
      inputSchema: {
        meal_type: z.enum(["breakfast", "lunch", "dinner", "snack", "baking", "drinks", "healthy"])
          .describe("Type of meal or occasion: breakfast, lunch, dinner, snack, baking, drinks, or healthy"),
        items_count: z.number().min(3).max(30).default(10)
          .describe("Number of items to suggest (3-30, default: 10)"),
        orders_to_analyze: z.number().min(5).max(100).default(20)
          .describe("Number of recent orders to analyze (5-100, default: 20)"),
        prefer_frequent: z.boolean().default(true)
          .describe("Prefer items you order frequently (default: true)")
      }
    },
    handler: async (args: {
      meal_type: keyof typeof MEAL_CATEGORY_MAPPINGS;
      items_count?: number;
      orders_to_analyze?: number;
      prefer_frequent?: boolean;
    }) => {
      const {
        meal_type,
        items_count = 10,
        orders_to_analyze = 20,
        prefer_frequent = true
      } = args;

      try {
        const api = createRohlikAPI();

        // Get relevant categories for this meal type
        const relevantCategories = MEAL_CATEGORY_MAPPINGS[meal_type];

        if (!relevantCategories || relevantCategories.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `Unknown meal type: ${meal_type}. Available types: breakfast, lunch, dinner, snack, baking, drinks, healthy`
              }
            ],
            isError: true
          };
        }

        // Fetch order history
        const orderHistory = await api.getOrderHistory(orders_to_analyze);

        if (!orderHistory || (Array.isArray(orderHistory) && orderHistory.length === 0)) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No order history found. I need your past orders to make personalized suggestions."
              }
            ]
          };
        }

        const orders = Array.isArray(orderHistory) ? orderHistory : [orderHistory];

        // Analyze products from relevant categories
        const productMap = new Map<string, ProductFrequency>();
        let processedOrders = 0;

        for (const order of orders) {
          try {
            const orderId = order.id || order.orderNumber;
            if (!orderId) continue;

            const orderDetail = await api.getOrderDetail(String(orderId));
            if (!orderDetail) continue;

            processedOrders++;
            const products = orderDetail.products || orderDetail.items || [];

            for (const product of products) {
              const productId = product.productId || product.id;
              const productName = product.productName || product.name;

              if (!productId || !productName) continue;

              // Extract category
              const categories = product.categories || [];
              const mainCategory = categories.find((cat: any) => cat.level === 1) || categories[0];
              const categoryName = mainCategory?.name || '';

              // Check if this product belongs to relevant categories
              const isRelevant = relevantCategories.some(cat =>
                categoryName.toLowerCase().includes(cat.toLowerCase()) ||
                cat.toLowerCase().includes(categoryName.toLowerCase())
              );

              if (!isRelevant) continue;

              const key = `${productId}`;

              if (productMap.has(key)) {
                const existing = productMap.get(key)!;
                existing.frequency++;
                existing.totalQuantity += (product.quantity || 1);

                if (product.price) {
                  const currentAvg = existing.averagePrice || 0;
                  existing.averagePrice = (currentAvg * (existing.frequency - 1) + product.price) / existing.frequency;
                }
              } else {
                productMap.set(key, {
                  productId: String(productId),
                  productName,
                  brand: product.brand || '',
                  frequency: 1,
                  totalQuantity: product.quantity || 1,
                  averagePrice: product.price || 0,
                  category: categoryName
                });
              }
            }
          } catch (error) {
            console.error(`Failed to process order: ${error}`);
          }
        }

        if (productMap.size === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No items found for ${meal_type} in your order history. Try a different meal type or check if you have enough order history.`
              }
            ]
          };
        }

        // Sort by frequency if preferred, otherwise by recency
        const sortedProducts = Array.from(productMap.values())
          .sort((a, b) => {
            if (prefer_frequent) {
              return b.frequency - a.frequency;
            }
            return b.totalQuantity - a.totalQuantity;
          })
          .slice(0, items_count);

        // Format output
        const mealEmojis: Record<string, string> = {
          breakfast: "🍳",
          lunch: "🍽️",
          dinner: "🍴",
          snack: "🍿",
          baking: "🧁",
          drinks: "🥤",
          healthy: "🥗"
        };

        const emoji = mealEmojis[meal_type] || "🛒";
        const formatItem = (item: ProductFrequency, index: number): string => {
          const brand = item.brand ? ` (${item.brand})` : '';
          const avgPrice = item.averagePrice ? `${item.averagePrice.toFixed(2)} Kč` : 'N/A';
          const category = item.category ? ` • ${item.category}` : '';

          return `${index + 1}. ${item.productName}${brand}${category}
   📊 Ordered ${item.frequency}× • 💰 ${avgPrice} • 🆔 ${item.productId}`;
        };

        const output = `${emoji} ${meal_type.toUpperCase()} SUGGESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Analyzed ${processedOrders} orders • Found ${productMap.size} relevant items
🎯 Relevant categories: ${relevantCategories.slice(0, 5).join(", ")}${relevantCategories.length > 5 ? '...' : ''}

${prefer_frequent ? '🏆 TOP ITEMS YOU FREQUENTLY ORDER:' : '📦 SUGGESTED ITEMS:'}

${sortedProducts.map(formatItem).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tips:
   • Use "add these items to my cart" to quickly add suggestions
   • Product IDs can be used with add_to_cart tool
   • Try different meal types: breakfast, lunch, dinner, snack, baking, drinks, healthy`;

        return {
          content: [
            {
              type: "text" as const,
              text: output
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text" as const,
              text: error instanceof Error ? error.message : String(error)
            }
          ],
          isError: true
        };
      }
    }
  };
}
