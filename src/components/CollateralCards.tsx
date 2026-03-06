"use client";

import { NETWORKS } from "@/lib/constants";
import { getAssetMeta } from "@/lib/colors";
import type { VaultEntry, AaveReserve } from "@/lib/types";
import AllocationBar from "./AllocationBar";
import AssetList from "./AssetList";

interface CollateralCardsProps {
  chainId: number;
  morphoVault: VaultEntry;
  aaveReserves: AaveReserve[] | null;
  fading: boolean;
}

export default function CollateralCards({ chainId, morphoVault, aaveReserves, fading }: CollateralCardsProps) {
  const net = NETWORKS[chainId] || NETWORKS[1];

  // Aave bar segments
  const TOP_COUNT = 7;
  const aaveTop = aaveReserves?.slice(0, TOP_COUNT) || [];
  const aaveRest = aaveReserves?.slice(TOP_COUNT) || [];
  const othersWidth = aaveRest.reduce((s, r) => s + r.pct, 0);

  const aaveBarSegments = [
    ...aaveTop.map((r) => ({ width: r.pct, color: getAssetMeta(r.symbol).color })),
    ...(othersWidth > 0 ? [{ width: othersWidth, color: "#c7c7cc" }] : []),
  ];

  const aaveAssets = (aaveReserves || []).map((r) => {
    const meta = getAssetMeta(r.symbol);
    return {
      name: meta.display,
      type: meta.name,
      pct: r.pct < 0.1 ? "<0.1%" : r.pct.toFixed(1) + "%",
      color: meta.color,
      url: r.address
        ? `https://app.aave.com/reserve-overview/?underlyingAsset=${r.address}&marketName=${net.aaveMarketName}`
        : null,
    };
  });

  return (
    <div className="collateral-row">
      {/* Morpho collateral */}
      <div className="collateral-card morpho">
        <div className={`morpho-collateral-inner${fading ? " fading" : ""}`}>
          <div className="card-header">
            <h3>{morphoVault.name}</h3>
            <span className="badge">{morphoVault.badge}</span>
          </div>
          <AllocationBar segments={morphoVault.collateral.map((c) => ({ width: c.width, color: c.color }))} />
          <AssetList assets={morphoVault.collateral} />
        </div>
      </div>

      {/* Aave collateral */}
      <div className="collateral-card aave">
        <div className="card-header">
          <h3>Aave V3</h3>
          <span className="badge">
            {aaveReserves ? `${aaveReserves.length} assets \u00b7 Shared pool` : "Loading\u2026"}
          </span>
        </div>
        <AllocationBar segments={aaveBarSegments} />
        <AssetList assets={aaveAssets} />
      </div>
    </div>
  );
}
