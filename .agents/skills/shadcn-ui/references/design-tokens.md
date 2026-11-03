# shadcn/ui Design Tokens & Themes Reference

## Curated Color Palettes (Zinc / Slate / Neutral / Emerald)

### 1. Zinc Dark Palette (Recommended Default)
```css
:root {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 6%;
  --card-foreground: 0 0% 98%;
  --popover: 240 10% 6%;
  --popover-foreground: 0 0% 98%;
  --primary: 142.1 76.2% 42%;     /* Emerald accent */
  --primary-foreground: 144.9 80% 10%;
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 240 3.7% 15.9%;
  --muted-foreground: 240 5% 64.9%;
  --accent: 240 3.7% 18%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 3.7% 15.9%;
  --input: 240 3.7% 15.9%;
  --ring: 142.1 76.2% 42%;
  --radius: 0.5rem;
}
```

### 2. Typography
- **Primary Font**: `Inter`, `Geist Sans`, or system font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`).
- **Mono Font**: `JetBrains Mono`, `Fira Code`, or `ui-monospace`.

### 3. Glassmorphism & Shadow Guidelines
- Backgrounds: `background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px);`
- Borders: `1px solid rgba(255, 255, 255, 0.08)`
- Shadows:
  - Subtle: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
  - Elevated: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
  - Modal: `0 20px 25px -5px rgb(0 0 0 / 0.3), 0 8px 10px -6px rgb(0 0 0 / 0.3)`
