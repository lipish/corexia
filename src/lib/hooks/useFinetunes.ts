"use client";
import {useEffect, useState} from "react";
import {finetunesMock, type Finetune} from "@/lib/mock/finetunes";

export function useFinetunes() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Finetune[]>([]);
  useEffect(() => {
    const t = setTimeout(() => { setData(finetunesMock); setLoading(false); }, 350);
    return () => clearTimeout(t);
  }, []);
  return {loading, data};
}

