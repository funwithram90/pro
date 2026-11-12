import { useLayoutEffect, useRef } from "react";

const dialogs: HTMLElement[] = [];
const returnTargets = new WeakMap<HTMLElement, HTMLElement | null>();
let previousOverflow = "";
const focusables = 'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

let lastTrigger: HTMLElement | null = null;
let tracking = false;
let lastInteractionAt = 0;
/** Capture the opening interaction before React commits autoFocus fields. */
export function installDialogTracking() {
  if (tracking) return;
  tracking = true;
  document.addEventListener("pointerdown", (event) => {
    lastInteractionAt = Date.now();
    lastTrigger = event.target instanceof Element ? event.target.closest<HTMLElement>(focusables) : null;
  }, true);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") { lastInteractionAt = Date.now(); lastTrigger = document.activeElement as HTMLElement | null; }
  }, true);
}

/** Keep keyboard focus and scroll in the topmost open dialog, then return to its trigger. */
export function useDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  useLayoutEffect(() => { close.current = onClose; });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!open || !el) return;
    const active = document.activeElement as HTMLElement | null;
    const recentTrigger = Date.now() - lastInteractionAt < 1500 && lastTrigger && !el.contains(lastTrigger) ? lastTrigger : null;
    const trigger = recentTrigger ?? (el.contains(active) ? null : active);
    // An exiting parent may already have released its lock while its DOM is still present.
    const parent = trigger?.closest<HTMLElement>('[role="dialog"], [role="alertdialog"], [role="menu"]');
    const fallback = parent ? returnTargets.get(parent) ?? null : null;
    if (!dialogs.length) { previousOverflow = document.body.style.overflow; document.body.style.overflow = "hidden"; }
    returnTargets.set(el, trigger ?? fallback);
    dialogs.push(el);
    const available = () => [...el.querySelectorAll<HTMLElement>(focusables)].filter((node) => node.getClientRects().length > 0 && !node.closest('[inert], [aria-hidden="true"]'));
    const focusFirst = () => (available()[0] ?? el).focus({ preventScroll: true });
    if (!el.contains(document.activeElement)) focusFirst();
    const topmost = () => dialogs[dialogs.length - 1] === el;
    const onFocus = (event: FocusEvent) => { if (topmost() && !el.contains(event.target as Node)) focusFirst(); };
    const onKey = (event: KeyboardEvent) => {
      if (!topmost()) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close.current(); }
      if (event.key !== "Tab") return;
      const nodes = available();
      const first = nodes[0], last = nodes[nodes.length - 1];
      if (!first) { event.preventDefault(); el.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === el)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
      const restore = el.contains(document.activeElement) || document.activeElement === document.body;
      dialogs.splice(dialogs.indexOf(el), 1);
      if (!dialogs.length) document.body.style.overflow = previousOverflow;
      const target = trigger?.isConnected ? trigger : fallback;
      if (restore && target?.isConnected) target.focus({ preventScroll: true });
    };
  }, [open]);
  return ref;
}
