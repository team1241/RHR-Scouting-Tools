const SCROLL_RESTORE_DELAYS_MS = [0, 50, 200, 500];

function restoreDocumentScroll() {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.style.removeProperty("overflow");
  document.body.style.removeProperty("overflow");
  document.body.style.removeProperty("padding-right");
  document.body.style.removeProperty("margin-right");
  document.body.style.removeProperty("pointer-events");
  document.body.removeAttribute("data-scroll-locked");
}

export function scheduleDocumentScrollRestore() {
  if (typeof window === "undefined") {
    return;
  }

  window.requestAnimationFrame(() => {
    restoreDocumentScroll();
    for (const delay of SCROLL_RESTORE_DELAYS_MS) {
      window.setTimeout(restoreDocumentScroll, delay);
    }
  });
}
