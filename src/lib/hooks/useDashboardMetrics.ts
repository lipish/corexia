"use client";

import { useEffect, useState } from "react";
import { dashboardMetrics } from "@/lib/mock/metrics";

export function useDashboardMetrics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(dashboardMetrics);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  return { loading, data };
}

