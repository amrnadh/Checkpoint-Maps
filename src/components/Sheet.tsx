import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

export type Detent = 'peek' | 'half' | 'full';

/**
 * Apple-Maps-style bottom sheet with three detents. Follows the finger while dragging,
 * then settles to the nearest detent (or the next one, if flicked).
 */
export function Sheet({ detent, onDetent, header, children }: { detent: Detent; onDetent(d: Detent): void; header: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [hostH, setHostH] = useState(800);
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; base: number; t: number } | null>(null);

  useLayoutEffect(() => {
    const host = ref.current?.parentElement;
    if (!host) return;
    const ro = new ResizeObserver(() => setHostH(host.clientHeight));
    ro.observe(host);
    setHostH(host.clientHeight);
    return () => ro.disconnect();
  }, []);

  const sheetH = Math.round(hostH * 0.92);
  const visible: Record<Detent, number> = { peek: 172, half: Math.round(hostH * 0.5), full: sheetH };
  const offset = (d: Detent) => sheetH - visible[d];
  const y = drag ?? offset(detent);

  useEffect(() => {
    if (detent !== 'full' && ref.current) ref.current.querySelector('.sheet-body')?.scrollTo({ top: 0 });
  }, [detent]);

  const onDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, a, input')) return;
    start.current = { y: e.clientY, base: offset(detent), t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!start.current) return;
    const next = start.current.base + (e.clientY - start.current.y);
    setDrag(Math.max(0, Math.min(offset('peek') + 40, next)));
  };
  const onUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    const dy = e.clientY - start.current.y;
    const v = dy / Math.max(1, performance.now() - start.current.t); // px/ms
    const order: Detent[] = ['full', 'half', 'peek'];
    let target: Detent;
    if (Math.abs(dy) < 6) {
      target = detent === 'peek' ? 'half' : detent; // a tap on the grabber opens it
    } else if (Math.abs(v) > 0.5) {
      const i = order.indexOf(detent) + (v > 0 ? 1 : -1);
      target = order[Math.max(0, Math.min(2, i))];
    } else {
      const cur = start.current.base + dy;
      target = order.reduce((a, b) => (Math.abs(offset(b) - cur) < Math.abs(offset(a) - cur) ? b : a));
    }
    start.current = null;
    setDrag(null);
    onDetent(target);
  };

  return (
    <section
      ref={ref}
      className={`bsheet${drag !== null ? ' is-dragging' : ''}`}
      data-detent={detent}
      style={{ height: sheetH, transform: `translateY(${y}px)` }}
      aria-label="Spots and collection"
    >
      <div className="sheet-grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <span className="grabber" aria-hidden="true" />
        {header}
      </div>
      <div className="sheet-body">{children}</div>
    </section>
  );
}
