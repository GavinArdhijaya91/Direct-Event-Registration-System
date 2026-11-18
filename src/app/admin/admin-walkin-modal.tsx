"use client";

import { useState, useTransition, type FormEvent } from "react";

export default function AdminWalkinModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState("MAHASISWA");
  const [error, setError] = useState<string | null>(null);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/register-walkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const body = (await res.json()) as { message?: string };
        if (!res.ok) {
          setError(body.message ?? "Pendaftaran OTS gagal.");
          return;
        }
        await onSuccess();
        onClose();
      } catch {
        setError("Koneksi gagal saat memproses pendaftaran OTS.");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)]">
              🆘 Pendaftaran OTS / Walk-In (Penyelamat)
            </h3>
            <p className="text-xs text-[var(--muted)]">
              Gunakan saat tamu datang namun kuota online penuh. Peserta langsung tercatat HADIR.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 hover:bg-gray-200"
            type="button"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-[var(--red)] bg-[var(--rose)] p-3 text-xs text-[var(--red)]">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="mt-4 space-y-3.5">
          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-name"
            >
              Nama Lengkap Peserta
            </label>
            <input
              id="walkin-name"
              name="fullName"
              required
              maxLength={120}
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              placeholder="Nama lengkap tamu/peserta"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-wa"
            >
              Nomor WhatsApp
            </label>
            <input
              id="walkin-wa"
              name="whatsappNumber"
              required
              type="tel"
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-category"
            >
              Kategori
            </label>
            <select
              id="walkin-category"
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
            >
              <option value="MAHASISWA">Mahasiswa</option>
              <option value="ALUMNI">Alumni</option>
              <option value="TAMU_UNDANGAN">Tamu Undangan</option>
            </select>
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-institution"
            >
              Asal / Instansi
            </label>
            <input
              id="walkin-institution"
              name="institution"
              required
              maxLength={120}
              className="min-h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-sm"
              placeholder={
                category === "MAHASISWA"
                  ? "Contoh: FMIPA - Teknik Informatika UNNES"
                  : category === "ALUMNI"
                    ? "Contoh: Angkatan 2020, FMIPA UNNES"
                    : "Contoh: Gereja Bethel / Instansi Tamu"
              }
            />
          </div>

          <div>
            <label
              className="mb-1 block text-xs font-semibold text-[var(--ink)]"
              htmlFor="walkin-reason"
            >
              Alasan Penerimaan OTS (Wajib untuk Audit)
            </label>
            <textarea
              id="walkin-reason"
              name="reason"
              required
              rows={2}
              maxLength={500}
              className="w-full rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm"
              placeholder="Contoh: Tamu undangan hadir langsung tanpa tiket online, disetujui panitia."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 flex-1 rounded-full bg-[var(--forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--forest-deep)] disabled:opacity-50"
            >
              {pending
                ? "Mendaftarkan & Absenkan…"
                : "✓ Daftarkan & Langsung Hadirkan"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded-full border border-[var(--line)] px-4 text-sm font-semibold hover:bg-gray-100"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
