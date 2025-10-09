import { z } from "zod";

export function createShoppingScenariosTool() {
  return {
    name: "get_shopping_scenarios",
    definition: {
      title: "Get Shopping Scenarios",
      description: "Shows example scenarios and use cases for the Rohlik MCP - helps users understand what's possible",
      inputSchema: {}
    },
    handler: async () => {
      const output = `🛒 ROHLIK MCP - WHAT YOU CAN DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 SMART SHOPPING SCENARIOS:

1️⃣  MEAL-BASED SHOPPING
   💬 "Add breakfast items I typically order"
   💬 "Show me lunch suggestions for this week"
   💬 "I need dinner ingredients - suggest what I usually buy"
   💬 "Add my usual snacks to the cart"
   🔧 Tool: get_meal_suggestions

2️⃣  QUICK REORDERING
   💬 "Show my 20 most frequently purchased items"
   💬 "What do I buy most often?"
   💬 "Add my top 10 frequent items to cart"
   🔧 Tool: get_frequent_items

3️⃣  CATEGORY-BASED SHOPPING
   💬 "What dairy products do I usually buy?"
   💬 "Show my top bakery purchases"
   💬 "Add my usual fruits and vegetables"
   🔧 Tool: get_frequent_items (with categories)

4️⃣  SPECIFIC PRODUCT SEARCH
   💬 "Find organic milk and add to cart"
   💬 "Search for gluten-free bread"
   💬 "Show me all chocolates on sale"
   🔧 Tool: search_products + add_to_cart

5️⃣  WEEKLY PLANNING
   💬 "I need groceries for the whole week - suggest based on my history"
   💬 "Show what I typically buy for breakfast, lunch, and dinner"
   💬 "Help me plan my weekly shopping"
   🔧 Combination of meal suggestions

6️⃣  ORDER MANAGEMENT
   💬 "What's in my cart?"
   💬 "Show my last 5 orders"
   💬 "What did I order last week?"
   💬 "Show details of order #1234567"
   🔧 Tools: get_cart_content, get_order_history, get_order_detail

7️⃣  DELIVERY PLANNING
   💬 "When is my next delivery?"
   💬 "What delivery slots are available tomorrow?"
   💬 "Show the cheapest delivery slots this week"
   🔧 Tools: get_upcoming_orders, get_delivery_slots

8️⃣  ACCOUNT & SAVINGS
   💬 "How much have I saved with Premium?"
   💬 "What are my Premium benefits?"
   💬 "Check my reusable bags count"
   🔧 Tools: get_premium_info, get_reusable_bags_info

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 MEAL TYPES AVAILABLE:
   • breakfast 🍳 - Morning essentials (bread, milk, cereals, fruits)
   • lunch 🍽️ - Midday meal ingredients (meat, vegetables, pasta, rice)
   • dinner 🍴 - Evening meal items (meat, fish, vegetables, sides)
   • snack 🍿 - Quick bites (sweets, fruits, nuts, yogurt)
   • baking 🧁 - Baking supplies (flour, sugar, chocolate, butter)
   • drinks 🥤 - Beverages (coffee, tea, juices, water, alcohol)
   • healthy 🥗 - Health-focused (bio, vegan, gluten-free, vegetables)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 POWER TIPS:

   ✨ Combine suggestions with actions:
      "Show breakfast suggestions and add top 5 to cart"

   ✨ Use natural language:
      "I forgot to buy milk last time, add it to my cart"

   ✨ Ask for alternatives:
      "Find cheaper alternative to product #123456"

   ✨ Plan ahead:
      "What should I order for weekend breakfast?"

   ✨ Be specific:
      "Add ingredients for apple pie - only gluten-free"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 AVAILABLE TOOLS (${16}):

📦 Shopping:
   • search_products - Find products by name
   • add_to_cart - Add products to cart
   • get_cart_content - View current cart
   • remove_from_cart - Remove items
   • get_shopping_list - View shopping lists

🤖 Smart Features:
   • get_meal_suggestions - Meal-based suggestions (NEW!)
   • get_frequent_items - Most purchased items
   • get_shopping_scenarios - This help (NEW!)

📊 Orders:
   • get_order_history - Past orders
   • get_order_detail - Order details
   • get_upcoming_orders - Scheduled orders

🚚 Delivery:
   • get_delivery_info - Current delivery info
   • get_delivery_slots - Available time slots

👤 Account:
   • get_account_data - Full account info
   • get_premium_info - Premium subscription
   • get_announcements - Current announcements
   • get_reusable_bags_info - Bag tracking

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 TRY IT NOW:
   Start with: "Show me breakfast suggestions based on what I usually order"

💬 Need help? Just ask: "What can I do with Rohlik MCP?"`;

      return {
        content: [
          {
            type: "text" as const,
            text: output
          }
        ]
      };
    }
  };
}
