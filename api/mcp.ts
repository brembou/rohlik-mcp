// api/mcp.ts
import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

/**
 * ZÁKLAD: jeden nástroj "ping", abychom ověřili, že endpoint /mcp žije.
 * Až to poběží, přidáme skutečné "rohlíkové" nástroje.
 */
const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ping",
      "Vrátí 'pong' pro otestování, že server běží.",
      z.object({}).strict(),
      async () => ({
        content: [{ type: "text", text: "pong" }],
      })
    );
  },
  // options (nech prázdné)
  {},
  // basePath – necháme prázdné, routování uděláme ve vercel.json
  { basePath: "" }
);

// Vercel potřebuje default export funkce/handleru
export default handler;
