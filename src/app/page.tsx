"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DEFAULT_CHAIN_ID, NETWORKS } from "@/lib/constants";
import { buildCuratorAddresses } from "@/lib/api";
import { useMorphoVaults } from "@/hooks/useMorphoVaults";
import { useAaveData } from "@/hooks/useAaveData";
import NetworkSelector from "@/components/NetworkSelector";
import YieldCards from "@/components/YieldCards";
import CollateralCards from "@/components/CollateralCards";
import Footer from "@/components/Footer";

export default function Home() {
  const [chainId, setChainId] = useState(DEFAULT_CHAIN_ID);
  const [statusColor, setStatusColor] = useState("#aeaeb2");
  const [statusText, setStatusText] = useState("Loading live data\u2026");
  const [fading, setFading] = useState(false);
  const prevVaultRef = useRef(-1);

  const { vaults, currentVault, currentVaultIndex, allLoaded, loadVaults, selectVault, getCurators } =
    useMorphoVaults();
  const { apy: aaveApy, reserves: aaveReserves, loadAaveData, resetAave } = useAaveData();

  const fetchLiveData = useCallback(
    async (cid: number) => {
      const [morphoOk, aaveResult] = await Promise.all([
        loadVaults(cid).catch((e) => {
          console.warn("[Morpho vaults]", e);
          return false;
        }),
        loadAaveData(cid).catch((e) => {
          console.warn("[Aave]", e);
          return { rateOk: false, collateralOk: false };
        }),
      ]);

      const aaveOk = typeof aaveResult === "object" && (aaveResult.rateOk || aaveResult.collateralOk);

      if (morphoOk && aaveOk) {
        setStatusColor("#22c55e");
        setStatusText("Live data \u00b7 Updated just now");
      } else if (morphoOk || aaveOk) {
        setStatusColor("#f59e0b");
        setStatusText("Partial live data \u00b7 Some sources unavailable");
      } else {
        setStatusColor("#aeaeb2");
        setStatusText("Using cached data \u00b7 APIs unavailable");
      }
    },
    [loadVaults, loadAaveData]
  );

  // Initial load
  useEffect(() => {
    fetchLiveData(chainId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNetworkSwitch = useCallback(
    async (newChainId: number) => {
      if (newChainId === chainId) return;
      setChainId(newChainId);
      resetAave();
      setStatusColor("#aeaeb2");
      setStatusText("Loading live data\u2026");
      buildCuratorAddresses(newChainId);
      await fetchLiveData(newChainId);
    },
    [chainId, resetAave, fetchLiveData]
  );

  const handleSelectVault = useCallback(
    (index: number) => {
      if (index === currentVaultIndex) return;
      prevVaultRef.current = currentVaultIndex;
      setFading(true);
      setTimeout(() => {
        selectVault(index);
        setFading(false);
      }, 200);
    },
    [currentVaultIndex, selectVault]
  );

  return (
    <>
      {/* Header */}
      <div className="hero">
        <div className="hero-inner">
          <h1>Know Your Risk</h1>
          <p className="hero-sub">
            A side-by-side comparison of yield &amp; collateral backing between select Morpho Vaults &amp; Aave V3.
          </p>
        </div>
      </div>

      <div className="container">
        {/* Section 1: Supply Yield */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Supply Yield</span>
            <NetworkSelector currentChainId={chainId} onSwitch={handleNetworkSwitch} />
          </div>
          <YieldCards
            chainId={chainId}
            morphoVault={currentVault}
            morphoVaults={vaults}
            currentVaultIndex={currentVaultIndex}
            getCurators={getCurators}
            onSelectVault={handleSelectVault}
            aaveApy={aaveApy}
          />
        </div>

        {/* Section 2: Collateral Backing */}
        <div className="section">
          <div className="section-header">
            <span className="section-title">Collateral Backing</span>
          </div>
          <CollateralCards
            chainId={chainId}
            morphoVault={currentVault}
            aaveReserves={aaveReserves}
            fading={fading}
          />
        </div>
      </div>

      <Footer statusColor={statusColor} statusText={statusText} />
    </>
  );
}
