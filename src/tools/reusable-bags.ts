import { RohlikAPI } from "../rohlik-api.js";

export function createReusableBagsTool(createRohlikAPI: () => RohlikAPI) {
  return {
    name: "get_reusable_bags_info",
    definition: {
      title: "Get Reusable Bags Info",
      description: "Get information about your reusable bags and environmental impact",
      inputSchema: {}
    },
    handler: async () => {
      try {
        const api = createRohlikAPI();
        const bagsInfo = await api.getReusableBagsInfo();

        if (!bagsInfo) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No reusable bags information available."
              }
            ]
          };
        }

        const formatBagsInfo = (data: any): string => {
          const sections: string[] = [];
          
          // Bag count
          if (data.totalBags !== undefined) {
            sections.push(`♻️ TOTAL REUSABLE BAGS: ${data.totalBags}`);
          }

          // Available bags
          if (data.availableBags !== undefined) {
            sections.push(`📦 AVAILABLE BAGS: ${data.availableBags}`);
          }

          // Bags in use
          if (data.bagsInUse !== undefined) {
            sections.push(`🛍️ BAGS IN USE: ${data.bagsInUse}`);
          }

          // Environmental impact
          if (data.plasticSaved !== undefined) {
            sections.push(`🌍 PLASTIC SAVED: ${data.plasticSaved}g`);
          }

          if (data.co2Saved !== undefined) {
            sections.push(`🌱 CO2 SAVED: ${data.co2Saved}g`);
          }

          // Bag history
          if (data.bagHistory && Array.isArray(data.bagHistory)) {
            sections.push(`📋 BAG HISTORY:
${data.bagHistory.map((entry: any, index: number) => 
  `   ${index + 1}. ${entry.date || 'Unknown date'}: ${entry.action || 'Unknown action'} (${entry.count || 1} bags)`
).join('\n')}`);
          }

          // If no structured data, show raw JSON
          if (sections.length === 0) {
            sections.push(`♻️ REUSABLE BAGS INFO:\n${JSON.stringify(data, null, 2)}`);
          }

          return sections.join('\n\n');
        };

        const output = formatBagsInfo(bagsInfo);

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