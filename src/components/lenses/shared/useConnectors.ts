import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface Connector {
  key: string;
  /** Matches a `data-anchor="src:<from>"` element. */
  from: string;
  /** Matches a `data-anchor="dst:<to>"` element. */
  to: string;
  /** Drawn heavier — used for objects more than one name points at. */
  emphasis?: boolean;
}

export interface ConnectorPath extends Connector {
  d: string;
}

/**
 * Measures where the arrows should go.
 *
 * The alternative — laying the graph out ourselves — would mean reimplementing
 * flow layout badly. Instead the DOM lays everything out, and this reads the
 * boxes back afterwards and curves a line between them.
 *
 * Coordinates are measured against the container the arrows are drawn into, so
 * they survive scrolling for free; only a resize or a new step needs a re-measure.
 */
export function useConnectors(
  container: React.RefObject<HTMLElement | null>,
  connectors: Connector[],
  dependency: unknown
): ConnectorPath[] {
  const [paths, setPaths] = useState<ConnectorPath[]>([]);
  const connectorsRef = useRef(connectors);
  connectorsRef.current = connectors;

  const measure = useCallback(() => {
    const host = container.current;
    if (!host) return;

    const origin = host.getBoundingClientRect();
    const next: ConnectorPath[] = [];

    for (const connector of connectorsRef.current) {
      const source = host.querySelector(`[data-anchor="src:${cssEscape(connector.from)}"]`);
      const target = host.querySelector(`[data-anchor="dst:${cssEscape(connector.to)}"]`);
      if (!source || !target) continue;

      const a = source.getBoundingClientRect();
      const b = target.getBoundingClientRect();

      const x1 = a.right - origin.left;
      const y1 = a.top + a.height / 2 - origin.top;
      const x2 = b.left - origin.left;
      const y2 = b.top + Math.min(b.height / 2, 18) - origin.top;

      const bend = Math.min(Math.max(Math.abs(x2 - x1) / 2, 24), 90);
      next.push({
        ...connector,
        d: `M ${x1} ${y1} C ${x1 + bend} ${y1}, ${x2 - bend} ${y2}, ${x2} ${y2}`,
      });
    }

    setPaths(next);
  }, [container]);

  useLayoutEffect(measure, [measure, dependency, connectors.length]);

  useEffect(() => {
    const host = container.current;
    if (!host) return;

    const observer = new ResizeObserver(measure);
    observer.observe(host);
    for (const anchored of host.querySelectorAll('[data-anchor]')) observer.observe(anchored);

    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [container, measure]);

  return paths;
}

/** Anchor ids are digits and identifiers; only quotes and slashes need escaping. */
function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}
