# 🔥 FIRE Calculator

A Financial Independence Retire Early (FIRE) calculator built with Hugo static site generator.

## Features

- **3 Scenario Comparison** - Compare different financial strategies side by side
- **Customizable Parameters** - Initial capital, returns, inflation, SIP, SWP, home loan
- **Emergency Expenses** - Add year-wise emergency expenses per scenario
- **Real-time Charts** - Visual comparison of capital growth over time
- **Inflation Adjusted** - All calculations show real (inflation-adjusted) values

## Getting Started

### Prerequisites

- [Hugo](https://gohugo.io/installation/) (extended version recommended)

### Development

```bash
# Navigate to project directory
cd fire

# Start development server
hugo server -D

# Open browser at http://localhost:1313
```

### Build for Production

```bash
# Build static files
hugo

# Output will be in the 'public' folder
```

## Deployment

### GitHub Pages

1. Push to GitHub
2. Go to Settings > Pages
3. Set source to GitHub Actions
4. Create `.github/workflows/hugo.yml` for automatic deployment

### Netlify / Vercel

Simply connect your repository and set:
- Build command: `hugo`
- Publish directory: `public`

## Project Structure

```
fire/
├── archetypes/          # Content templates
├── content/             # Markdown content
│   └── _index.md        # Homepage content
├── layouts/             # HTML templates
│   ├── _default/        # Base layouts
│   ├── partials/        # Reusable components
│   └── index.html       # Homepage layout
├── static/              # Static assets
│   ├── css/style.css    # Styles
│   └── js/calculator.js # Calculator logic
└── hugo.toml            # Hugo configuration
```

## License

MIT
