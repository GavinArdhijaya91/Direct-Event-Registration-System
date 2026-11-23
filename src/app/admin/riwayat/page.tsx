"use client";

import AdminIcon from "@/app/admin/admin-icons";
import { describeAuditLog } from "@/lib/admin-audit";
import { formatWib, useAdmin } from "@/app/admin/admin-context";

export default function AdminRiwayatPage() {
  const { dashboard } = useAdmin();

  return (
    <section aria-labelledby="riwayat-heading" className="admin-section">
      <div className="admin-section-head">
        <div>
          <p className="admin-kicker">Akun bersama</p>
          <h1 className="admin-section-title" id="riwayat-heading">
            Riwayat aktivitas admin
          </h1>
          <p className="admin-section-note">
            Maksimal 50 tindakan terbaru. Log menunjukkan perubahan, bukan
            identitas orang.
          </p>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-body">
          {dashboard.auditLogs.length > 0 ? (
            <ol className="admin-timeline">
              {dashboard.auditLogs.map((log) => (
                <li className="admin-timeline-item" key={log.id}>
                  <div className="admin-timeline-meta">
                    <span>{log.actor}</span>
                    <time dateTime={log.createdAt}>{formatWib(log.createdAt)}</time>
                  </div>
                  <p className="admin-timeline-text">{describeAuditLog(log)}</p>
                  {log.reason ? (
                    <p className="admin-timeline-reason">Alasan: {log.reason}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          ) : (
            <div className="admin-empty">
              <AdminIcon name="history" />
              <strong>Belum ada aktivitas tercatat</strong>
              <p>Perubahan pengaturan dan check-in manual akan muncul di sini.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
