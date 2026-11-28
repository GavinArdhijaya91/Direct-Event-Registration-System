"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function HeroActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [targetPath, setTargetPath] = useState<string | null>(null);

  function handleNavigate(e: React.MouseEvent<HTMLAnchorElement>, href: string) {
    if (href.startsWith("/")) {
      e.preventDefault();
      setTargetPath(href);
      startTransition(() => {
        router.push(href);
      });
    }
  }

  const isDaftarLoading = isPending && targetPath === "/daftar";
  const isRecoverLoading = isPending && targetPath === "/daftar#pemulihan";

  return (
    <div className="hero-actions">
      <div className="relative group inline-block">
        <Link
          href="/daftar"
          onClick={(e) => handleNavigate(e, "/daftar")}
          className="btn btn-primary hero-primary inline-flex items-center gap-2 !text-white shadow-md hover:shadow-lg transition-all active:scale-95"
          title="Buka formulir pendaftaran online Natal PWK UNNES 2026"
          aria-busy={isDaftarLoading}
        >
          {isDaftarLoading ? (
            <span className="inline-flex items-center gap-2 !text-white">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span className="font-semibold !text-white">Menuju Formulir…</span>
            </span>
          ) : (
            <>
              <span className="font-semibold !text-white">Daftar Sekarang</span>
              <span
                aria-hidden="true"
                className="!text-white transition-transform duration-150 group-hover:translate-x-1"
              >
                ↗
              </span>
            </>
          )}
        </Link>
        <div className="hover-hint pointer-events-none absolute left-1/2 -bottom-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--forest-deep)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-20">
          Buka formulir pendaftaran
          <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--forest-deep)]" />
        </div>
      </div>

      <Link
        href="/daftar#pemulihan"
        onClick={(e) => handleNavigate(e, "/daftar#pemulihan")}
        className="hero-ticket-link inline-flex items-center gap-1.5"
        aria-busy={isRecoverLoading}
      >
        {isRecoverLoading ? (
          <span className="inline-flex items-center gap-1.5 text-white font-medium">
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Membuka pemulihan…</span>
          </span>
        ) : (
          <>
            Sudah mendaftar? <span>Pulihkan tiket</span>
          </>
        )}
      </Link>
    </div>
  );
}
