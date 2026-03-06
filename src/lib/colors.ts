import type { AssetMetaEntry } from "./types";

export const ASSET_META: Record<string, AssetMetaEntry> = {
  CBBTC: { display: "cbBTC", name: "Coinbase BTC", color: "#f59e0b" },
  WBTC: { display: "WBTC", name: "Wrapped BTC", color: "#f97316" },
  WSTETH: { display: "wstETH", name: "Lido Staked ETH", color: "#3b82f6" },
  WETH: { display: "WETH", name: "Wrapped ETH", color: "#6366f1" },
  WEETH: { display: "weETH", name: "EtherFi Restaked ETH", color: "#818cf8" },
  USDT: { display: "USDT", name: "Tether", color: "#22c55e" },
  DAI: { display: "DAI", name: "MakerDAO", color: "#f59e0b" },
  USDC: { display: "USDC", name: "USD Coin", color: "#2563eb" },
  SDAI: { display: "sDAI", name: "Savings DAI", color: "#f59e0b" },
  TBTC: { display: "tBTC", name: "Threshold BTC", color: "#e11d48" },
  SUSDE: { display: "sUSDe", name: "Staked Ethena USDe", color: "#ec4899" },
  USDE: { display: "USDe", name: "Ethena Synthetic", color: "#ec4899" },
  RSETH: { display: "rsETH", name: "KelpDAO Restaked ETH", color: "#059669" },
  EZETH: { display: "ezETH", name: "Renzo Restaked ETH", color: "#06b6d4" },
  OSETH: { display: "osETH", name: "StakeWise ETH", color: "#8b5cf6" },
  RETH: { display: "rETH", name: "Rocket Pool ETH", color: "#06b6d4" },
  LBTC: { display: "LBTC", name: "Lombard BTC", color: "#f97316" },
  SFRAX: { display: "sFRAX", name: "Staked FRAX", color: "#f97316" },
  LINK: { display: "LINK", name: "Chainlink", color: "#2563eb" },
  AAVE: { display: "AAVE", name: "Aave Token", color: "#9333ea" },
  CRV: { display: "CRV", name: "Curve", color: "#ef4444" },
  CBETH: { display: "cbETH", name: "Coinbase Staked ETH", color: "#3b82f6" },
  GHO: { display: "GHO", name: "Aave Stablecoin", color: "#10b981" },
  LUSD: { display: "LUSD", name: "Liquity USD", color: "#6366f1" },
  ENS: { display: "ENS", name: "Ethereum Name Service", color: "#60a5fa" },
  SNX: { display: "SNX", name: "Synthetix", color: "#a78bfa" },
  MKR: { display: "MKR", name: "Maker", color: "#818cf8" },
  BAL: { display: "BAL", name: "Balancer", color: "#c084fc" },
  UNI: { display: "UNI", name: "Uniswap", color: "#ff007a" },
  USDS: { display: "USDS", name: "Sky Dollar", color: "#10b981" },
  LDO: { display: "LDO", name: "Lido DAO", color: "#00a3ff" },
  PYUSD: { display: "PYUSD", name: "PayPal USD", color: "#0070e0" },
  CRVUSD: { display: "crvUSD", name: "Curve USD", color: "#ef4444" },
  RPL: { display: "RPL", name: "Rocket Pool", color: "#f97316" },
  ETHX: { display: "ETHx", name: "Stader ETHx", color: "#3b82f6" },
  FRAX: { display: "FRAX", name: "Frax", color: "#1d1d1f" },
  EUSDE: { display: "eUSDe", name: "Ethena eUSDe", color: "#ec4899" },
  EBTC: { display: "eBTC", name: "ether.fi BTC", color: "#7c3aed" },
  FBTC: { display: "FBTC", name: "Fire Bitcoin", color: "#f97316" },
  EURC: { display: "EURC", name: "Euro Coin", color: "#2563eb" },
  KNC: { display: "KNC", name: "Kyber Network", color: "#31cb9e" },
  "1INCH": { display: "1INCH", name: "1inch", color: "#94a3b8" },
  STG: { display: "STG", name: "Stargate", color: "#6366f1" },
  FXS: { display: "FXS", name: "Frax Share", color: "#1d1d1f" },
  TETH: { display: "tETH", name: "Treehouse ETH", color: "#059669" },
  RLUSD: { display: "RLUSD", name: "Ripple USD", color: "#2563eb" },
  XAUT: { display: "XAUt", name: "Tether Gold", color: "#f59e0b" },
  USDTB: { display: "USDtb", name: "Ethena USDtb", color: "#ec4899" },
  MUSD: { display: "mUSD", name: "Mountain USD", color: "#059669" },
  USDG: { display: "USDG", name: "Global Dollar", color: "#6366f1" },
  SYRUPUSDT: {
    display: "syrupUSDT",
    name: "Maple syrupUSDT",
    color: "#22c55e",
  },
  SYRUPUSDC: {
    display: "syrupUSDC",
    name: "Maple syrupUSDC",
    color: "#22c55e",
  },
  SDEUSD: { display: "sdeUSD", name: "Elixir sdeUSD", color: "#7c3aed" },
  "MF-ONE": { display: "mF-ONE", name: "Midas Fasanara", color: "#0ea5e9" },
  MFONE: { display: "mF-ONE", name: "Midas Fasanara", color: "#0ea5e9" },
  MTBILL: { display: "mTBILL", name: "Midas T-Bills", color: "#0284c7" },
  WEETHS: {
    display: "weETHs",
    name: "EtherFi Staked weETH",
    color: "#818cf8",
  },
  "USUALUSDC++": {
    display: "USUALUSDC++",
    name: "Usual USDC++",
    color: "#6366f1",
  },
};

const COLOR_PALETTE = [
  "#6366f1", "#818cf8", "#3b82f6", "#06b6d4", "#0ea5e9", "#10b981",
  "#22c55e", "#f59e0b", "#f97316", "#ef4444", "#ec4899", "#8b5cf6",
  "#7c3aed", "#059669", "#e11d48", "#2563eb",
];

function hashColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

export function getAssetMeta(symbol: string): AssetMetaEntry {
  const key = (symbol || "").toUpperCase();
  if (ASSET_META[key]) return ASSET_META[key];

  // Pendle PT tokens: PT-XXX-DATE -> look up XXX
  const ptMatch = key.match(/^PT-([A-Z]+)/);
  if (ptMatch && ASSET_META[ptMatch[1]]) {
    const base = ASSET_META[ptMatch[1]];
    return { display: symbol, name: "Pendle PT " + base.display, color: base.color };
  }

  return { display: symbol, name: symbol, color: hashColor(key) };
}

export function getColor(symbol: string): string {
  return getAssetMeta(symbol).color;
}
