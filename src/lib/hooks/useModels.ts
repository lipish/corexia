"use client";
import {useEffect, useState} from "react";
import {modelsMock, type Model} from "@/lib/mock/models";

export function useModels() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Model[]>([]);
  useEffect(() => {
    const t = setTimeout(() => { setData(modelsMock); setLoading(false); }, 360);
    return () => clearTimeout(t);
  }, []);
  return {loading, data};
}

