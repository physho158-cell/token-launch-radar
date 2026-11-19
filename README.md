# Token Launch Radar v2

A category-weighted protocol scoring model that ranks pre-token DeFi protocols by their implied launch value.

## Model

Uses observed mcap/TVL ratios from tokenized comparables in the DefiLlama snapshot to derive per-category valuation multiples. Combines:
- **Category multiple** (DEXs 3.5x, Lending 4.0x, RWA 3.0x, etc.)
- **Growth weighting** (7d TVL change ±clamped)
- **Multi-chain bonus** (+8% per chain beyond first)
- **Maturity factor** (newer protocols get upside premium)

## Dashboard

Interactive dark-theme page with:
- Protocol ranking table sorted by implied value
- Category and chain filters
- Search functionality
- Detail panel with farm plan steps

## Usage

```bash
node main.ts --input /input/snapshot.json --output /output
```

Built for [make.fun](https://make.fun/bounty/token-radar-01) competition.

## License

MIT
