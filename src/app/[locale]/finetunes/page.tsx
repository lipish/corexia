"use client";
import { useMemo, useState } from "react";
import {useFinetunes} from "@/lib/hooks/useFinetunes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

function StatusBadge({s}:{s:"pending"|"running"|"succeeded"|"failed"}){
  const map: Record<string,string> = {
    pending: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
    running: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
    succeeded: "bg-green-500/20 text-green-700 dark:text-green-300",
    failed: "bg-red-500/20 text-red-700 dark:text-red-300"
  };
  return <span className={`px-2 py-0.5 rounded text-xs ${map[s]}`}>{s}</span>
}

export default function FinetunesPage() {
  const {loading, data} = useFinetunes();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"id"|"baseModel"|"status"|"updatedAt">("updatedAt");
  const [dir, setDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return data;
    return data.filter(x =>
      x.id.toLowerCase().includes(t) ||
      x.baseModel.toLowerCase().includes(t) ||
      x.status.toLowerCase().includes(t)
    );
  }, [q, data]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a,b) => {
      let av: number|string|Date; let bv: number|string|Date;
      if (sortBy === "id") { av = a.id; bv = b.id; }
      else if (sortBy === "baseModel") { av = a.baseModel; bv = b.baseModel; }
      else if (sortBy === "status") { av = a.status; bv = b.status; }
      else { av = new Date(a.updatedAt); bv = new Date(b.updatedAt); }
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
        <h1 className="text-2xl font-semibold">Finetunes</h1>
        <p className="text-muted-foreground">Track finetune jobs and results (mock).</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={q}
          onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
          placeholder="Search id/model/status..."
          className="w-[280px]"
        />
        <div className="ml-auto flex gap-2 items-center text-sm">
          <label>Sort</label>
          <select className="h-9 rounded-md border bg-background px-2" value={sortBy} onChange={(e)=>setSortBy(e.target.value as "updatedAt"|"id"|"baseModel"|"status")}>
            <option value="updatedAt">Updated</option>
            <option value="id">Job ID</option>
            <option value="baseModel">Base Model</option>
            <option value="status">Status</option>
          </select>
          <Button variant="outline" onClick={()=>setDir(d=>d==="asc"?"desc":"asc")}>{dir === "asc" ? "Asc" : "Desc"}</Button>
          <label>Rows</label>
          <select className="h-9 rounded-md border bg-background px-2" value={pageSize} onChange={(e)=>{ setPageSize(Number(e.target.value)); setPage(1); }}>
            <option>5</option>
            <option>10</option>
            <option>20</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Base Model</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
            ) : pageItems.length ? (
              pageItems.map(ft => (
                <TableRow key={ft.id}>
                  <TableCell className="font-mono">{ft.id}</TableCell>
                  <TableCell>{ft.baseModel}</TableCell>
                  <TableCell><StatusBadge s={ft.status}/></TableCell>
                  <TableCell>{ft.updatedAt}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={4}>No results</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-3 text-sm">
        <span>
          Page {current} / {totalPages} · {total} items
        </span>
        <Button variant="outline" disabled={current<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
        <Button variant="outline" disabled={current>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
      </div>
    </div>
  );
}

