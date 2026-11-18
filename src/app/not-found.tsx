import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-5 py-12">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--red)]">
        Tiket tidak ditemukan
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Tautan tiket tidak valid.
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted)]">
        Periksa kembali tautan yang digunakan atau kembali ke halaman utama.
      </p>
      <Link
        className="mt-7 w-fit rounded-full bg-[var(--forest)] px-6 py-3 font-semibold text-white hover:bg-[var(--forest-deep)]"
        href="/"
      >
        Ke halaman utama
      </Link>
    </main>
  );
}
