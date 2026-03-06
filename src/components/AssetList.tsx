interface AssetItem {
  name: string;
  type: string;
  pct: string;
  color: string;
  url?: string | null;
}

interface AssetListProps {
  assets: AssetItem[];
}

export default function AssetList({ assets }: AssetListProps) {
  return (
    <ul className="asset-list">
      {assets.map((a, i) => {
        const inner = (
          <>
            <div className="asset-left">
              <span className="asset-dot" style={{ background: a.color }} />
              <span className="asset-name">
                {a.name} <span className="asset-type">{a.type}</span>
              </span>
            </div>
            <span className="asset-pct">{a.pct}</span>
          </>
        );

        if (a.url) {
          return (
            <a key={i} className="asset-item" href={a.url} target="_blank" rel="noopener">
              {inner}
            </a>
          );
        }
        return (
          <li key={i} className="asset-item">
            {inner}
          </li>
        );
      })}
    </ul>
  );
}
