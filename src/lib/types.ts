export interface Network {
  name: string;
  morphoChainId: number;
  aaveMarketFilter: (m: AaveMarket) => boolean;
  llamaChain: string;
  aaveMarketName: string;
  morphoApp: string;
  usdcAddress: string;
  preferredVault?: string;
}

export interface CollateralAsset {
  name: string;
  type: string;
  pct: string;
  width: number;
  color: string;
  url: string | null;
}

export interface VaultEntry {
  name: string;
  address: string;
  url: string;
  apy: string;
  badge: string;
  curator: string;
  curatorImage: string;
  collateral: CollateralAsset[];
  totalAssetsUsd: number;
  assetSymbol: string;
}

export interface CuratorMeta {
  name: string;
  image: string;
  id: string;
  addresses: Set<string>;
}

export interface CuratorGroup {
  name: string;
  vaults: VaultEntry[];
  image: string;
}

export interface AaveReserve {
  symbol: string;
  name: string;
  address: string;
  pct: number;
}

export type YieldDuration = "instant" | "7d" | "30d" | "90d";

export interface AssetMetaEntry {
  display: string;
  name: string;
  color: string;
}

export interface AaveMarket {
  name?: string;
  chainId?: number;
  totalMarketSize?: number;
  supplyReserves?: {
    underlyingToken: {
      symbol: string;
      name?: string;
      address?: string;
    };
    supplyRate?: number;
    size?: { usdValue: number };
  }[];
}

export interface CuratorRaw {
  name: string;
  image?: string;
  id?: string;
  addresses?: Record<string, string[]>;
}
