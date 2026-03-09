"use client";

import { useState, useCallback } from "react";
import { NETWORKS, DURATION_OPTIONS } from "@/lib/constants";
import {
  fetchAllMorphoVaults,
  fetchCuratorsListing,
  buildVaultEntry,
  buildCuratorAddresses,
  getCuratorMetaRaw,
  fetchMorphoHistoricalApy,
} from "@/lib/api";
import type { VaultEntry, CuratorGroup, YieldDuration } from "@/lib/types";

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

  const currentVault = vaults[currentVaultIndex] || vaults[0] || DEFAULT_VAULT;

  const loadVaults = useCallback(async (chainId: number, duration: YieldDuration = "instant") => {
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
        let entries = apiVaults
          .map((v) => buildVaultEntry(v, chainId))
          .filter((v) => v.curator !== "Uncurated" && v.totalAssetsUsd > 0 && v.assetSymbol === "USDC")
          .sort((a, b) => b.totalAssetsUsd - a.totalAssetsUsd);

        // Overlay historical APY if needed
        const days = DURATION_OPTIONS.find((d) => d.key === duration)?.days ?? 0;
        if (days > 0 && entries.length > 0) {
          const historicalApys = await Promise.all(
            entries.map((v) =>
              fetchMorphoHistoricalApy(v.address, chainId, days).catch(() => null),
            ),
          );
          entries = entries.map((v, i) => ({
            ...v,
            apy: historicalApys[i] != null ? historicalApys[i]!.toFixed(2) + "%" : v.apy,
          }));
        }

        if (entries.length > 0) {
          const preferred = NETWORKS[chainId]?.preferredVault;
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
  }, []);

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
    selectVault,
    getCurators,
  };
}
