"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  Heart,
  Moon,
  Battery,
  Sparkles,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";
import { HealthMetric, AiInsight } from "@/lib/db";

interface DashboardClientProps {
  metrics: HealthMetric[];
  insights: AiInsight[];
}

export default function DashboardClient({
  metrics,
  insights,
}: DashboardClientProps) {
  // Reverse metrics so chronological order is left-to-right on charts
  const chartData = useMemo(() => [...metrics].reverse(), [metrics]);

  const latestMetric = metrics[0] || null;
  const latestInsight = insights[0] || null;

  return (
    <div className="min-h-screen bg-[var(--color-japandi-bg)] text-[var(--color-japandi-text)] p-6 md:p-12 font-sans selection:bg-[var(--color-japandi-accent)] selection:text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* HEADER SECTION */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex justify-between items-end border-b border-[var(--color-japandi-border)] pb-6"
        >
          <div>
            <h1 className="text-4xl md:text-5xl font-light tracking-tight mb-2">
              Health{" "}
              <span className="text-[var(--color-japandi-accent)] font-medium">
                Signal
              </span>
            </h1>
            <p className="text-[var(--color-japandi-muted)] text-lg">
              Your minimal, AI-driven wellness overview.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm uppercase tracking-widest text-[var(--color-japandi-muted)] mb-1">
              Latest Sync
            </span>
            <span className="font-medium text-[var(--color-japandi-wood)]">
              {latestMetric
                ? new Date(latestMetric.date).toLocaleDateString()
                : "No data"}
            </span>
          </div>
        </motion.header>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Resting Heart Rate"
            value={
              latestMetric?.resting_heart_rate
                ? `${latestMetric.resting_heart_rate} bpm`
                : "--"
            }
            icon={<Heart className="w-5 h-5" />}
            delay={0.1}
          />
          <KpiCard
            title="Sleep Score"
            value={
              latestMetric?.sleep_score
                ? `${latestMetric.sleep_score}/100`
                : "--"
            }
            icon={<Moon className="w-5 h-5" />}
            delay={0.2}
          />
          <KpiCard
            title="Avg Stress"
            value={
              latestMetric?.avg_stress ? `${latestMetric.avg_stress}/100` : "--"
            }
            icon={<Activity className="w-5 h-5" />}
            delay={0.3}
          />
          <KpiCard
            title="Body Battery"
            value={
              latestMetric?.body_battery_charge
                ? `+${latestMetric.body_battery_charge}`
                : "--"
            }
            subValue={
              latestMetric?.body_battery_drain
                ? `-${latestMetric.body_battery_drain}`
                : ""
            }
            icon={<Battery className="w-5 h-5" />}
            delay={0.4}
          />
        </div>

        {/* TODAY'S AI INSIGHT SECTION */}
        <section className="space-y-8">
          <div className="flex items-center justify-between border-b border-[var(--color-japandi-border)] pb-4">
            <h2 className="text-2xl font-light tracking-tight flex items-center gap-3 italic text-[var(--color-japandi-wood)]">
              <Sparkles className="w-6 h-6 text-[var(--color-japandi-accent)]" />
              Today&apos;s Wellness Signal
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-12">
            {latestInsight && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="bg-[var(--color-japandi-card)] rounded-3xl p-8 md:p-10 border border-[var(--color-japandi-border)] shadow-sm relative overflow-hidden group hover:border-[var(--color-japandi-accent)]/30 transition-colors duration-500"
              >
                <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--color-japandi-accent)] opacity-5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:opacity-10 transition-opacity duration-700" />

                {/* Date Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--color-japandi-bg)] border border-[var(--color-japandi-border)] text-xs font-medium text-[var(--color-japandi-muted)] mb-8">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-japandi-accent)]" />
                  {new Date(latestInsight.date).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                <div className="flex flex-col lg:flex-row gap-12">
                  {/* Summary Section */}
                  <div className="lg:w-1/3">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-[var(--color-japandi-sage)] mb-4 flex items-center gap-2">
                      Summary
                    </h3>
                    <p className="text-xl md:text-2xl font-light leading-relaxed text-[var(--color-japandi-text)] italic">
                      &quot;{latestInsight.summary}&quot;
                    </p>
                  </div>

                  {/* Details Grid */}
                  <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Key Insights */}
                    {latestInsight.insights &&
                      latestInsight.insights.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-japandi-wood)] flex items-center gap-2 opacity-70">
                            <Lightbulb className="w-4 h-4" /> Key Insights
                          </h4>
                          <ul className="space-y-4">
                            {latestInsight.insights.map((text, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-4 text-[var(--color-japandi-text)]/90 leading-relaxed text-sm md:text-base"
                              >
                                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[var(--color-japandi-wood)]" />
                                <span>{text}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                    {/* Recommendations */}
                    {latestInsight.recommendations &&
                      latestInsight.recommendations.length > 0 && (
                        <div className="space-y-6">
                          <h4 className="text-xs font-semibold uppercase tracking-widest text-[var(--color-japandi-accent)] flex items-center gap-2 opacity-70">
                            <CheckCircle2 className="w-4 h-4" /> Action Plan
                          </h4>
                          <ul className="space-y-4">
                            {latestInsight.recommendations.map((rec, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-4 text-[var(--color-japandi-text)]/90 leading-relaxed text-sm md:text-base"
                              >
                                <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-[var(--color-japandi-accent)]" />
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* CHARTS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Heart & Stress Trends" delay={0.6}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRhr" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-japandi-accent)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-japandi-accent)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="var(--color-japandi-sage)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--color-japandi-sage)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-japandi-border)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => str.slice(5, 10)}
                  stroke="var(--color-japandi-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-japandi-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--color-japandi-bg)",
                    borderRadius: "12px",
                    border: "1px solid var(--color-japandi-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  itemStyle={{ color: "var(--color-japandi-text)" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Area
                  type="monotone"
                  name="Resting HR"
                  dataKey="resting_heart_rate"
                  stroke="var(--color-japandi-accent)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRhr)"
                />
                <Area
                  type="monotone"
                  name="Avg Stress"
                  dataKey="avg_stress"
                  stroke="var(--color-japandi-sage)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorStress)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Body Battery Flux" delay={0.7}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="var(--color-japandi-border)"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(str) => str.slice(5, 10)}
                  stroke="var(--color-japandi-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--color-japandi-muted)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-japandi-card)" }}
                  contentStyle={{
                    backgroundColor: "var(--color-japandi-bg)",
                    borderRadius: "12px",
                    border: "1px solid var(--color-japandi-border)",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  name="Wake"
                  dataKey="body_battery_charge"
                  fill="var(--color-japandi-wood)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  name="Sleep"
                  dataKey="body_battery_drain"
                  fill="var(--color-japandi-text)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  subValue,
  icon,
  delay,
}: {
  title: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-[var(--color-japandi-card)] rounded-2xl p-6 border border-[var(--color-japandi-border)] shadow-sm hover:shadow-md transition-shadow duration-300 group cursor-default"
    >
      <div className="text-[var(--color-japandi-muted)] mb-4 flex justify-between items-center group-hover:text-[var(--color-japandi-accent)] transition-colors duration-300">
        <span className="font-medium text-sm">{title}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <div className="text-3xl font-semibold text-[var(--color-japandi-text)]">
          {value}
        </div>
        {subValue && (
          <div className="text-lg text-[var(--color-japandi-muted)]">
            {subValue}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChartCard({
  title,
  children,
  delay,
}: {
  title: string;
  children: React.ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay }}
      className="bg-[var(--color-japandi-card)] rounded-2xl p-6 border border-[var(--color-japandi-border)] shadow-sm h-[400px] flex flex-col"
    >
      <h3 className="text-lg font-medium text-[var(--color-japandi-text)] mb-6">
        {title}
      </h3>
      <div className="flex-grow w-full">{children}</div>
    </motion.div>
  );
}
