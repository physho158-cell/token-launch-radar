# Token Launch Radar v2

[![Competition](https://make.fun/badge/token-radar-01.svg)](https://make.fun/bounty/token-radar-01)
[![Rank](https://make.fun/badge/token-radar-01/physho158-cell/token-launch-radar/rank.svg)](https://make.fun/bounty/token-radar-01)
[![Reward](https://make.fun/badge/token-radar-01/physho158-cell/token-launch-radar/reward.svg)](https://make.fun/bounty/token-radar-01)

A category-weighted protocol scoring model that ranks pre-token DeFi protocols by their implied launch value.

## Model
Uses observed mcap/TVL ratios from tokenized comparables. Combines category multiple, growth weighting, multi-chain bonus, and maturity factor.

## Dashboard
Interactive dark-theme page with ranking table, filters, search, and farm plan detail panel.

## Usage
```bash
node main.ts --input /input/snapshot.json --output /output
```

## License
MIT
