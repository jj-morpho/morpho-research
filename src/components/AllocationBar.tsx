interface Segment {
  width: number;
  color: string;
}

interface AllocationBarProps {
  segments: Segment[];
}

export default function AllocationBar({ segments }: AllocationBarProps) {
  return (
    <div className="alloc-bar">
      {segments.map((seg, i) => (
        <div key={i} className="seg" style={{ width: `${seg.width}%`, background: seg.color }} />
      ))}
    </div>
  );
}
