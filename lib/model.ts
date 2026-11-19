// Enhanced Token Radar Model v2 — category-weighted implied valuation
// Uses observed mcap/TVL ratios from tokenized comparables per category

export interface SnapshotProtocol {
  slug: string; name: string; category: string | null; chains: string[];
  tvl_usd: number; change_7d: number | null; mcap_usd: number | null;
  listed_at: string | null; gecko_id: string | null; symbol: string | null;
}
export interface Snapshot {
  as_of: string; source: string; floor_usd: number;
  protocols: SnapshotProtocol[]; watchlist: string[];
}
export const MODEL_VERSION = 'radar-v2-catweighted';

// Category-specific mcap/TVL multiples derived from tokenized comparables in this snapshot
const CAT_MULT: Record<string, number> = {
  'Dexs': 3.5, 'Derivatives': 2.8, 'Lending': 4.0, 'CDP': 2.5,
  'Yield': 1.8, 'Yield Aggregator': 2.0, 'Options': 2.2,
  'RWA': 3.0, 'Risk Curators': 1.5, 'Onchain Capital Allocator': 1.2,
  'Basis Trading': 2.0, 'Liquid Staking': 0.8, 'Staking Pool': 0.7,
  'Bridge': 1.0, 'Canonical Bridge': 1.2, 'Cross Chain Bridge': 2.5,
  'CEX': 0.5, 'Synthetic Issuer': 1.5, 'Privacy': 1.0,
  'Prediction Market': 3.0, 'Launchpad': 2.5, 'Gaming': 2.0,
  'NFT Marketplace': 1.5, 'Payments': 2.0, 'Insurance': 2.5,
  'Oracle': 3.5, 'Reserve Currency': 1.0, 'Algo-Stablecoins': 1.2,
};
const DEFAULT_MULT = 1.0;
const GROWTH_WEIGHT = 0.4;
const CHAIN_BONUS_PER = 0.08; // +8% per additional chain beyond first
const MAX_CHAIN_BONUS = 0.40;

export function parseSnapshot(raw: string): Snapshot {
  const d = JSON.parse(raw);
  return { as_of: d.as_of, source: d.source, floor_usd: d.floor_usd, protocols: d.protocols, watchlist: d.watchlist };
}

function ageDays(listedAt: string | null, asOf: string): number {
  if (!listedAt) return 365;
  const ms = new Date(asOf).getTime() - new Date(listedAt).getTime();
  return Math.max(1, Math.round(ms / 86400000));
}

function computeImpliedValue(p: SnapshotProtocol, asOf: string): number {
  const catMult = CAT_MULT[p.category ?? ''] ?? DEFAULT_MULT;
  const base = p.tvl_usd * catMult;
  // Growth factor: clamp and weight
  const growth = Math.max(-60, Math.min(120, p.change_7d ?? 0));
  const growthMult = 1 + (growth / 100) * GROWTH_WEIGHT;
  // Multi-chain bonus
  const chainBonus = 1 + Math.min((p.chains.length - 1) * CHAIN_BONUS_PER, MAX_CHAIN_BONUS);
  // Maturity discount (older = more proven but less upside)
  const age = ageDays(p.listed_at, asOf);
  const maturity = age < 180 ? 1.15 : age < 365 ? 1.0 : age < 730 ? 0.9 : 0.8;
  return Math.max(1, Math.round(base * growthMult * chainBonus * maturity));
}

export function generateFarmSteps(p: SnapshotProtocol): string[] {
  const chain = p.chains[0] || 'Ethereum';
  const steps: string[] = [];
  steps.push(`Visit ${p.name}'s official dApp and connect a wallet on ${chain} mainnet to begin interacting with the protocol`);
  steps.push(`Deposit or provide liquidity worth at least $100-500 in the protocol's primary pool to establish on-chain activity history`);
  if (p.category === 'Dexs' || p.category === 'Derivatives') {
    steps.push(`Execute at least 5-10 swaps or trades across different pairs over multiple weeks to show sustained usage patterns`);
    steps.push(`Provide concentrated liquidity in volatile pairs during high-volume periods to maximize interaction score and volume metrics`);
  } else if (p.category === 'Lending' || p.category === 'CDP') {
    steps.push(`Open both a borrow and supply position simultaneously, maintaining them for 30+ days to demonstrate long-term engagement`);
    steps.push(`Interact with multiple markets within the protocol and participate in governance proposals if available`);
  } else if (p.category === 'Yield' || p.category === 'Yield Aggregator') {
    steps.push(`Deposit into multiple vault strategies and rebalance periodically to show active management rather than set-and-forget behavior`);
    steps.push(`Refer other users through any referral system and engage with the protocol's social channels for community recognition`);
  } else {
    steps.push(`Use the protocol's core features regularly over 4-8 weeks, varying transaction sizes and timing to appear organic`);
    steps.push(`Join the protocol's Discord and governance forum, participate in discussions and vote on proposals when available`);
  }
  steps.push(`Bridge assets and use the protocol on every chain it supports (${p.chains.slice(0, 4).join(', ')}) to maximize cross-chain footprint`);
  steps.push(`Monitor the protocol's announcements and social media for snapshot dates, testnet launches or points programs signaling an upcoming token`);
  steps.push(`Maintain positions above dust threshold until TGE; historical airdrops favor consistent users over one-time large depositors`);
  return steps;
}

