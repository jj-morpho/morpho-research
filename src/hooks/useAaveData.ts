"use client";

import { useState, useCallback } from "react";
import { fetchAaveRate, fetchAaveCollateral, fetchAaveHistoricalApy, clearLlamaCache } from "@/lib/api";
import type { AaveReserve, YieldDuration } from "@/lib/types";
import { DURATION_OPTIONS } from "@/lib/constants";

export function useAaveData() {
  const [apy, setApy] = useState("\u2013");
  const [reserves, setReserves] = useState<AaveReserve[] | null>(null);

  const loadAaveData = useCallback(async (chainId: number, duration: YieldDuration = "instant") => {
    clearLlamaCache();

    const days = DURATION_OPTIONS.find((d) => d.key === duration)?.days ?? 0;

    const [rate, collateral] = await Promise.all([
      days > 0
        ? fetchAaveHistoricalApy(chainId, days).catch((e) => {
            console.warn("[Aave historical rate]", e);
            return null;
          })
        : fetchAaveRate(chainId).catch((e) => {
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
