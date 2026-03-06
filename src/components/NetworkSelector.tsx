"use client";

import { NETWORKS } from "@/lib/constants";

interface NetworkSelectorProps {
  currentChainId: number;
  onSwitch: (chainId: number) => void;
}

const CHAIN_ORDER = [1, 8453, 42161, 10];

export default function NetworkSelector({ currentChainId, onSwitch }: NetworkSelectorProps) {
  return (
    <div className="network-selector" id="networkSelector">
      {CHAIN_ORDER.map((chainId) => {
        const net = NETWORKS[chainId];
        if (!net) return null;
        return (
          <button
            key={chainId}
            className={`network-btn${chainId === currentChainId ? " active" : ""}`}
            data-chain={chainId}
            onClick={() => onSwitch(chainId)}
          >
            {net.name}
          </button>
        );
      })}
    </div>
  );
}
