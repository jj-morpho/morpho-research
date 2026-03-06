"use client";

import { useState, useCallback } from "react";
import { fetchAaveRate, fetchAaveCollateral, clearLlamaCache } from "@/lib/api";
import type { AaveReserve } from "@/lib/types";

export function useAaveData() {
  const [apy, setApy] = useState("\u2013");
  const [reserves, setReserves] = useState<AaveReserve[] | null>(null);

  const loadAaveData = useCallback(async (chainId: number) => {
    clearLlamaCache();

    const [rate, collateral] = await Promise.all([
      fetchAaveRate(chainId).catch((e) => {
        console.warn("[Aave rate]", e);
        return null;
      }),
      fetchAaveCollateral(chainId).catch((e) => {
        console.warn("[Aave collateral]", e);
        return null;
      }),
    ]);

    if (rate != null) {
      setApy(rate.toFixed(2) + "%");
    }

    if (collateral) {
      setReserves(collateral);
    }

    return { rateOk: rate != null, collateralOk: collateral != null };
  }, []);

  const resetAave = useCallback(() => {
    setApy("\u2013");
  }, []);

  return { apy, reserves, loadAaveData, resetAave };
}
