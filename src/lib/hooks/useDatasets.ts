"use client";
import {useEffect, useState} from "react";
import {datasetsMock, type Dataset} from "@/lib/mock/datasets";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

export function useDatasets() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dataset[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let canceled = false;
    const ctrl = new AbortController();

    async function load() {
      try {
        const url = `${API_BASE}/datasets`;
        const token = typeof window !== "undefined" ? localStorage.getItem("corexia:token") : null;
        const headers: Record<string, string> = { accept: "application/json" };
        if (token) headers["authorization"] = `Bearer ${token}`;
        const res = await fetch(url, { signal: ctrl.signal, headers });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const json = await res.json();
        // Map API -> UI type
        const arr = Array.isArray(json) ? (json as unknown[]) : [];
        const toNum = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0));
        const mapped: Dataset[] = arr.map((raw) => {
          const d = raw as Record<string, unknown>;
          const sizeBytes = toNum(d.size_bytes);
          return {
            id: String(d.id ?? ""),
            name: String(d.name ?? ""),
            samples: toNum((d as Record<string, unknown>).samples_count),
            sizeMB: Math.max(0, Math.round(((sizeBytes) / (1024 * 1024)) * 10) / 10),
            createdAt: String(d.created_at ?? "").slice(0, 10),
          } as Dataset;
        });
        if (!canceled) setData(mapped);
      } catch (e) {
        // Fallback to mock if API not reachable
        if (!canceled) setData(datasetsMock);
      } finally {
        if (!canceled) setLoading(false);
      }
    }

    load();
    return () => { canceled = true; ctrl.abort(); };
  }, [version]);

  const reload = () => setVersion(v => v + 1);
  return {loading, data, reload};
}
