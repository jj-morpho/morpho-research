"use client";

import { ASSET_OPTIONS } from "@/lib/constants";
import type { AssetSymbol } from "@/lib/types";

interface AssetSelectorProps {
  current: AssetSymbol;
  onSwitch: (a: AssetSymbol) => void;
}

export default function AssetSelector({ current, onSwitch }: AssetSelectorProps) {
  return (
    <div className="asset-selector">
      {ASSET_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          className={`asset-btn${key === current ? " active" : ""}`}
          onClick={() => onSwitch(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
