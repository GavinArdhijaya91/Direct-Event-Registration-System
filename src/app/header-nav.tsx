"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function HeaderNav() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  function handleSmoothScroll(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.slice(1);
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("/")) {
      e.preventDefault();
      setTargetPath(href);
      startTransition(() => {
        router.push(href);
      });
    }
  }

  const isRecoveryLoading = isPending && targetPath === "/daftar#pemulihan";
  const isRegisterLoading = isPending && targetPath === "/daftar";

  return (
    <nav className="header-nav" aria-label="Navigasi utama">
      <Link
        href="#kegiatan"
        onClick={(e) => handleSmoothScroll(e, "#kegiatan")}
        className="header-text-link transition hover:text-[var(--forest)] hidden md:inline-flex"
      >
        Kegiatan
      </Link>

      <Link
        href="/daftar#pemulihan"
        onClick={(e) => handleNavigate(e, "/daftar#pemulihan")}
        className={`btn btn-outline header-recovery transition active:scale-95 hidden md:inline-flex ${
          isRecoveryLoading
            ? "!bg-[var(--forest)] !text-white !border-[var(--forest)] shadow-sm"
            : ""
        }`}
        aria-busy={isRecoveryLoading}
      >
        {isRecoveryLoading ? (
          <span className="inline-flex items-center gap-1.5 !text-white">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span className="!text-white">Membuka…</span>
          </span>
        ) : (
          "Cek Tiket"
        )}
      </Link>

      <Link
        href="/daftar"
        onClick={(e) => handleNavigate(e, "/daftar")}
        className="btn btn-primary header-register transition-all active:scale-95 shadow-sm hover:shadow inline-flex"
        aria-busy={isRegisterLoading}
      >
        {isRegisterLoading ? (
          <span className="inline-flex items-center gap-1.5 text-white">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Menuju Form…</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span>Daftar</span>
            <span aria-hidden="true" className="text-xs transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        )}
      </Link>
    </nav>
  );
}
