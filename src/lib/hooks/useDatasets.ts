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
        const res = await fetch(url, { signal: ctrl.signal, headers: { "accept": "application/json" } });
        if (!res.ok) throw new Error(`http ${res.status}`);
        const json = await res.json();
        // Map API -> UI type
        const mapped: Dataset[] = (json as any[]).map((d) => ({
          id: d.id,
          name: d.name,
          samples: Number(d.samples_count ?? 0),
          sizeMB: Math.max(0, Math.round(((d.size_bytes ?? 0) / (1024 * 1024)) * 10) / 10),
          createdAt: String(d.created_at ?? "").slice(0, 10),
        }));
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
