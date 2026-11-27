"use client";

import { useEffect, type ReactNode } from "react";
import AdminIcon from "@/app/admin/admin-icons";
import { formatWib, type Attendee } from "@/app/admin/admin-context";

const labels: Record<string, string> = {
  MAHASISWA_ALUMNI: "Mahasiswa / Alumni",
  UMUM: "Umum / Tamu undangan",
  MAHASISWA: "Mahasiswa",
  ALUMNI: "Alumni",
  TAMU_UNDANGAN: "Tamu undangan",
  UNNES: "UNNES",
  LUAR_UNNES: "Luar UNNES",
  INSTAGRAM: "Instagram",
  GRUP_WA: "WhatsApp",
  TEMAN_KATING: "Teman / kating",
  POSTER_KAMPUS: "Poster kampus",
  GEREJA_PMK: "Gereja / PMK",
  FACEBOOK: "Facebook",
  TEMAN_KOMUNITAS_GEREJA: "Teman / Komunitas Gereja",
  SCAN_MANDIRI: "Scan QR mandiri",
  MANUAL_ADMIN: "Manual oleh admin",
};

function readable(value: string | null | undefined) {
  if (!value) return "—";
  return labels[value] ?? value.replaceAll("_", " ");
}

function birthDateLabel(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="admin-detail-field">
      <dt className="admin-detail-label">{label}</dt>
      <dd className="admin-detail-value">{value}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="admin-detail-group">
      <h3 className="admin-detail-group-title">{title}</h3>
      <dl className="admin-detail-grid">{children}</dl>
    </section>
  );
}

export default function AdminParticipantDetail({
  attendee,
  onClose,
}: {
  attendee: Attendee | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!attendee) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [attendee, onClose]);

  if (!attendee) return null;

  return (
    <div
      className="admin-modal"
      onClick={onClose}
      role="presentation"
    >
      <div
        aria-labelledby="detail-peserta-title"
        aria-modal="true"
        className="admin-dialog admin-dialog--wide"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="admin-dialog-head">
          <div>
            <h2 className="admin-dialog-title" id="detail-peserta-title">
              <AdminIcon name="users" /> Detail peserta
            </h2>
            <p className="admin-dialog-sub">
              Data pendaftaran hanya untuk kebutuhan acara. Tautan tiket dan
              kode pemulihan tidak ditampilkan di sini.
            </p>
          </div>
          <button
            aria-label="Tutup detail peserta"
            className="admin-close"
            onClick={onClose}
            type="button"
          >
            <AdminIcon name="close" />
          </button>
        </div>

        <div className="admin-dialog-body admin-form-grid">
          <div className="admin-detail-identity">
            <span aria-hidden="true" className="admin-avatar">
              {attendee.fullName.trim().charAt(0).toUpperCase() || "?"}
            </span>
            <div>
              <p className="admin-detail-name">{attendee.fullName}</p>
              <p className="admin-mono">{attendee.ticketCode}</p>
            </div>
            <span
              className={`admin-pill ${
                attendee.status === "HADIR" ? "admin-pill--hadir" : "admin-pill--belum"
              }`}
            >
              {attendee.status === "HADIR" ? "Hadir" : "Belum hadir"}
            </span>
          </div>

          <Group title="Identitas">
            <Field label="Nama lengkap" value={attendee.fullName || "—"} />
            <Field label="Nomor WhatsApp" value={attendee.whatsappNumber || "—"} />
            <Field
              label="Tempat, tanggal lahir"
              value={`${attendee.birthPlace || "—"}, ${birthDateLabel(attendee.birthDate)}`}
            />
            <Field label="Stasi asal / gereja" value={attendee.churchOrigin || "—"} />
            <Field label="Domisili" value={attendee.domicile || "—"} />
          </Group>

          <Group title="Asal dan kampus">
            <Field label="Kategori" value={readable(attendee.category)} />
            <Field label="Tipe pendaftar" value={readable(attendee.participantType)} />
            <Field label="Status akademik" value={readable(attendee.academicStatus)} />
            <Field label="Tahun kelulusan" value={attendee.graduationYear || "—"} />
            <Field label="Tipe kampus" value={readable(attendee.campusType)} />
            <Field label="Nama kampus" value={attendee.campusName || "—"} />
            <Field label="Fakultas" value={attendee.faculty || "—"} />
            <Field label="Program studi" value={attendee.studyProgram || "—"} />
            <Field label="Asal instansi" value={attendee.institution || "—"} />
            <Field label="Sumber informasi" value={readable(attendee.informationSource)} />
          </Group>

          <Group title="Pendaftaran dan presensi">
            <Field label="Kode tiket" value={attendee.ticketCode} />
            <Field label="Waktu daftar" value={formatWib(attendee.registeredAt)} />
            <Field label="Status" value={attendee.status === "HADIR" ? "Hadir" : "Belum hadir"} />
            <Field label="Waktu check-in" value={formatWib(attendee.checkedInAt)} />
            <Field label="Metode check-in" value={readable(attendee.checkinMethod)} />
          </Group>
        </div>

        <div className="admin-dialog-foot">
          <button className="admin-btn admin-btn-ghost" onClick={onClose} type="button">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
