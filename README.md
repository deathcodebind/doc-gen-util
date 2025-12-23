# 🧞‍♂️ DocGenie: The API Documentation Architect

DocGenie is a high-performance documentation engine that transforms structured text and JSON into interactive, professional API references. Designed for modern engineering teams, it bridges the gap between raw technical specifications and stakeholder-ready interactive documentation.

## 🚀 Core Features

- **Interactive Designer**: A side-by-side workspace featuring a visual form builder and a live-synced raw JSON editor.
- **Standalone Export**: Generate a single `.html` file that is completely self-contained. It includes the interactive UI, persona switching logic, and custom type tooltips—perfect for hosting on static sites (GitHub Pages, S3) or sharing offline.
- **Perspective Simulation**: Test your documentation's security! Switch between different "Viewing Personas" (e.g., Guest, Admin, Moderator) to see exactly which properties and authentication methods are visible to them.
- **AI-Powered "Magic Polish"**: Leveraging Google Gemini, DocGenie can instantly transform rough technical notes into professional, clear, and technically accurate prose.
- **Type Cross-Linking**: Automatic detection of custom types in endpoint arguments and responses. Click any type to jump to its definition or hover for an instant preview tooltip.

## 📝 Technical Syntax

### 1. Hierarchical Descriptions
DocGenie supports two formats for the Summary and Endpoint descriptions, switchable via the toggle in the "API Basics" section.

**DocGenie Lists (Default):**
- `-` Level 1 Item (Solid Bullet)
- `--` Level 2 Item (Hollow Circle)
- `---` Level 3 Item (Small Square)
- `1.`, `1.1.` Standard numeric nesting is also supported.

**Markdown:**
Standard CommonMark support for `**bold**`, `*italic*`, and `` `code` ``.

### 2. Custom Type Definitions
Define objects using a concise, role-aware syntax:

```typescript
{ 
  id: string, 
  handle: string, 
  email?: string,              // Optional property (marked with ?)
  api_key(Admin): string       // Restricted property: Only visible to 'Admin' persona
}
```

## 📂 Examples
Explore pre-configured templates in the `examples/` directory:
- `ecommerce-api.json`: A standard retail API with Customer and Admin roles.
- `iot-device-api.json`: A hardware-focused API for managing smart sensors.
- `social-graph.json`: Complex relations and moderation roles.

## 🛠 Usage
1. **Design**: Use the left pane to build your Types and Endpoints.
2. **Link**: Type the name of a Custom Type (case-sensitive) in an endpoint's `Args` or `Response` field to auto-link.
3. **Perspectives**: Define roles in your Custom Types, then use the sidebar in the Preview pane to simulate different user experiences.
4. **Export**: Click "Export HTML" to get your production-ready, interactive documentation file.

---
*Built with React 19, Tailwind CSS, and the Google Gemini SDK.*
