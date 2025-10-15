// api/mcp.ts
import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

/**
 * ZÁKLAD: jeden nástroj "ping", aby šlo ověřit, že endpoint /mcp žije.
 * Až to poběží, doplníme "rohlíkové" funkce (nákup na Rohlik.cz atd.).
 */
const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ping",
      "Vrátí 'pong' pro otestování, že server běží.",
      z.object({}).strict(),
      async () => ({ content: [{ type: "text", text: "pong" }] })
    );
  },
  // options – nech prázdné
  {},
  // basePath – necháme prázdné, routování uděláme ve vercel.json
  { basePath: "" }
);

export default handler;
