import { flushSync } from 'react-dom';

/**
 * Run a state update inside a View Transition when the browser supports it (Chrome, Safari 18+),
 * so pages and the card → spot hero morph instead of cutting. Falls back to an instant update.
 */
export function transition(update: () => void, kind: 'push' | 'pop' | 'tab' | 'fade' = 'fade') {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => { finished: Promise<void> } };
  if (!doc.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return update();
  document.documentElement.dataset.vt = kind;
  const t = doc.startViewTransition(() => flushSync(update));
  t.finished.finally(() => delete document.documentElement.dataset.vt);
}
