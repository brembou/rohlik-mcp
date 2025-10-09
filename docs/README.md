# 📚 Rohlik MCP - User Guide

Welcome! This comprehensive guide will teach you everything about using Rohlik MCP.

> **📘 Note:** For installation instructions, see the [main README](../README.md).

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [What Can You Do?](#what-can-you-do)
3. [Smart Shopping Features](#smart-shopping-features)
4. [All Available Tools](#all-available-tools)
5. [Example Conversations](#example-conversations)
6. [Tips & Best Practices](#tips--best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

Once you have Rohlik MCP installed and configured (see [main README](../README.md)), start with:

```
"What can I do with Rohlik MCP?"
```

This will show you an interactive guide with all possibilities!

---

## What Can You Do?

### 🤖 1. Smart Shopping (Data-Driven)

The MCP provides tools that analyze your order history to give personalized suggestions. Claude uses these tools to help you shop more efficiently:

#### Meal-Based Shopping
```
"Add breakfast items I typically order"
"Show me lunch suggestions for this week"
"I need dinner ingredients - suggest what I usually buy"
"Add my usual snacks to the cart"
```

**How it works:**
- Analyzes your past orders (default: last 20)
- Finds products in relevant categories for that meal type
- Prioritizes items you order frequently
- Returns ready-to-order suggestions

**Available meal types:**
- 🍳 **breakfast** - Bread, milk, cereals, fruits, jam, eggs
- 🍽️ **lunch** - Meat, vegetables, pasta, rice, sauces
- 🍴 **dinner** - Meat, fish, vegetables, sides
- 🍿 **snack** - Sweets, fruits, nuts, yogurt
- 🧁 **baking** - Flour, sugar, chocolate, butter
- 🥤 **drinks** - Coffee, tea, juices, water, alcohol
- 🥗 **healthy** - Bio, vegan, gluten-free products

#### Frequency Analysis
```
"Show my 20 most frequently purchased items"
"What do I buy most often?"
"What dairy products do I usually buy?"
"Show my top bakery purchases"
```

**Features:**
- Overall top items across all categories
- Per-category breakdown (e.g., top dairy, top bakery)
- Frequency statistics and average prices
- Last purchase dates

### 🛒 2. Regular Shopping

#### Product Search
```
"Find organic milk"
"Search for gluten-free bread"
"Show me all chocolates"
```

#### Cart Management
```
"What's in my cart?"
"Add product #1441840 to my cart"
"Remove item from my cart"
"Add 5 liters of milk to cart"
```

#### Shopping Lists
```
"Show my shopping list"
"Add items from my shopping list #123"
```

### 📦 3. Order Management

#### Order History
```
"Show my last 5 orders"
"What did I order last week?"
"Show details of order #1110717593"
```

**Information provided:**
- Order date and time
- Total price
- All products with quantities
- Order status

#### Upcoming Orders
```
"When is my next delivery?"
"Show my scheduled orders"
```

### 🚚 4. Delivery Planning

#### Delivery Slots
```
"What delivery slots are available tomorrow?"
"Show the cheapest delivery slots this week"
"When can I get delivery today?"
```

**Shows:**
- Available time windows
- Prices (standard, express, eco)
- Capacity status (available, limited, sold out)
- Express delivery options

#### Delivery Info
```
"Where will my next delivery be?"
"What's my delivery address?"
"When is the earliest delivery?"
```

### 💰 5. Account & Savings

#### Premium Membership
```
"How much have I saved with Premium?"
"What are my Premium benefits?"
"When does my Premium expire?"
```

**Tracks:**
- Total savings (delivery + discounts)
- Remaining benefits (free express, small orders)
- Membership type and renewal date

#### Reusable Bags
```
"How many reusable bags do I have?"
"Check my environmental impact"
```

#### Announcements
```
"Show current announcements"
"Any important updates?"
```

---

## Smart Shopping Features

### How Meal Suggestions Work

The MCP uses algorithmic analysis (not AI) to process your shopping data. Here's how:

**Step 1: Category Mapping**

Each meal type is mapped to relevant Rohlik categories:

```
breakfast → Pekárna, Mléko, Müsli, Džemy, Ovoce, Vejce
lunch → Maso, Zelenina, Přílohy, Těstoviny, Rýže
dinner → Maso, Ryby, Zelenina, Přílohy, Omáčky
...
```

**Step 2: Historical Analysis**

The MCP fetches your order history (configurable, default 20 orders) and:
- Extracts all products
- Filters by relevant categories
- Counts purchase frequency
- Calculates average prices

**Step 3: Smart Ranking**

Products are ranked by:
- Frequency (how often you order them)
- Recency (when you last ordered)
- Quantity (how many you typically buy)

**Step 4: Personalized Results**

Returns your most relevant items with:
- Product name and brand
- Purchase frequency
- Average price
- Product ID (for easy reordering)

### Example: Breakfast Suggestions

```
You: "Show me breakfast suggestions"

Claude calls: get_meal_suggestions(meal_type: "breakfast")

Output:
🍳 BREAKFAST SUGGESTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 Analyzed 20 orders • Found 45 relevant items

1. Miil Trvanlivé mléko 1,5% (Miil) • Mléko
   📊 Ordered 15× • 💰 21.90 Kč • 🆔 1441840

2. Rohlík Pšenične rohlíky • Pekárna
   📊 Ordered 12× • 💰 8.90 Kč • 🆔 712345

3. Madeta Máslo 250g (Madeta) • Máslo
   📊 Ordered 8× • 💰 45.50 Kč • 🆔 789456
...
```

### Combining Features

You can combine smart suggestions with actions:

```
"Show breakfast suggestions and add top 5 to cart"
"Find my usual dairy products and add them"
"I need ingredients for the week - suggest breakfast, lunch, and dinner items"
```

---

## All Available Tools

### 🤖 Smart Shopping (3 tools)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_meal_suggestions` | Get items for specific meal types | "Show dinner suggestions" |
| `get_frequent_items` | Analyze purchase history | "What do I buy most?" |
| `get_shopping_scenarios` | Interactive help guide | "What can I do?" |

### 🛒 Core Shopping (5 tools)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `search_products` | Find products by name | "Search for milk" |
| `add_to_cart` | Add products to cart | "Add product #123" |
| `get_cart_content` | View current cart | "What's in my cart?" |
| `remove_from_cart` | Remove items | "Remove item #456" |
| `get_shopping_list` | View shopping lists | "Show shopping list" |

### 📦 Order Management (3 tools)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_order_history` | View past orders | "Show last 5 orders" |
| `get_order_detail` | Get order details | "Details of order #123" |
| `get_upcoming_orders` | See scheduled orders | "Next delivery?" |

### 🚚 Delivery (2 tools)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_delivery_info` | Current delivery info | "Delivery address?" |
| `get_delivery_slots` | Available time slots | "Slots for tomorrow?" |

### 👤 Account (3 tools)

| Tool | Description | Example Usage |
|------|-------------|---------------|
| `get_account_data` | Full account overview | "Show account info" |
| `get_premium_info` | Premium membership | "Premium savings?" |
| `get_reusable_bags_info` | Bag tracking | "How many bags?" |

**Total: 16 tools**

---

## Example Conversations

### Conversation 1: Morning Routine

```
You: "I need to order groceries for breakfast this week"

Claude: "I'll help you order breakfast groceries. Let me check what you
        typically buy for breakfast."

[Calls get_meal_suggestions(meal_type: "breakfast", items_count: 15)]

Claude: "Based on your order history, here are your typical breakfast items:

        1. Miil Mléko 1,5% - you order this 15× in 20 orders
        2. Rohlík Pšenične rohlíky - 12× in 20 orders
        3. Madeta Máslo - 8× in 20 orders
        ... (12 more items)

        Would you like me to add these to your cart?"

You: "Yes, add the top 8 items"

Claude: [Calls add_to_cart with product IDs]
        "Done! I've added 8 breakfast items to your cart for a total
        of approximately 245 Kč. Would you like to see your cart?"
```

### Conversation 2: Weekly Planning

```
You: "Help me plan my grocery shopping for the week"

Claude: "I'll help you plan! Let me get suggestions for different meal types."

[Calls get_meal_suggestions for breakfast, lunch, dinner]

Claude: "Here's your weekly meal plan based on what you typically order:

        BREAKFAST (7 items):
        • Milk, bread, butter, jam, yogurt, fruit, cereals

        LUNCH (10 items):
        • Chicken, vegetables, pasta, rice, sauces, soup

        DINNER (10 items):
        • Meat, fish, potatoes, vegetables, sauces

        Would you like me to add all of these, or would you prefer to
        customize the selection?"
```

### Conversation 3: Quick Reorder

```
You: "I forgot to order last week, just add my usual items"

Claude: "I'll get your most frequently purchased items."

[Calls get_frequent_items(top_items: 20)]

Claude: "Here are your top 20 most ordered items. Should I add them
        all to your cart, or would you like to review first?"

You: "Add them all"

Claude: [Calls add_to_cart]
        "Added 20 items to your cart! Total: ~850 Kč"
```

### Conversation 4: Discovery

```
You: "What's special about dairy products I buy?"

Claude: [Calls get_frequent_items(show_categories: true)]

Claude: "Here's your dairy purchasing pattern:

        📦 MLÉKO A MLÉČNÉ NÁPOJE (45 orders total):
        1. Miil Mléko 1,5% - 15× orders
        2. Madeta Eidam 30% - 10× orders
        3. Danone Jogurt - 8× orders

        You're very consistent with milk (every order!) and cheese
        (every other order). Want me to add your favorites?"
```

---

## Tips & Best Practices

### 💡 General Tips

1. **Be natural**: Talk to Claude like a human
   - ✅ "I need breakfast items"
   - ❌ "Execute get_meal_suggestions breakfast"

2. **Combine requests**: Claude can do multiple things at once
   - ✅ "Show breakfast suggestions and add top 5 to cart"

3. **Be specific when needed**:
   - ✅ "Add gluten-free breakfast items I usually order"
   - ✅ "Show my top 10 items from the last 30 orders"

4. **Use the help**: Ask "What can I do?" anytime you're stuck

### 🎯 Smart Shopping Tips

1. **Adjust analysis depth**:
   ```
   "Analyze my last 50 orders" - More data, slower
   "Analyze my last 10 orders" - Less data, faster
   ```

2. **Filter by preferences**:
   ```
   "Show healthy breakfast suggestions"
   "Suggest budget-friendly lunch items"
   "Only organic products for dinner"
   ```

3. **Combine meal types**:
   ```
   "I need both breakfast and snacks for the week"
   ```

4. **Review before adding**:
   ```
   "Show me suggestions first" (review)
   "Add breakfast items" (immediate)
   ```

### 📊 Performance Tips

1. **Default settings are optimized**:
   - 20 orders analysis ≈ 10-15 seconds
   - 10 items per request

2. **For faster results**:
   - Analyze fewer orders (10-15)
   - Request fewer items (5-8)
   - Disable category breakdown

3. **For more accuracy**:
   - Analyze more orders (30-50)
   - Include category breakdown
   - Review suggestions before adding

### 🔒 Privacy & Security

1. **Credentials**: Stored locally in Claude Desktop config
2. **No data storage**: MCP doesn't store your order history
3. **Session-based**: Each request creates a fresh session
4. **API calls**: Direct to Rohlik servers (no intermediaries)

---

## Advanced Usage

### Custom Meal Categories

You can ask for specific category combinations:

```
"Show me items from dairy and bakery categories"
"What do I usually buy from vegetables and fruits?"
```

### Budget Planning

```
"Show my cheapest frequent breakfast items"
"What's my average breakfast cost?"
"Find budget-friendly dinner suggestions"
```

### Dietary Preferences

```
"Show breakfast suggestions - only bio products"
"Suggest gluten-free lunch items I usually order"
"Healthy snack suggestions - vegan only"
```

### Time-Based Analysis

```
"What did I order most in the last month?"
"Compare my purchases from last 10 vs last 30 orders"
```

---

## Need More Help?

1. **Ask Claude**: "What can I do with Rohlik MCP?"
2. **Technical issues**: See troubleshooting in the [main README](../README.md)
3. **Report issues**: [GitHub Issues](https://github.com/tomaspavlin/rohlik-mcp/issues)

---

## What's Next?

Now that you understand the basics:

1. **Try it!** Start with: "Show me breakfast suggestions"
2. **Explore**: Ask "What can I do?" for more ideas
3. **Customize**: Adjust parameters for your needs
4. **Combine**: Use multiple features together
5. **Share**: Help others discover Rohlik MCP!

---

**Happy Shopping! 🛒**

*Last updated: 2025-10-09*
