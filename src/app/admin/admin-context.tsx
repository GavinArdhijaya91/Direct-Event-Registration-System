"use client";

import { createContext, useContext, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { AdminAuditEntry } from "@/lib/admin-audit";

export type Attendee = {
  ticketCode: string;
  fullName: string;
  whatsappNumber: string;
  birthPlace: string;
  birthDate: string;
  churchOrigin: string;
  domicile: string;
  participantType: string;
  academicStatus: string | null;
  graduationYear: string | null;
  campusType: string | null;
  campusName: string | null;
  faculty: string | null;
  studyProgram: string | null;
  category: string;
  institution: string;
  informationSource: string;
  status: "TERDAFTAR" | "HADIR";
  registeredAt: string;
  checkedInAt: string | null;
  checkinMethod: string | null;
};

export type EventSettings = {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  maxCapacity: number;
  registeredCount: number;
  registrationOpen: boolean;
  locationCode: string | null;
  qrMode: "STATIC" | "DYNAMIC";
  checkinOpensAt: string | null;
  checkinClosesAt: string | null;
};

export type DashboardData = {
  settings: EventSettings;
  auditLogs: AdminAuditEntry[];
  bulkDeletionAllowed: boolean;
  stats: {
    totalRegistered: number;
    totalCheckedIn: number;
    capacityRemaining: number;
  };
  attendees: Attendee[];
};

export type SettingsDraft = {
  eventName: string;
  eventDate: string;
  eventLocation: string;
  maxCapacity: string;
  registrationOpen: boolean;
  locationCode: string;
  qrMode: "STATIC" | "DYNAMIC";
  checkinOpensAt: string;
  checkinClosesAt: string;
  capacityOverrideReason: string;
};

export type AdminContextValue = {
  dashboard: DashboardData;
  draft: SettingsDraft;
  setDraft: Dispatch<SetStateAction<SettingsDraft>>;
  refresh: (updateDraft?: boolean) => Promise<void>;
  loading: boolean;
  pageError: string | null;
  setPageError: (value: string | null) => void;
  notice: string | null;
  setNotice: (value: string | null) => void;
  performCheckin: (ticketCode: string) => Promise<boolean>;
  checkingInTicketCode: string | null;
  openVenueQr: () => void;
  openWalkin: () => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ value, children }: { value: AdminContextValue; children: ReactNode }) {
  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const value = useContext(AdminContext);
  if (!value) {
    throw new Error("useAdmin harus dipakai di dalam panel admin.");
  }
  return value;
}

export function formatWib(value: string | null) {
  if (!value) {
    return "—";
  }
  return `${new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value))} WIB`;
}

export function dateToWibInput(value: string | null) {
  if (!value) {
    return "";
  }
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`;
}

export function wibInputToIso(value: string) {
  if (!value) {
    return null;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) {
    throw new Error("Format waktu check-in tidak valid.");
  }
  const [, year, month, day, hour, minute] = match;
  return new Date(
    Date.UTC(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour) - 7,
      Number(minute),
    ),
  ).toISOString();
}
