"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">
        Layanan belum tersedia
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Kami belum dapat memuat halaman ini.
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Data pendaftaran tidak dapat diakses sekarang. Silakan coba beberapa
        saat lagi.
      </p>
      <button
        className="mt-7 min-h-12 w-fit rounded-full bg-[var(--forest)] px-6 font-semibold text-white hover:bg-[var(--forest-deep)]"
        onClick={() => reset()}
        type="button"
      >
        Coba lagi
      </button>
    </main>
  );
}
