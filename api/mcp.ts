import { z } from "zod";
import { createMcpHandler } from "mcp-handler";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "ping",
      "Vrátí 'pong' pro otestování, že server běží.",
      z.object({}).strict(),
      async () => ({ content: [{ type: "text", text: "pong" }] })
    );
  },
  {},
  { basePath: "" }
);

export default handler;
