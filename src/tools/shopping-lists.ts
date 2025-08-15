import { z } from "zod";
import { RohlikAPI } from "../rohlik-api.js";

export function createShoppingListsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_shopping_list",
    definition: {
      title: "Get Shopping List",
      description: "Get a shopping list by ID",
      inputSchema: {
        shopping_list_id: z.string().min(1, "Shopping list ID is required").describe("The ID of the shopping list to retrieve")
      }
    },
    handler: async ({ shopping_list_id }: { shopping_list_id: string }) => {
      try {
        const api = createRohlikAPI();
        const shoppingList = await api.getShoppingList(shopping_list_id);

        if (!shoppingList.products || shoppingList.products.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
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