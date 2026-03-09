"use client";

import { NETWORKS, DURATION_OPTIONS } from "@/lib/constants";
import type { VaultEntry, CuratorGroup, YieldDuration } from "@/lib/types";
import VaultSelector from "./VaultSelector";

interface YieldCardsProps {
  chainId: number;
  morphoVault: VaultEntry;
  morphoVaults: VaultEntry[];
  currentVaultIndex: number;
  getCurators: () => CuratorGroup[];
  onSelectVault: (index: number) => void;
  aaveApy: string;
  duration: YieldDuration;
}

export default function YieldCards({
  chainId,
  morphoVault,
  morphoVaults,
  currentVaultIndex,
  getCurators,
  onSelectVault,
  aaveApy,
  duration,
}: YieldCardsProps) {
  const net = NETWORKS[chainId] || NETWORKS[1];
  const aaveLink = `https://app.aave.com/reserve-overview/?underlyingAsset=${net.usdcAddress}&marketName=${net.aaveMarketName}`;
  const durationLabel = DURATION_OPTIONS.find((d) => d.key === duration)?.label;
  const apyLabel = duration === "instant" ? "APY" : `Avg ${durationLabel} APY`;

  return (
    <div className="yield-row">
      {/* Morpho card */}
      <div className="yield-card morpho">
        <VaultSelector
          vaults={morphoVaults}
          currentVaultIndex={currentVaultIndex}
          getCurators={getCurators}
          onSelectVault={onSelectVault}
        />
        <a className="morpho-link" href={morphoVault.url} target="_blank" rel="noopener">
          <div className="protocol-name">
            Morpho <span className="chain-badge">{net.name}</span>
          </div>
          <div className="vault-label">{morphoVault.name}</div>
          <div className="apy">{morphoVault.apy}</div>
          <div className="apy-label">{apyLabel}</div>
        </a>
      </div>

      {/* Aave card */}
      <div className="yield-card aave">
        <div style={{ flex: 1 }}></div>
        <a href={aaveLink} style={{ textDecoration: "none", color: "inherit", display: "block" }} target="_blank" rel="noopener">
          <div className="protocol-name">
            Aave V3 <span className="chain-badge">{net.name}</span>
          </div>
          <div className="vault-label">USDC Market</div>
          <div className="apy">{aaveApy}</div>
          <div className="apy-label">{apyLabel}</div>
        </a>
      </div>
    </div>
  );
}
