"use client";
import {useEffect, useState} from "react";
import {datasetsMock, type Dataset} from "@/lib/mock/datasets";

export function useDatasets() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Dataset[]>([]);
  useEffect(() => {
    const t = setTimeout(() => { setData(datasetsMock); setLoading(false); }, 300);
    return () => clearTimeout(t);
  }, []);
  return {loading, data};
}

