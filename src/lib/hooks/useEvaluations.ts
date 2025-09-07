"use client";
import {useEffect, useState} from "react";
import {evaluationsMock, type Evaluation} from "@/lib/mock/evaluations";

export function useEvaluations() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Evaluation[]>([]);
  useEffect(() => {
    const t = setTimeout(() => { setData(evaluationsMock); setLoading(false); }, 380);
    return () => clearTimeout(t);
  }, []);
  return {loading, data};
}

