"use client";
import { useState, useMemo } from "react";
import {useDatasets} from "@/lib/hooks/useDatasets";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

export default function DatasetsPage() {
  const {loading, data} = useDatasets();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"name"|"samples"|"sizeMB"|"createdAt">("createdAt");
  const [dir, setDir] = useState<"asc"|"desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(d =>
      d.name.toLowerCase().includes(term)
    );
  }, [q, data]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a,b) => {
      let av: number|string|Date; let bv: number|string|Date;
      if (sortBy === "name") { av = a.name; bv = b.name; }
      else if (sortBy === "samples") { av = a.samples; bv = b.samples; }
      else if (sortBy === "sizeMB") { av = a.sizeMB; bv = b.sizeMB; }
      else { av = new Date(a.createdAt); bv = new Date(b.createdAt); }
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
        <h1 className="text-2xl font-semibold">Datasets</h1>
        <p className="text-muted-foreground">Manage datasets and sources (mock).</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Input
          value={q}
          onChange={(e)=>{ setQ(e.target.value); setPage(1); }}
          placeholder="Search name..."
          className="w-[240px]"
        />
        <div className="ml-auto flex gap-2 items-center text-sm">
          <label>Sort</label>
          <select className="h-9 rounded-md border bg-background px-2" value={sortBy} onChange={(e)=>setSortBy(e.target.value as "createdAt"|"name"|"samples"|"sizeMB")}>
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
            <option value="samples">Samples</option>
            <option value="sizeMB">Size</option>
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
              <TableHead>Name</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Size (MB)</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}>Loading...</TableCell></TableRow>
            ) : pageItems.length ? (
              pageItems.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.samples.toLocaleString()}</TableCell>
                  <TableCell>{d.sizeMB}</TableCell>
                  <TableCell>{d.createdAt}</TableCell>
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
          Page {current} / {totalPages} · {total} items
        </span>
        <Button variant="outline" disabled={current<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</Button>
        <Button variant="outline" disabled={current>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</Button>
      </div>
    </div>
  );
}

