"use client";

import { useEffect } from "react";

export default function RevealObserver() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>(
      "[data-reveal-root] [data-reveal]",
    );
    if (!targets.length) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => {
        target.dataset.revealState = "visible";
      });
      return;
    }

    targets.forEach((target) => {
      const bounds = target.getBoundingClientRect();
      const isInitiallyVisible =
        bounds.top < window.innerHeight && bounds.bottom > 0;

      if (isInitiallyVisible) {
        target.dataset.revealState = "visible";
      } else {
        target.dataset.revealState = "pending";
      }
    });

    const revealVisibleTargets = () => {
      const viewportBottom = window.innerHeight - 40;
      for (const target of targets) {
        if (target.dataset.revealState !== "pending") continue;

        const bounds = target.getBoundingClientRect();
        if (bounds.top < viewportBottom && bounds.bottom > 40) {
          target.dataset.revealState = "visible";
        }
      }
    };

    window.addEventListener("scroll", revealVisibleTargets, { passive: true });
    window.addEventListener("resize", revealVisibleTargets);
    revealVisibleTargets();

    return () => {
      window.removeEventListener("scroll", revealVisibleTargets);
      window.removeEventListener("resize", revealVisibleTargets);
    };
  }, []);

  return null;
}
