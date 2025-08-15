#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { RohlikAPI } from "./rohlik-api.js";

const server = new McpServer(
  {
    name: "rohlik-mcp",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

function getCredentials() {
  const username = process.env.ROHLIK_USERNAME;
  const password = process.env.ROHLIK_PASSWORD;

  if (!username || !password) {
    throw new Error('ROHLIK_USERNAME and ROHLIK_PASSWORD environment variables are required');
  }

  return { username, password };
}

function createRohlikAPI() {
  const credentials = getCredentials();
  return new RohlikAPI(credentials);
}

server.registerTool(
  "search_products",
  {
    title: "Search Products",
    description: "Search for products on Rohlik.cz by name",
    inputSchema: {
      product_name: z.string().min(1, "Product name cannot be empty").describe("The name or search term for the product"),
      limit: z.number().min(1).max(50).default(10).describe("Maximum number of products to return (1-50, default: 10)"),
      favourite_only: z.boolean().default(false).describe("Whether to return only favourite products (default: false)")
    }
  },
  async ({ product_name, limit = 10, favourite_only = false }) => {
    try {
      const api = createRohlikAPI();
      const results = await api.searchProducts(product_name, limit, favourite_only);

      const output = `Found ${results.length} products:\n\n` +
        results.map(product => 
          `• ${product.name} (${product.brand})\n  Price: ${product.price}\n  Amount: ${product.amount}\n  ID: ${product.id}`
        ).join('\n\n');

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "add_to_cart",
  {
    title: "Add to Cart",
    description: "Add products to the shopping cart",
    inputSchema: {
      products: z.array(z.object({
        product_id: z.number().describe("The ID of the product to add"),
        quantity: z.number().min(1).describe("Quantity of the product to add")
      })).min(1, "At least one product is required").describe("Array of products to add to cart")
    }
  },
  async ({ products }) => {
    try {
      const api = createRohlikAPI();
      const addedProducts = await api.addToCart(products);
      const successCount = addedProducts.length;
      const totalRequested = products.length;

      const output = `Successfully added ${successCount}/${totalRequested} products to cart.\n` +
        (addedProducts.length > 0 ? `Added product IDs: ${addedProducts.join(', ')}` : 'No products were added.');

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_cart_content",
  {
    title: "Get Cart Content",
    description: "Get the current contents of the shopping cart",
    inputSchema: {}
  },
  async () => {
    try {
      const api = createRohlikAPI();
      const cartContent = await api.getCartContent();

      if (cartContent.total_items === 0) {
        return {
          content: [
            {
              type: "text",
              text: "Your cart is empty."
            }
          ]
        };
      }

      const output = `Cart Summary:
• Total items: ${cartContent.total_items}
• Total price: ${cartContent.total_price} CZK
• Can order: ${cartContent.can_make_order ? 'Yes' : 'No'}

Products in cart:
${cartContent.products.map(product => 
  `• ${product.name} (${product.brand})\n  Quantity: ${product.quantity}\n  Price: ${product.price} CZK\n  Category: ${product.category_name}\n  Cart ID: ${product.cart_item_id}`
).join('\n\n')}`;

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "remove_from_cart",
  {
    title: "Remove from Cart",
    description: "Remove an item from the shopping cart",
    inputSchema: {
      order_field_id: z.string().min(1, "Order field ID is required").describe("The order field ID of the item to remove (cart_item_id from cart content)")
    }
  },
  async ({ order_field_id }) => {
    try {
      const api = createRohlikAPI();
      const success = await api.removeFromCart(order_field_id);

      const output = success 
        ? `Successfully removed item with ID ${order_field_id} from cart.`
        : `Failed to remove item with ID ${order_field_id} from cart.`;

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_shopping_list",
  {
    title: "Get Shopping List",
    description: "Get a shopping list by ID",
    inputSchema: {
      shopping_list_id: z.string().min(1, "Shopping list ID is required").describe("The ID of the shopping list to retrieve")
    }
  },
  async ({ shopping_list_id }) => {
    try {
      const api = createRohlikAPI();
      const shoppingList = await api.getShoppingList(shopping_list_id);

      if (!shoppingList.products || shoppingList.products.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `Shopping list "${shoppingList.name}" is empty.`
            }
          ]
        };
      }

      const output = `Shopping List: ${shoppingList.name}
Total products: ${shoppingList.products.length}

Products:
${shoppingList.products.map((product, index) => 
  `${index + 1}. ${product.name || 'Unknown product'}`
).join('\n')}`;

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

server.registerTool(
  "get_account_data",
  {
    title: "Get Account Data",
    description: "Get comprehensive account information including delivery details, orders, announcements, cart, and more",
    inputSchema: {}
  },
  async () => {
    try {
      const api = createRohlikAPI();
      const accountData = await api.getAccountData();

      const formatSection = (title: string, data: any): string => {
        if (!data || (Array.isArray(data) && data.length === 0)) {
          return `${title}: No data available`;
        }
        if (typeof data === 'object') {
          return `${title}: ${JSON.stringify(data, null, 2)}`;
        }
        return `${title}: ${String(data)}`;
      };

      const sections: string[] = [];

      // Cart summary
      if (accountData.cart) {
        sections.push(`🛒 CART SUMMARY:
• Total items: ${accountData.cart.total_items}
• Total price: ${accountData.cart.total_price} CZK
• Can order: ${accountData.cart.can_make_order ? 'Yes' : 'No'}`);
      }

      // Delivery info
      if (accountData.delivery) {
        sections.push(formatSection("🚚 DELIVERY INFO", accountData.delivery));
      }

      // Next delivery slot
      if (accountData.next_delivery_slot) {
        sections.push(formatSection("⏰ NEXT DELIVERY SLOT", accountData.next_delivery_slot));
      }

      // Orders
      if (accountData.next_order) {
        sections.push(formatSection("📦 UPCOMING ORDER", accountData.next_order));
      }
      
      if (accountData.last_order) {
        sections.push(formatSection("📋 LAST ORDER", accountData.last_order));
      }

      // Premium profile
      if (accountData.premium_profile) {
        sections.push(formatSection("⭐ PREMIUM PROFILE", accountData.premium_profile));
      }

      // Announcements
      if (accountData.announcements) {
        sections.push(formatSection("📢 ANNOUNCEMENTS", accountData.announcements));
      }

      // Reusable bags
      if (accountData.bags) {
        sections.push(formatSection("♻️ REUSABLE BAGS", accountData.bags));
      }

      const output = sections.length > 0 
        ? sections.join('\n\n') 
        : 'No account data available';

      return {
        content: [
          {
            type: "text",
            text: output
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : String(error)
          }
        ],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rohlik MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});