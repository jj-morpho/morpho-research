import { MORPHO_API, AAVE_API, CURATORS_URL, LLAMA_POOLS_URL, NETWORKS } from "./constants";
import { getColor } from "./colors";
import type { VaultEntry, CuratorMeta, CuratorRaw, AaveReserve, CollateralAsset } from "./types";

// ── Helpers ──

function fetchWithTimeout(url: string, opts: RequestInit = {}, ms = 5000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...opts, signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ── Curator metadata ──

let curatorMetaRaw: CuratorRaw[] = [];
let curatorMeta: CuratorMeta[] = [];

export async function fetchCuratorsListing(): Promise<CuratorMeta[]> {
  const res = await fetch(CURATORS_URL);
  if (!res.ok) throw new Error("HTTP " + res.status);
  curatorMetaRaw = await res.json();
  return curatorMetaRaw as unknown as CuratorMeta[];
}

export function buildCuratorAddresses(chainId: number): CuratorMeta[] {
  const chainKey = String(chainId);
  curatorMeta = curatorMetaRaw.map((c) => ({
    name: c.name,
    image: c.image || "",
    id: c.id || "",
    addresses: new Set((c.addresses?.[chainKey] || []).map((a) => a.toLowerCase())),
  }));
  return curatorMeta;
}

export function getCuratorMetaRaw(): CuratorRaw[] {
  return curatorMetaRaw;
}

function findCuratorForAddress(addr: string | null): CuratorMeta | null {
  if (!addr) return null;
  const lower = addr.toLowerCase();
  return curatorMeta.find((c) => c.addresses.has(lower)) || null;
}

// ── Morpho vaults ──

export async function fetchAllMorphoVaults(chainId: number): Promise<unknown[]> {
  const query = `{ vaults(where: { chainId_in: [${chainId}] }, first: 500) { items { address name state { netApy curator totalAssetsUsd allocation { supplyAssetsUsd market { uniqueKey collateralAsset { symbol name } } } } asset { symbol } } } }`;
  const res = await fetch(MORPHO_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data?.vaults?.items || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildVaultEntry(v: any, chainId: number): VaultEntry {
  const net = NETWORKS[chainId] || NETWORKS[1];
  const curatorAddr = v.state?.curator ?? null;
  const curator = findCuratorForAddress(curatorAddr);
  const curatorName = curator ? curator.name : "Uncurated";
  const curatorImage = curator ? curator.image : "";

  let apy = "\u2013";
  if (v.state?.netApy != null) {
    apy = (v.state.netApy * 100).toFixed(2) + "%";
  }

  let collateral: CollateralAsset[] = [];
  let badge = "Loading\u2026";

  if (v.state?.allocation?.length > 0) {
    const alloc = v.state.allocation;
    const totalUsd = alloc.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: number, a: any) => s + (parseFloat(a.supplyAssetsUsd) || 0),
      0
    );
    if (totalUsd > 0) {
      collateral = alloc
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) => a.market?.collateralAsset)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => {
          const pct = ((parseFloat(a.supplyAssetsUsd) || 0) / totalUsd) * 100;
          const sym = a.market.collateralAsset.symbol;
          const key = a.market.uniqueKey;
          return {
            name: sym,
            type: a.market.collateralAsset.name || sym,
            pct: pct < 0.1 ? "<0.1%" : pct.toFixed(1) + "%",
            width: Math.max(pct, 0.3),
            color: getColor(sym),
            url: key ? `https://app.morpho.org/${net.morphoApp}/market/${key}` : null,
          };
        })
        .sort((a: CollateralAsset, b: CollateralAsset) => b.width - a.width);
      badge = collateral.length + " assets \u00b7 Isolated";
    }
  }

  return {
    name: v.name || v.address,
    address: v.address,
    url: `https://app.morpho.org/${net.morphoApp}/vault/${v.address}`,
    apy,
    badge,
    curator: curatorName,
    curatorImage,
    collateral,
    totalAssetsUsd: (v.state && parseFloat(v.state.totalAssetsUsd)) || 0,
    assetSymbol: v.asset?.symbol || "",
  };
}

// ── Aave data ──

let llamaAavePools: { symbol: string; apyBase: number; tvlUsd: number; chain: string; project: string; underlyingTokens?: string[] }[] | null = null;

export function clearLlamaCache() {
  llamaAavePools = null;
}

