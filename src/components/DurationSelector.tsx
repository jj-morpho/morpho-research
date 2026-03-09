"use client";

import { DURATION_OPTIONS } from "@/lib/constants";
import type { YieldDuration } from "@/lib/types";

interface DurationSelectorProps {
  current: YieldDuration;
  onSwitch: (d: YieldDuration) => void;
}

export default function DurationSelector({ current, onSwitch }: DurationSelectorProps) {
  return (
    <div className="duration-selector">
      {DURATION_OPTIONS.map(({ key, label }) => (
        <button
          key={key}
          className={`duration-btn${key === current ? " active" : ""}`}
          onClick={() => onSwitch(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
