# Signal Forge

Signal Forge is now a GitHub Pages-friendly static market terminal.

## What the live site does

- Tracks a wide browser-side market universe of US stocks and ETFs
- Scores bullish, bearish, and neutral setups from intraday-style pattern data
- Generates AI-style market direction copy and per-symbol trade plans
- Lets you filter a screener, inspect detail charts, and save watchlists locally

## Files that power the site

- [index.html](./index.html)
- [styles/site.css](./styles/site.css)
- [scripts/market-engine.js](./scripts/market-engine.js)
- [scripts/app.js](./scripts/app.js)

## Deployment

This version is designed to work directly on GitHub Pages with no server runtime.

If you push the repo with the new root `index.html`, Pages will serve the market site instead of rendering the README.

## Notes

- The current market model runs entirely in the browser so the site works on static hosting.
- Watchlists are saved in `localStorage`.
- The market forecasts are probabilistic, not guarantees or brokerage advice.
