"use client";

import { useT } from "@/lib/i18n";
import { useDashboardMetrics } from "@/lib/hooks/useDashboardMetrics";
import { MiniBar } from "@/components/charts/mini-bar";

export default function DashboardPage() {
  const t = useT("dashboard");
  const { loading, data } = useDashboardMetrics();
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Datasets", value: data.totals.datasets },
          { label: "Finetunes", value: data.totals.finetunes },
          { label: "Models", value: data.totals.models },
          { label: "Evaluations", value: data.totals.evaluations },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border p-4">
            <div className="text-sm text-muted-foreground">{m.label}</div>
            <div className="text-2xl font-semibold mt-1">{loading ? "—" : m.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-4">
        <div className="text-sm text-muted-foreground mb-2">Last 7 days inference</div>
        {loading ? (
          <div className="h-20 animate-pulse bg-muted rounded" />
        ) : (
          <MiniBar data={data.last7DaysInference} />
        )}
      </div>
    </div>
  );
}

