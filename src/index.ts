#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RohlikAPI } from "./rohlik-api.js";
import { createSearchProductsTool } from "./tools/search-products.js";
import { createCartManagementTools } from "./tools/cart-management.js";
import { createShoppingListsTool } from "./tools/shopping-lists.js";
import { createAccountDataTool } from "./tools/account-data.js";

const server = new McpServer(
  {
    name: "rohlik-mcp",
    version: "1.0.0",
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

// Register all tools
const searchProducts = createSearchProductsTool(createRohlikAPI);
const cartTools = createCartManagementTools(createRohlikAPI);
const shoppingLists = createShoppingListsTool(createRohlikAPI);
const accountData = createAccountDataTool(createRohlikAPI);

server.registerTool(searchProducts.name, searchProducts.definition, searchProducts.handler);
server.registerTool(cartTools.addToCart.name, cartTools.addToCart.definition, cartTools.addToCart.handler);
server.registerTool(cartTools.getCartContent.name, cartTools.getCartContent.definition, cartTools.getCartContent.handler);
server.registerTool(cartTools.removeFromCart.name, cartTools.removeFromCart.definition, cartTools.removeFromCart.handler);
server.registerTool(shoppingLists.name, shoppingLists.definition, shoppingLists.handler);
server.registerTool(accountData.name, accountData.definition, accountData.handler);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Rohlik MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});