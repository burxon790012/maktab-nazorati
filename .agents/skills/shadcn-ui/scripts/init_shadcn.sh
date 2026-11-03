#!/usr/bin/env bash
# Quick script to initialize shadcn/ui in a React / Next / Vite project

set -e

echo "🎨 Initializing shadcn/ui..."
npx -y shadcn@latest init

echo "📦 Installing core components..."
npx -y shadcn@latest add button card dialog input label badge table select tabs dropdown-menu avatar separator sheet

echo "✅ shadcn/ui setup completed successfully!"
