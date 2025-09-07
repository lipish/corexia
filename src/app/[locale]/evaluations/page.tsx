"use client";
import { useMemo, useState } from "react";
import {useEvaluations} from "@/lib/hooks/useEvaluations";

export default function EvaluationsPage() {
  const {loading, data} = useEvaluations();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"id"|"dataset"|"model"|"metric"|"score"|"createdAt">("score");
  const [dir, setDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data;
    return data.filter(x =>
      x.id.toLowerCase().includes(t) ||
      x.dataset.toLowerCase().includes(t) ||
      x.model.toLowerCase().includes(t) ||
      x.metric.toLowerCase().includes(t)
    );
  }, [q, data]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a,b) => {
      let av: number|string|Date; let bv: number|string|Date;
      if (sortBy === "score") { av = a.score; bv = b.score; }
      else if (sortBy === "createdAt") { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
      else { const key = sortBy as "id"|"dataset"|"model"|"metric"; av = a[key]; bv = b[key]; }
      const cmp = (av>bv) ? 1 : (av<bv ? -1 : 0);
      return dir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, dir]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = sorted.slice(start, start + pageSize);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Evaluations</h1>
        <p className="text-muted-foreground">View evaluation results and leaderboards (mock).</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
          placeholder="Search id/dataset/model/metric..."
          className="h-9 rounded-md border bg-background px-2 text-sm"
        />
        <div className="ml-auto flex gap-2 items-center text-sm">
          <label>Sort</label>
          <select className="h-9 rounded-md border bg-background px-2" value={sortBy} onChange={(e)=>setSortBy(e.target.value as "score"|"createdAt"|"id"|"dataset"|"model"|"metric")}>
            <option value="score">Score</option>
            <option value="createdAt">Created</option>
            <option value="id">Run ID</option>
            <option value="dataset">Dataset</option>
            <option value="model">Model</option>
            <option value="metric">Metric</option>
          </select>
          <button onClick={()=>setDir(d=>d==="asc"?"desc":"asc")} className="h-9 rounded-md border px-2">{dir === "asc" ? "Asc" : "Desc"}</button>
          <label>Rows</label>
          <select className="h-9 rounded-md border bg-background px-2" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
            <option>5</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Run ID</th>
              <th className="px-3 py-2 text-left">Dataset</th>
              <th className="px-3 py-2 text-left">Model</th>
              <th className="px-3 py-2 text-left">Metric</th>
              <th className="px-3 py-2 text-left">Score</th>
              <th className="px-3 py-2 text-left">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={6}>Loading...</td></tr>
            ) : pageItems.length ? (
              pageItems.map(ev => (
                <tr key={ev.id} className="border-t hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono">{ev.id}</td>
                  <td className="px-3 py-2">{ev.dataset}</td>
                  <td className="px-3 py-2">{ev.model}</td>
                  <td className="px-3 py-2">{ev.metric}</td>
                  <td className="px-3 py-2">{(ev.score * 100).toFixed(1)}%</td>
                  <td className="px-3 py-2">{ev.createdAt}</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-3 py-3" colSpan={6}>No results</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm">
        <span>
          Page {current} / {totalPages} · {total} items
        </span>
        <button className="h-8 rounded-md border px-2 disabled:opacity-50" disabled={current<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
        <button className="h-8 rounded-md border px-2 disabled:opacity-50" disabled={current>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
      </div>
    </div>
  );
}

