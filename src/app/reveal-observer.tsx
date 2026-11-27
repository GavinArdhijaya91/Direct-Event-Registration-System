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

    // Tandai target awal sebagai pending
    targets.forEach((target) => {
      target.dataset.revealState = "pending";
    });

    // Gunakan native IntersectionObserver agar scroll 100% mulus tanpa layout thrashing
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            el.dataset.revealState = "visible";
            observer.unobserve(el);
          }
        }
      },
      {
        rootMargin: "0px 0px -20px 0px",
        threshold: 0.05,
      },
    );

    targets.forEach((target) => observer.observe(target));

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
