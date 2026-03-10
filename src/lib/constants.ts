import type { Network, AssetSymbol } from "./types";

export const MORPHO_API = "https://api.morpho.org/graphql";
export const AAVE_API = "https://api.v3.aave.com/graphql";
export const CURATORS_URL =
  "https://raw.githubusercontent.com/morpho-org/morpho-blue-api-metadata/main/data/curators-listing.json";
export const LLAMA_POOLS_URL = "https://yields.llama.fi/pools";

export const NETWORKS: Record<number, Network> = {
  1: {
    name: "Ethereum",
    morphoChainId: 1,
    aaveMarketFilter: (m) => {
      const n = (m.name || "").toLowerCase();
      return (
        (m.chainId === 1 || n.includes("ethereum")) &&
        !n.includes("lido") &&
        !n.includes("etherfi") &&
        !n.includes("plasma")
      );
    },
    llamaChain: "Ethereum",
    aaveMarketName: "proto_mainnet_v3",
    morphoApp: "ethereum",
    assetAddresses: {
      USDC: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      USDT: "0xdac17f958d2ee523a2206206994597c13d831ec7",
    },
    preferredVaults: {
      USDC: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
      USDT: "0x8CB3649114051cA5119141a34C200D65dc0Faa73",
    },
  },
  8453: {
    name: "Base",
    morphoChainId: 8453,
    aaveMarketFilter: (m) => {
      const n = (m.name || "").toLowerCase();
      return n.includes("base") || m.chainId === 8453;
    },
    llamaChain: "Base",
    aaveMarketName: "proto_base_v3",
    morphoApp: "base",
    assetAddresses: {
      USDC: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
      USDT: "",
    },
    preferredVaults: {
      USDC: "0xBEEFE94c8aD530842bfE7d8B397938fFc1cb83b2",
    },
  },
  42161: {
    name: "Arbitrum",
    morphoChainId: 42161,
    aaveMarketFilter: (m) => {
      const n = (m.name || "").toLowerCase();
      return n.includes("arbitrum") || m.chainId === 42161;
    },
    llamaChain: "Arbitrum",
    aaveMarketName: "proto_arbitrum_v3",
    morphoApp: "arbitrum",
    assetAddresses: {
      USDC: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
      USDT: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    },
    preferredVaults: {
      USDC: "0x250CF7c82bAc7cB6cf899b6052979d4B5BA1f9ca",
    },
  },
  10: {
    name: "Optimism",
    morphoChainId: 10,
    aaveMarketFilter: (m) => {
      const n = (m.name || "").toLowerCase();
      return n.includes("optimism") || m.chainId === 10;
    },
    llamaChain: "Optimism",
    aaveMarketName: "proto_optimism_v3",
    morphoApp: "optimism",
    assetAddresses: {
      USDC: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      USDT: "0x94b008aa00579c1307b0ef2c499ad98a8ce58e58",
    },
  },
};

export const DEFAULT_CHAIN_ID = 1;
export const DEFAULT_ASSET: AssetSymbol = "USDC";

export const DURATION_OPTIONS: { key: import("./types").YieldDuration; label: string; days: number }[] = [
  { key: "instant", label: "Instant", days: 0 },
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
];

export const ASSET_OPTIONS: { key: AssetSymbol; label: string }[] = [
  { key: "USDC", label: "USDC" },
  { key: "USDT", label: "USDT" },
];

export const LLAMA_CHART_URL = "https://yields.llama.fi/chart";