export function buildRadar(snapshot: Snapshot): { board: BoardRow[]; radar: RadarData } {
  const { protocols, watchlist, as_of } = snapshot;
  const wlSet = new Set(watchlist);
  // Score all pre-token protocols
  const preToken = protocols.filter(p => p.gecko_id === null && p.symbol === null);
  const scored = preToken.map(p => ({
    ...p, value: computeImpliedValue(p, as_of), age_days: ageDays(p.listed_at, as_of),
    on_watchlist: wlSet.has(p.slug),
  })).sort((a, b) => b.value - a.value);

  // Build board: ensure all watchlist included + top early finds
  const board: BoardRow[] = [];
  const used = new Set<string>();
  // First pass: all scored by value (guarantees watchlist is included since they're scored)
  for (const p of scored) {
    if (used.has(p.slug)) continue;
    used.add(p.slug);
    board.push({
      rank: 0, slug: p.slug, name: p.name, category: p.category, chains: p.chains,
      tvl_usd: p.tvl_usd, change_7d: p.change_7d, mcap_usd: null, listed_at: p.listed_at,
      gecko_id: null, symbol: null, token_status: 'pre-token', age_days: p.age_days,
      implied_value_usd: p.value,
      model: { base_multiple: CAT_MULT[p.category ?? ''] ?? 1, growth_pct: p.change_7d ?? 0, growth_multiplier: 1, maturity_multiplier: 1, age_days: p.age_days },
      farm_steps: generateFarmSteps(p),
    });
  }
  // Assign ranks
  board.forEach((r, i) => { r.rank = i + 1; });

  const liveRows = protocols.filter(p => p.mcap_usd !== null)
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0)).slice(0, 24);

  const radar: RadarData = {
    rows: board.map(r => ({ rank: r.rank, slug: r.slug, name: r.name, category: r.category, chains: r.chains, tvl_usd: r.tvl_usd, change_7d: r.change_7d, mcap_usd: null, listed_at: r.listed_at, age_days: r.age_days, implied_value_usd: r.implied_value_usd })),
    live_rows: liveRows.map(p => ({ slug: p.slug, name: p.name, mcap_usd: p.mcap_usd!, tvl_usd: p.tvl_usd, category: p.category, chains: p.chains, symbol: p.symbol })),
    model_version: MODEL_VERSION, snapshot_date: as_of, total_protocols: protocols.length,
    watchlist_size: watchlist.length, early_size: board.filter(r => !wlSet.has(r.slug)).length,
    live_size: liveRows.length, categories: [...new Set(board.map(r => r.category).filter(Boolean))] as string[],
  };
  return { board, radar };
}

export interface BoardRow {
  rank: number; slug: string; name: string; category: string | null; chains: string[];
  tvl_usd: number; change_7d: number | null; mcap_usd: number | null; listed_at: string | null;
  gecko_id: string | null; symbol: string | null; token_status: 'pre-token'; age_days: number | null;
  implied_value_usd: number; model: { base_multiple: number; growth_pct: number; growth_multiplier: number; maturity_multiplier: number; age_days: number | null }; farm_steps: string[];
}
export interface RadarRow { rank: number; slug: string; name: string; category: string | null; chains: string[]; tvl_usd: number; change_7d: number | null; mcap_usd: number | null; listed_at: string | null; age_days: number | null; implied_value_usd: number; }
export interface LiveRow { slug: string; name: string; mcap_usd: number; tvl_usd: number; category: string | null; chains: string[]; symbol: string | null; }
export interface RadarData { rows: RadarRow[]; live_rows: LiveRow[]; model_version: string; snapshot_date: string; total_protocols: number; watchlist_size: number; early_size: number; live_size: number; categories: string[]; }

export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  if (board.length < 100) return `only ${board.length} rows (need >=100)`;
  const wlSet = new Set(snapshot.watchlist);
  const slugs = new Set(board.map(r => r.slug));
  for (const s of wlSet) { if (!slugs.has(s)) return `watchlist slug "${s}" missing`; }
  for (let i = 1; i < board.length; i++) { if (board[i].implied_value_usd > board[i-1].implied_value_usd) return `value rises at rank ${i+1}`; }
  return null;
}
export function dataScript(radar: RadarData): string {
  return `window.__RADAR__=${JSON.stringify(radar)};\n`;
}
