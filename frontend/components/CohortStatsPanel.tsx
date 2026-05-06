"use client";

import { useEffect, useState } from "react";
import { getCohortStats, type CohortStats } from "@/lib/data/cohort";

export default function CohortStatsPanel() {
  const [stats, setStats] = useState<CohortStats | null>(null);
  const rows = [
    { label: "Students", value: stats ? stats.students.toLocaleString() : "..." },
    { label: "Top interest", value: stats?.topInterest ?? "..." },
    { label: "Active groups", value: stats ? stats.activeGroups.toLocaleString() : "..." },
  ];

  useEffect(() => {
    let active = true;

    getCohortStats()
      .then((items) => {
        if (active) setStats(items);
      })
      .catch(() => {
        if (active) setStats(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
        Cohort stats
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 text-[12.5px]">
            <span className="text-text-muted">{row.label}</span>
            <span className="min-w-0 truncate text-right font-medium text-text-primary">
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
