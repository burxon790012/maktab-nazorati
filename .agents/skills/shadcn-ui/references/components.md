# shadcn/ui Component Catalog & Guidelines

## Component Matrix

Component | Primitive | Key Use Cases
:--- | :--- | :---
`Button` | Radix Slot | Action triggers, forms, nav links
`Card` | HTML div | Dashboard KPIs, content grouping, list items
`Dialog` | Radix Dialog | Modals, confirmation dialogs, creation forms
`Input` | HTML input | Text fields, searches, credentials
`Badge` | HTML span | Status indicators (PRESENT, OUTSIDE, LATE)
`Table` | HTML table | Data grids, attendance matrices, user lists
`Select` | Radix Select | Dropdowns, filters, school pickers
`Tabs` | Radix Tabs | Tabbed page sections, views
`Sonner` / `Toast` | Sonner | Real-time notifications, arrival alerts
`DropdownMenu` | Radix Dropdown | Actions menu, user profile switchers

## Rules for Component Integration
1. **Accessibility First**: Always retain `aria-label`, keyboard focus rings (`focus-visible:ring-2`), and clean focus states.
2. **Never hardcode hex values inside elements**: Always utilize CSS variables (`bg-primary`, `text-muted-foreground`, etc.).
3. **Keep components modular**: Do not bloat a single component with business logic; decouple UI presentation from API requests.
