# Rohlik MCP Server

A Model Context Protocol (MCP) server that enables AI assistants to interact with Rohlik.cz, the Czech Republic's leading online grocery delivery service. This server provides tools for searching products, managing shopping carts, and accessing shopping lists.

> [!WARNING]
> This MCP server is made by reverse engineering Rohlik.cz API that is used by the rohlik.cz website. Use this at your own risk.

## Usage

### Claude Desktop Configuration

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

Add this to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "rohlik": {
      "command": "npx",
      "args": ["-y", "@tomaspavlin/rohlik-mcp"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password"
      }
    }
  }
}
```

## Tools

- `search_products` - Search for grocery products by name with filtering options
- `add_to_cart` - Add multiple products to your shopping cart
- `get_cart_content` - View current cart contents and totals
- `remove_from_cart` - Remove items from your shopping cart
- `get_shopping_list` - Retrieve shopping lists by ID

## Development

### Installation

```bash
npm install
npm run build
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Launch the production server
- `npm run dev` - Start development mode with watch
- `npm run inspect` - Test with MCP Inspector

## Testing

### Testing with Claude Desktop

Add this to configuration:

```json
{
  "mcpServers": {
    "rohlik-local": {
      "command": "node",
      "args": ["/path/to/rohlik-mcp/dist/index.js"],
      "env": {
        "ROHLIK_USERNAME": "your-email@example.com",
        "ROHLIK_PASSWORD": "your-password"
      }
    }
  }
}
```

### Testing with MCP Inspector

You can test the MCP server using the official MCP Inspector (https://modelcontextprotocol.io/legacy/tools/inspector):

```bash
npm run inspect
```

In the Inspector, set the ROHLIK_USERNAME and ROHLIK_PASSWORD envs.

### Publishing as NPM package

1. Update version in package.json
2. `npm publish`

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- https://github.com/dvejsada/HA-RohlikCZ for reverse engineering the Rohlik.cz API
