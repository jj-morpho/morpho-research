"use client";

import { useState, useCallback, useRef } from "react";
import { NETWORKS } from "@/lib/constants";
import {
  fetchAllMorphoVaults,
  fetchCuratorsListing,
  buildVaultEntry,
  buildCuratorAddresses,
  getCuratorMetaRaw,
} from "@/lib/api";
import type { VaultEntry, CuratorGroup, YieldDuration, AssetSymbol } from "@/lib/types";

const DEFAULT_VAULT: VaultEntry = {
  name: "Steakhouse USDC",
  address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
  url: "https://app.morpho.org/ethereum/vault/0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB/steakhouse-usdc",
  apy: "\u2013",
  badge: "Loading\u2026",
  curator: "Steakhouse Financial",
  curatorImage: "https://cdn.morpho.org/v2/assets/images/steakhouse.svg",
  collateral: [],
  totalAssetsUsd: 0,
  assetSymbol: "USDC",
};

export function useMorphoVaults() {
  const [vaults, setVaults] = useState<VaultEntry[]>([DEFAULT_VAULT]);
  const [currentVaultIndex, setCurrentVaultIndex] = useState(0);
  const [allLoaded, setAllLoaded] = useState(false);

  // Cache raw API vault data so duration switches don't need to re-fetch
  const rawCacheRef = useRef<{ chainId: number; data: unknown[] } | null>(null);

  const currentVault = vaults[currentVaultIndex] || vaults[0] || DEFAULT_VAULT;

  const buildEntries = useCallback((apiVaults: unknown[], chainId: number, duration: YieldDuration, asset: AssetSymbol = "USDC") => {
    return apiVaults
      .map((v) => buildVaultEntry(v, chainId, duration))
      .filter((v) => v.curator !== "Uncurated" && v.totalAssetsUsd > 0 && v.assetSymbol === asset)
      .sort((a, b) => b.totalAssetsUsd - a.totalAssetsUsd);
  }, []);

  const loadVaults = useCallback(async (chainId: number, duration: YieldDuration = "instant", asset: AssetSymbol = "USDC") => {
    try {
      const fetches: Promise<unknown>[] = [fetchAllMorphoVaults(chainId)];
      if (getCuratorMetaRaw().length === 0) {
        fetches.push(fetchCuratorsListing().catch((e) => console.warn("[Curator listing]", e)));
      }

      const results = await Promise.all(fetches);
      // Build curator addresses AFTER curators are fetched so vaults get proper curator labels
      buildCuratorAddresses(chainId);
      const apiVaults = results[0] as unknown[];

      if (apiVaults?.length > 0) {
        // Cache the raw data for instant duration rebuilds
        rawCacheRef.current = { chainId, data: apiVaults };

        const entries = buildEntries(apiVaults, chainId, duration, asset);

        if (entries.length > 0) {
          const preferred = NETWORKS[chainId]?.preferredVaults?.[asset];
          const preferredIdx = preferred
            ? entries.findIndex((v) => v.address.toLowerCase() === preferred.toLowerCase())
            : -1;

          setVaults(entries);
          setCurrentVaultIndex(preferredIdx >= 0 ? preferredIdx : 0);
          setAllLoaded(true);
          return true;
        } else {
          setVaults([]);
          setAllLoaded(true);
          return false;
        }
      }
    } catch (e) {
      console.warn("[Load all vaults]", e);
    }
    return false;
  }, [buildEntries]);

  // Rebuild vault entries from cache — no API call needed
  const rebuildFromCache = useCallback((duration: YieldDuration, asset: AssetSymbol) => {
    const cache = rawCacheRef.current;
    if (!cache) return;
    const entries = buildEntries(cache.data, cache.chainId, duration, asset);
    // Preserve current vault selection by address if possible
    const currentAddr = vaults[currentVaultIndex]?.address;
    const preferred = NETWORKS[cache.chainId]?.preferredVaults?.[asset];

    setVaults(entries.length > 0 ? entries : []);
    setAllLoaded(true);

    if (entries.length > 0) {
      const addrIdx = currentAddr ? entries.findIndex((v) => v.address === currentAddr) : -1;
      const prefIdx = preferred ? entries.findIndex((v) => v.address.toLowerCase() === preferred.toLowerCase()) : -1;
      setCurrentVaultIndex(addrIdx >= 0 ? addrIdx : prefIdx >= 0 ? prefIdx : 0);
    } else {
      setCurrentVaultIndex(0);
    }
  }, [buildEntries, vaults, currentVaultIndex]);

  const selectVault = useCallback((index: number) => {
    setCurrentVaultIndex(index);
  }, []);

  const getCurators = useCallback((): CuratorGroup[] => {
    const seen: Record<string, { vaults: VaultEntry[]; image: string }> = {};
    vaults.forEach((v) => {
      if (!seen[v.curator]) seen[v.curator] = { vaults: [], image: v.curatorImage || "" };
      seen[v.curator].vaults.push(v);
    });
    return Object.keys(seen)
      .sort()
      .map((name) => ({ name, vaults: seen[name].vaults, image: seen[name].image }));
  }, [vaults]);

  return {
    vaults,
    currentVault,
    currentVaultIndex,
    allLoaded,
    loadVaults,
    rebuildFromCache,
    selectVault,
    getCurators,
  };
}
