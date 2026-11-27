import Link from "next/link";
import Image from "next/image";
import RegistrationForm from "@/app/registration-form";
import TicketRecoveryForm from "@/app/ticket-recovery-form";
import RevealObserver from "@/app/reveal-observer";
import { getPrismaClient } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function DaftarPage() {
  const settings = await getPrismaClient().eventSettings.findUnique({
    where: { id: 1 },
    select: {
      eventName: true,
      eventDate: true,
      eventLocation: true,
      maxCapacity: true,
      registeredCount: true,
      registrationOpen: true,
    },
  });

  const canRegister = settings !== null && 
    settings.registrationOpen && 
    settings.registeredCount < settings.maxCapacity;
  
  const isFull = settings ? settings.registeredCount >= settings.maxCapacity : false;
  const remaining = settings
    ? Math.max(settings.maxCapacity - settings.registeredCount, 0)
    : 0;

  const formattedDate = settings?.eventDate
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "long",
        timeZone: "Asia/Jakarta",
      }).format(settings.eventDate)
    : "28 Januari 2027";

  return (
    <main className="registration-page" data-reveal-root>
      <div aria-hidden="true" className="registration-snowfall">
        {Array.from({ length: 12 }, (_, index) => (
          <span className="registration-snowflake" key={index} />
        ))}
      </div>
      <RevealObserver />
      <header className="site-header registration-header" data-reveal>
        <div className="site-header-inner">
          <Link
            href="/"
            className="brand-lockup"
            aria-label="Natal PWK UNNES, kembali ke beranda"
          >
            <Image
              src="/images/logos/logo-natal-pwk-2026.png"
              alt=""
              width={52}
              height={52}
              className="brand-logo"
              priority
            />
            <span className="brand-copy">
              <span className="brand-name">{settings?.eventName ?? "Natal PWK UNNES 2026"}</span>
              <span className="brand-tagline">Merayakan Natal, Membagikan Cinta</span>
            </span>
          </Link>
          
          <nav className="header-nav" aria-label="Navigasi utama">
            <Link href="/" className="btn btn-outline registration-back">
              ← Kembali
            </Link>
          </nav>
        </div>
      </header>

      <div className="container-schematics registration-content">
        <div className="registration-hero" data-reveal>
          <p className="hero-eyebrow">
            <span aria-hidden="true">✦</span> Perayaan Natal PWK UNNES 2026
          </p>
          <h1 className="registration-hero-title">
            Formulir Pendaftaran
          </h1>
          <p className="registration-hero-description">
            Isi data diri Anda untuk mendapatkan tiket Natal PWK UNNES 2026
          </p>
        </div>

        <div className="registration-status-wrap" data-reveal>
          <div className="card-premium registration-status">
            <div className="grid md:grid-cols-3 gap-5 items-center">
              <div className="flex items-center gap-3.5 pb-4 border-b border-[var(--line)] md:border-b-0 md:pb-0">
                {canRegister ? (
                  <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-700 shadow-xs border border-emerald-200/60">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  </div>
                ) : isFull ? (
                  <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0 text-red-700 shadow-xs border border-red-200/60">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0 text-amber-700 shadow-xs border border-amber-200/60">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="10" y1="15" x2="10" y2="9" />
                      <line x1="14" y1="15" x2="14" y2="9" />
                    </svg>
                  </div>
                )}
                
                <div>
                  <p className="font-bold text-ink text-sm sm:text-base">Status Pendaftaran</p>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {canRegister ? "Pendaftaran dibuka" : isFull ? "Kuota penuh" : "Pendaftaran ditutup"}
                  </p>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="grid grid-cols-1 gap-2 text-left sm:grid-cols-3 sm:text-center">
                  <div className="rounded-xl bg-gray-50/80 p-3 sm:p-0 sm:bg-transparent">
                    <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">TANGGAL</p>
                    <p className="text-sm font-semibold text-ink leading-snug">{formattedDate}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50/80 p-3 sm:p-0 sm:bg-transparent">
                    <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">LOKASI</p>
                    <p className="text-sm font-semibold text-ink leading-snug">
                      {settings?.eventLocation ?? "L4, FEB UNNES"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50/80 p-3 sm:p-0 sm:bg-transparent">
                    <p className="text-[11px] sm:text-xs text-gray-500 uppercase tracking-wider mb-0.5">KUOTA</p>
                    <p className="text-sm font-semibold text-emeral leading-snug">Tersisa {remaining}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3" data-reveal>
          <div className="relative group">
            <a
              href="#daftar"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--emeral)] bg-[var(--emeral)] px-6 py-2.5 text-sm font-semibold !text-white shadow-sm hover:bg-[var(--emeral-dark)] hover:!text-white transition"
              title="Isi formulir pendaftaran peserta baru"
            >
              <span className="!text-white font-semibold">Formulir Pendaftaran</span>
              <span aria-hidden="true" className="!text-white transition-transform group-hover:translate-y-0.5">↓</span>
            </a>
            <div className="hover-hint pointer-events-none absolute left-1/2 -bottom-9 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--forest-deep)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-20">
              Isi data pendaftaran peserta baru
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--forest-deep)]" />
            </div>
          </div>
          <div className="relative group">
            <a
              href="#pemulihan"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[var(--line)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--ink)] shadow-sm hover:bg-[var(--cream)] hover:text-[var(--forest)] transition"
              title="Buka kembali tiket yang sudah pernah didaftarkan"
            >
              <span>Pulihkan Tiket (Sudah Daftar)</span>
              <span aria-hidden="true" className="transition-transform group-hover:translate-y-0.5">↓</span>
            </a>
            <div className="hover-hint pointer-events-none absolute left-1/2 -bottom-9 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--forest-deep)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-20">
              Buka tiket yang sudah terdaftar
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-[var(--forest-deep)]" />
            </div>
          </div>
        </div>

        <section id="daftar" className="registration-section" data-reveal>
          <div className="section-header mb-8">
            <p className="text-sm font-semibold text-emeral uppercase tracking-wider mb-2">
              DAFTAR BARU
            </p>
            <h2 className="section-title">Data Peserta</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Isi formulir dengan data yang valid
            </p>
          </div>

          {/* Privacy Notice */}
          <div className="max-w-3xl mx-auto mb-8">
            <div className="registration-privacy bg-blush border border-blush-dark rounded-xl p-4">
              <p className="text-sm font-semibold text-ink mb-2 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <span>Privasi Data</span>
              </p>
              <p className="text-sm text-gray-600">
                Nomor WhatsApp dan data identitas yang Anda berikan hanya akan digunakan untuk 
                keperluan acara ini. Kami berkomitmen untuk melindungi privasi Anda. 
                Pastikan untuk menyimpan tautan tiket dan kode pemulihan dengan aman.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="card-premium registration-form-card">
              <RegistrationForm canRegister={canRegister} />
            </div>
          </div>
        </section>

        <section
          id="pemulihan"
          className="registration-section recovery-section"
          data-reveal
        >
          <div className="section-header mb-8">
            <p className="text-sm font-semibold text-emeral uppercase tracking-wider mb-2">
              SUDAH MENDAFTAR?
            </p>
            <h2 className="section-title">Pulihkan Tiket</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Masukkan nomor WhatsApp dan kode pemulihan untuk mendapatkan tiket Anda kembali
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="card-premium registration-form-card">
              <TicketRecoveryForm />
            </div>
          </div>
        </section>

        <div className="registration-home-link" data-reveal>
          <Link href="/" className="btn btn-outline">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      <footer className="site-footer registration-footer" data-reveal>
        <div className="footer-gift-border" aria-hidden="true" />
        <div className="footer-inner registration-footer-inner">
          <div className="footer-organizer">
            <Image
              src="/images/logos/logo-uk3unnes.png"
              alt="UK3 UNNES"
              width={48}
              height={28}
              className="footer-uk3-logo"
            />
          </div>
          <p className="footer-note">
            © 2026 PWK UNNES<br /><span>Rayakan kasih, bagikan sukacita.</span>
          </p>
          <Image
            src="/images/logos/logo-unnes.png"
            alt="Universitas Negeri Semarang"
            width={30}
            height={40}
            className="footer-unnes-logo"
          />
        </div>
      </footer>
    </main>
  );
}