export async function fetchAaveRate(chainId: number): Promise<number | null> {
  const net = NETWORKS[chainId] || NETWORKS[1];

  // Try Aave GraphQL
  try {
    const query = '{ markets { name chainId supplyReserves { underlyingToken { symbol } supplyRate } } }';
    const res = await fetchWithTimeout(
      AAVE_API,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) },
      5000
    );
    if (res.ok) {
      const json = await res.json();
      if (!json.errors && json.data?.markets) {
        const market = json.data.markets.find(net.aaveMarketFilter);
        if (market?.supplyReserves) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const usdcReserve = market.supplyReserves.find((r: any) => r.underlyingToken?.symbol === "USDC");
          if (usdcReserve?.supplyRate != null) {
            return parseFloat(usdcReserve.supplyRate) * 100;
          }
        }
      }
    }
  } catch (e) {
    console.warn("[Aave GraphQL rate]", e);
  }

  // Fallback: DeFi Llama
  try {
    const res2 = await fetchWithTimeout(LLAMA_POOLS_URL, {}, 8000);
    if (!res2.ok) throw new Error("HTTP " + res2.status);
    const json2 = await res2.json();
    llamaAavePools = json2.data.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => p.project === "aave-v3" && p.chain === net.llamaChain
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pool = llamaAavePools!.find((p: any) => p.symbol === "USDC");
    if (pool?.apyBase != null) return pool.apyBase;
  } catch (e) {
    console.warn("[DeFi Llama rate]", e);
  }

  return null;
}

export async function fetchAaveCollateral(chainId: number): Promise<AaveReserve[] | null> {
  const net = NETWORKS[chainId] || NETWORKS[1];

  // Try Aave GraphQL
  try {
    const query =
      "{ markets { name chainId totalMarketSize supplyReserves { underlyingToken { symbol name address } size { usdValue } } } }";
    const res = await fetchWithTimeout(
      AAVE_API,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }) },
      5000
    );
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    if (json.errors) throw new Error(json.errors[0].message);

    const market = json.data.markets.find(net.aaveMarketFilter);
    if (!market?.supplyReserves) throw new Error(net.name + " core market not found");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nonUsdc = market.supplyReserves.filter((r: any) => r.underlyingToken?.symbol !== "USDC");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalUsd = nonUsdc.reduce((s: number, r: any) => s + (parseFloat(r.size.usdValue) || 0), 0);
    if (!totalUsd || totalUsd <= 0) throw new Error("Invalid total");

    const bySymbol: Record<string, { symbol: string; name: string; address: string; usd: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nonUsdc.forEach((r: any) => {
      const sym = r.underlyingToken.symbol;
      if (!bySymbol[sym]) {
        bySymbol[sym] = {
          symbol: sym,
          name: r.underlyingToken.name || sym,
          address: r.underlyingToken.address?.toLowerCase() || "",
          usd: 0,
        };
      }
      bySymbol[sym].usd += parseFloat(r.size.usdValue) || 0;
    });

    const reserves = Object.values(bySymbol)
      .map((e) => ({ symbol: e.symbol, name: e.name, address: e.address, pct: (e.usd / totalUsd) * 100 }))
      .filter((r) => r.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    if (reserves.length > 0) return reserves;
  } catch (e) {
    console.warn("[Aave GraphQL collateral]", e);
  }

  // Fallback: DeFi Llama
  try {
    if (!llamaAavePools?.length) {
      const res2 = await fetchWithTimeout(LLAMA_POOLS_URL, {}, 8000);
      if (!res2.ok) throw new Error("HTTP " + res2.status);
      const json2 = await res2.json();
      llamaAavePools = json2.data.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (p: any) => p.project === "aave-v3" && p.chain === net.llamaChain
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pools = llamaAavePools!.filter((p: any) => p.symbol !== "USDC");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const totalTvl = pools.reduce((s: number, p: any) => s + (p.tvlUsd || 0), 0);
    if (!totalTvl) throw new Error("Zero TVL");

    const bySymbol2: Record<string, { symbol: string; name: string; address: string; tvl: number }> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pools.forEach((p: any) => {
      const sym = p.symbol;
      if (!bySymbol2[sym]) {
        bySymbol2[sym] = {
          symbol: sym,
          name: sym,
          address: p.underlyingTokens?.[0]?.toLowerCase() || "",
          tvl: 0,
        };
      }
      bySymbol2[sym].tvl += p.tvlUsd || 0;
    });

    const reserves2 = Object.values(bySymbol2)
      .map((e) => ({ symbol: e.symbol, name: e.name, address: e.address, pct: (e.tvl / totalTvl) * 100 }))
      .filter((r) => r.pct > 0)
      .sort((a, b) => b.pct - a.pct);

    if (reserves2.length > 0) return reserves2;
  } catch (e) {
    console.warn("[DeFi Llama collateral]", e);
  }

  return null;
}
