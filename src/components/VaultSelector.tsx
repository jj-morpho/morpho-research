"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { VaultEntry, CuratorGroup } from "@/lib/types";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface VaultSelectorProps {
  vaults: VaultEntry[];
  currentVaultIndex: number;
  getCurators: () => CuratorGroup[];
  onSelectVault: (index: number) => void;
}

export default function VaultSelector({ vaults, currentVaultIndex, getCurators, onSelectVault }: VaultSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCurator, setSelectedCurator] = useState<string | null>(null);
  const [curatorFilter, setCuratorFilter] = useState("");
  const [vaultFilter, setVaultFilter] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const curatorInputRef = useRef<HTMLInputElement>(null);
  const vaultInputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setSelectedCurator(null);
    setCuratorFilter("");
    setVaultFilter("");
  }, []);

  // Close on outside click — use mousedown + ref containment (reliable with React 19)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [close]);

  // Focus search on panel switch
  useEffect(() => {
    if (isOpen && !selectedCurator) {
      setTimeout(() => curatorInputRef.current?.focus(), 50);
    } else if (isOpen && selectedCurator) {
      setTimeout(() => vaultInputRef.current?.focus(), 50);
    }
  }, [isOpen, selectedCurator]);

  const curators = getCurators();
  const q = curatorFilter.toLowerCase().trim();
  const filteredCurators = q ? curators.filter((c) => c.name.toLowerCase().includes(q)) : curators;

  const curatorGroup = curators.find((c) => c.name === selectedCurator);
  const vq = vaultFilter.toLowerCase().trim();
  const filteredVaults = curatorGroup
    ? vq
      ? curatorGroup.vaults.filter((v) => v.name.toLowerCase().includes(vq))
      : curatorGroup.vaults
    : [];

  return (
    <div className="vault-selector" ref={wrapperRef}>
      <button
        className={`vault-selector-btn${isOpen ? " open" : ""}`}
        onClick={() => {
          if (isOpen) close();
          else {
            setIsOpen(true);
            setSelectedCurator(null);
          }
        }}
      >
        Select Vault <span className="chevron">&#9662;</span>
      </button>

      <div className={`vault-dropdown${isOpen ? " show" : ""}`}>
        {/* Curator panel */}
        {!selectedCurator && (
          <div id="curatorPanel">
            <div className="dropdown-search-wrap">
              <span className="search-icon">&#128269;</span>
              <input
                ref={curatorInputRef}
                className="dropdown-search"
                type="text"
                placeholder="Search curators..."
                autoComplete="off"
                value={curatorFilter}
                onChange={(e) => setCuratorFilter(e.target.value)}
              />
              <button
                className="dropdown-clear"
                onClick={() => {
                  setCuratorFilter("");
                  curatorInputRef.current?.focus();
                }}
              >
                Clear
              </button>
            </div>
            <ul className="dropdown-list">
              {filteredCurators.length === 0 ? (
                <div className="dropdown-empty">No curators found</div>
              ) : (
                filteredCurators.map((c) => {
                  const initials = c.name.substring(0, 2).toUpperCase();
                  return (
                    <li key={c.name} className="dropdown-item" onClick={() => setSelectedCurator(c.name)}>
                      <span className="item-icon">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLElement).parentElement!.textContent = initials;
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </span>
                      <span className="item-label">{escapeHtml(c.name)}</span>
                      <span className="item-arrow">&#8250;</span>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {/* Vault panel */}
        {selectedCurator && (
          <div id="vaultPanel">
            <button className="dropdown-back" onClick={() => setSelectedCurator(null)}>
              &#8592; Back to curators
            </button>
            <div className="dropdown-search-wrap">
              <span className="search-icon">&#128269;</span>
              <input
                ref={vaultInputRef}
                className="dropdown-search"
                type="text"
                placeholder="Search vaults..."
                autoComplete="off"
                value={vaultFilter}
                onChange={(e) => setVaultFilter(e.target.value)}
              />
              <button
                className="dropdown-clear"
                onClick={() => {
                  setVaultFilter("");
                  vaultInputRef.current?.focus();
                }}
              >
                Clear
              </button>
            </div>
            <ul className="dropdown-list">
              {filteredVaults.length === 0 ? (
                <div className="dropdown-empty">No vaults found</div>
              ) : (
                filteredVaults.map((v) => {
                  const idx = vaults.findIndex((w) => w.address === v.address);
                  const isSelected = idx === currentVaultIndex;
                  const initials = (curatorGroup?.name || "").substring(0, 2).toUpperCase();
                  return (
                    <li
                      key={v.address}
                      className={`dropdown-item${isSelected ? " selected" : ""}`}
                      onClick={() => {
                        onSelectVault(idx);
                        close();
                      }}
                    >
                      <span className="item-icon">
                        {curatorGroup?.image ? (
                          <img
                            src={curatorGroup.image}
                            alt=""
                            onError={(e) => {
                              (e.target as HTMLElement).parentElement!.textContent = initials;
                            }}
                          />
                        ) : (
                          initials
                        )}
                      </span>
                      <span className="item-label">{escapeHtml(v.name)}</span>
                      {isSelected && <span className="item-check">&#10003;</span>}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
