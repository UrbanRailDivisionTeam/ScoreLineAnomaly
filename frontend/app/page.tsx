"use client";

import { useEffect, useState, useRef } from "react";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";

const API_BASE = "http://127.0.0.1:8001";

// 类型定义
interface KPIData {
  total_anomalies: number;
  total_filtered?: number;
  open_count: number;
  closed_count: number;
  avg_process_hours: number;
  responsibility: Record<string, { count: number; percentage: number }>;
}

interface FullAnalysisData {
  kpi: KPIData;
  trend: Array<{ 提报月份: string; count: number }>;
  per_car_trend: Array<{ 年月半月: string; avg_per_car: number; total_count: number; unique_cars: number }>;
  projects: Array<{ project: string; count: number; percentage: number }>;
  trains: Array<{ train: string; count: number }>;
  phenomena: Array<{ phenomenon: string; count: number; percentage: number }>;
  failure_modes: Array<{ mode: string; count: number; cumulative: number }>;
  failure_causes_pareto: Array<{ cause: string; count: number; cumulative: number }>;
  failure_cause_rectifiers: Array<{ cause: string; total_count: number; persons: Array<{ name: string; count: number }> }>;
  responsibility_diagnosis_persons: Array<{ unit: string; total_count: number; persons: Array<{ name: string; count: number }> }>;
  missing_stats: { missing_count: number; total_count: number; missing_rate: number };
  missing_by_project: Array<{ project: string; count: number; total_count: number; rate: number }>;
  responsibility: { by_type: Record<string, number>; by_unit: Record<string, number>; top_units: Array<{ unit: string; count: number }> };
  efficiency: { distribution: Array<{ range: string; count: number }>; team_comparison: Array<{ team: string; avg_hours: number; count: number }> };
  wordcloud: { phenomena: Array<{ word: string; count: number }>; solutions: Array<{ word: string; count: number }> };
  person_rankings: Array<{ name: string; count: number }>;
  status_distribution: { stages: Array<{ name: string; count: number }> };
  configurations: Array<{ config: string; count: number; percentage: number }>;
  project_config_heatmap: { projects: string[]; configs: string[]; data: Array<{ '项目号.项目简称': string; '产品构型名称.构型项名称': string; count: number }> };
  sankey: { nodes: Array<{ name: string }>; links: Array<{ source: string; target: string; value: number }> };
  anomaly_categories: Array<{ category: string; count: number }>;
  process_steps: Array<{ step: string; count: number }>;
  diagnosis_person_workload: Array<{ name: string; avg_hours: number; count: number }>;
  hourly_trend: Array<{ hour: string; count: number }>;
  image_attachment_rate: { with_image: number; total: number; rate: number };
  rework_basis: Array<{ type: string; count: number }>;
  unit_failure_cross: { units: string[]; modes: string[]; data: Array<{ 责任单位: string; 失效模式: string; count: number }> };
  team_radar: Array<{ team: string; indicators: Array<{ mode: string; value: number }> }>;
  train_position_heatmap: Array<{ position: string; count: number }>;
  line_segments: Array<{ 起始位置: string; 终止位置: string; value: number }>;
}

// 温暖科技配色方案 - Ethereal Precision
const COLORS = {
  primary: "#9a0011",
  primaryContainer: "#c70019",
  secondary: "#825154",
  secondaryContainer: "#febfc2",
  background: "#f8f9fa",
  surfaceLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainer: "#ebecef",
  surfaceContainerHigh: "#e1e3e4",
  onSurface: "#191c1d",
  onSurfaceVariant: "#4f4440",
  outline: "#81736c",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#c70019",
  accent: "#3b82f6",
  chartPalette: ["#c70019", "#825154", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"],
};

export default function DashboardPage() {
  const [data, setData] = useState<FullAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [noData, setNoData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    setNoData(false);
    fetch(`${API_BASE}/api/full-analysis`)
      .then((res) => {
        if (!res.ok) throw new Error("API请求失败");
        return res.json();
      })
      .then((result) => {
        if (result.error || result.data === null) {
          setNoData(true);
          setData(null);
        } else {
          setData(result);
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setUploadStatus("请选择 .xlsx 或 .xls 文件");
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch(`${API_BASE}/api/upload`, { method: "POST", body: formData });
      if (!res.ok) throw new Error((await res.json()).detail || "上传失败");
      const result = await res.json();
      setUploadStatus(`上传成功: ${file.name} (${result.rows} 行数据)`);
      fetchData();
    } catch (err: any) {
      setUploadStatus(`上传失败: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-2 border-[#c70019] animate-pulse rounded-full"></div>
            <div className="absolute inset-2 border-2 border-[#c70019]/50 animate-ping rounded-full"></div>
          </div>
          <p className="text-xl font-body text-[#4f4440]">数据加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f8f9fa]">
        <div className="text-center">
          <p className="text-xl mb-2 text-[#c70019] font-display">加载失败</p>
          <p className="text-[#4f4440] font-body">请确保后端服务运行在 http://127.0.0.1:8001</p>
        </div>
      </div>
    );
  }

  if (noData || !data) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-6">
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-center text-[#191c1d] tracking-tight mb-8" style={{ letterSpacing: "-0.02em" }}>
          校线质量异常分析
        </h1>
        <div className="flex flex-col items-center gap-6">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-[#4f4440] mb-2 font-body">暂无数据</p>
            <p className="text-sm text-[#81736c]">请上传 Excel 数据文件以查看分析结果</p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-6 py-3 font-body text-base font-medium text-white rounded-lg transition-all duration-300 btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  上传中...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  选择 Excel 文件
                </>
              )}
            </button>
            {uploadStatus && (
              <p className={`text-sm font-body ${uploadStatus.includes("成功") ? "text-[#10b981]" : "text-[#c70019]"}`}>
                {uploadStatus}
              </p>
            )}
          </div>
          <p className="text-xs text-[#81736c] mt-4 font-body">支持 .xlsx 和 .xls 格式</p>
        </div>
      </div>
    );
  }

  const baseTheme = {
    backgroundColor: "transparent",
    textStyle: { color: COLORS.onSurfaceVariant },
    title: { textStyle: { color: COLORS.onSurface } },
    legend: { textStyle: { color: COLORS.onSurfaceVariant } },
  };

  // KPI Cards
  const kpiCards = [
    { label: "总异常数", value: data.kpi.total_anomalies, unit: "条", accent: COLORS.primaryContainer },
    { label: "缺失项数", value: data.missing_stats.missing_count, unit: "条", accent: COLORS.warning },
    { label: "有效分析数", value: data.kpi.total_filtered || (data.kpi.total_anomalies - data.missing_stats.missing_count), unit: "条", accent: COLORS.success },
    { label: "平均处理时长", value: data.kpi.avg_process_hours, unit: "小时", accent: COLORS.accent },
  ];

  // 图表配置
  const perCarTrendData = data.per_car_trend || [];
  const avgValues = perCarTrendData.map(d => d.avg_per_car);
  const avg = avgValues.length > 0 ? avgValues.reduce((a, b) => a + b, 0) / avgValues.length : 0;
  const stdDev = avgValues.length > 0 ? Math.sqrt(avgValues.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / avgValues.length) : 0;
  const ucl = avg + 3 * stdDev;
  const lcl = Math.max(0, avg - 3 * stdDev);

  const perCarTrendOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    legend: { data: ["每节车均值", "控制限"], textStyle: { color: COLORS.onSurfaceVariant }, top: "3%" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "15%", containLabel: true },
    xAxis: { type: "category", data: perCarTrendData.map(d => d.年月半月), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10, rotate: 15 }, name: "半月" },
    yAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } }, name: "均值" },
    series: [
      {
        name: "每节车均值",
        type: "line",
        smooth: true,
        data: perCarTrendData.map(d => d.avg_per_car),
        lineStyle: { color: COLORS.accent, width: 2 },
        itemStyle: { color: (params: any) => { const value = params.value; return value > ucl || value < lcl ? COLORS.danger : COLORS.accent; } },
        areaStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "rgba(59,130,246,0.3)" }, { offset: 1, color: "rgba(59,130,246,0.05)" }] } },
        markLine: { silent: true, symbol: "none", lineStyle: { type: "dashed", width: 1 }, data: [
          { type: "average", name: "均值(CL)", yAxis: avg, lineStyle: { color: COLORS.accent } },
          { type: "average", name: "UCL", yAxis: ucl, lineStyle: { color: COLORS.danger } },
          { type: "average", name: "LCL", yAxis: lcl, lineStyle: { color: COLORS.success } },
        ], label: { formatter: "{b}: {c}", color: COLORS.onSurfaceVariant, fontSize: 9 } }
      }
    ],
  };

  const statusOption = {
    ...baseTheme,
    tooltip: { trigger: "item" },
    legend: { bottom: "5%", textStyle: { color: COLORS.onSurfaceVariant } },
    series: [{ type: "funnel", left: "10%", top: 20, bottom: 50, width: "80%", min: 0, max: 100, minSize: "0%", maxSize: "100%", sort: "descending", gap: 2, label: { show: true, position: "inside", color: "#fff" }, labelLine: { show: false }, itemStyle: { borderColor: COLORS.background, borderWidth: 1 }, data: data.status_distribution.stages.map((s, i) => ({ name: s.name, value: s.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })) }],
  };

  const projectOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "25%", top: "3%", containLabel: true },
    xAxis: { type: "category", data: data.projects.map(p => p.project), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 9, rotate: 30 }, name: "项目" },
    yAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } }, name: "数量" },
    series: [{ type: "bar", data: data.projects.map((p, i) => ({ value: p.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] }, label: { show: true, position: "top", color: "#fff", fontSize: 9 } })), barWidth: "60%" }],
  };

  const trainOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "category", data: data.trains.map(t => t.train).reverse(), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10 } },
    series: [{ type: "bar", data: data.trains.map(t => t.count).reverse(), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#fce4e6" }, { offset: 1, color: COLORS.primaryContainer }] } }, barWidth: "55%"}],
  };

  const configOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c}" },
    series: [{ type: "treemap", width: "95%", height: "85%", top: "5%", bottom: "5%", left: "2.5%", right: "2.5%", label: { show: true, formatter: "{b}", color: "#fff", fontSize: 11 }, itemStyle: { borderColor: COLORS.background, borderWidth: 2, gapWidth: 2 }, data: data.configurations.map((c, i) => ({ name: c.config, value: c.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })), levels: [{ itemStyle: { borderColor: COLORS.background, borderWidth: 4, gapWidth: 4 } }] }],
  };

  const heatmapOption = {
    ...baseTheme,
    tooltip: { trigger: "item" },
    grid: { left: "2%", right: "4%", bottom: "15%", top: "5%" },
    xAxis: { type: "category", data: data.project_config_heatmap.configs?.slice(0, 10) || [], axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 30, fontSize: 9 }, splitArea: { show: true, areaStyle: { color: [COLORS.surfaceContainerLow, COLORS.background] } } },
    yAxis: { type: "category", data: data.project_config_heatmap.projects?.slice(0, 8) || [], axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10 }, splitArea: { show: true, areaStyle: { color: [COLORS.surfaceContainerLow, COLORS.background] } } },
    visualMap: { min: 0, max: 50, calculable: true, orient: "horizontal", left: "center", bottom: "5%", textStyle: { color: COLORS.onSurfaceVariant }, inRange: { color: [COLORS.surfaceContainerHigh, COLORS.accent, COLORS.warning, COLORS.danger] } },
    series: [{ type: "heatmap", data: (data.project_config_heatmap.data || []).map(d => [data.project_config_heatmap.configs?.indexOf(d['产品构型名称.构型项名称']) || 0, data.project_config_heatmap.projects?.indexOf(d['项目号.项目简称']) || 0, d.count]), label: { show: true, color: "#fff", fontSize: 10 }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.5)" } } }],
  };

  const phenomenonData = data.phenomena.slice(0, 15);
  const phenomenonTotal = phenomenonData.reduce((sum, p) => sum + p.count, 0);
  let phenomenonCumulative = 0;
  const phenomenonCumulativeData = phenomenonData.map(p => { phenomenonCumulative += p.count; return Math.round(phenomenonCumulative / phenomenonTotal * 100); });

  const phenomenonOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    legend: { data: ["数量", "累计占比"], textStyle: { color: COLORS.onSurfaceVariant }, top: "3%" },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "18%" },
    xAxis: { type: "category", data: phenomenonData.map(f => f.phenomenon), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 25, fontSize: 9 } },
    yAxis: [{ type: "value", name: "数量", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } }, { type: "value", name: "累计%", min: 0, max: 100, axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { show: false } }],
    series: [{ name: "数量", type: "bar", data: phenomenonData.map(f => f.count), itemStyle: { color: "#8b5cf6" } }, { name: "累计占比", type: "line", yAxisIndex: 1, data: phenomenonCumulativeData, lineStyle: { color: COLORS.warning }, itemStyle: { color: COLORS.warning }, smooth: true }],
  };

  const failureModeData = data.failure_modes.slice(0, 15);
  const failureModeTotal = failureModeData.reduce((sum, p) => sum + p.count, 0);
  let failureModeCumulative = 0;
  const failureModeCumulativeData = failureModeData.map(p => { failureModeCumulative += p.count; return Math.round(failureModeCumulative / failureModeTotal * 100); });

  const failureModeOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    legend: { data: ["数量", "累计占比"], textStyle: { color: COLORS.onSurfaceVariant }, top: "3%" },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "18%" },
    xAxis: { type: "category", data: failureModeData.map(f => f.mode), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 25, fontSize: 9 } },
    yAxis: [{ type: "value", name: "数量", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } }, { type: "value", name: "累计%", min: 0, max: 100, axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { show: false } }],
    series: [{ name: "数量", type: "bar", data: failureModeData.map(f => f.count), itemStyle: { color: COLORS.accent } }, { name: "累计占比", type: "line", yAxisIndex: 1, data: failureModeCumulativeData, lineStyle: { color: COLORS.warning }, itemStyle: { color: COLORS.warning }, smooth: true }],
  };

  const failureCauseData = data.failure_causes_pareto.slice(0, 15);
  const failureCauseTotal = failureCauseData.reduce((sum, p) => sum + p.count, 0);
  let failureCauseCumulative = 0;
  const failureCauseCumulativeData = failureCauseData.map(p => { failureCauseCumulative += p.count; return Math.round(failureCauseCumulative / failureCauseTotal * 100); });

  const failureCauseOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    legend: { data: ["数量", "累计占比"], textStyle: { color: COLORS.onSurfaceVariant }, top: "3%" },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "18%" },
    xAxis: { type: "category", data: failureCauseData.map(f => f.cause), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 25, fontSize: 9 } },
    yAxis: [{ type: "value", name: "数量", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } }, { type: "value", name: "累计%", min: 0, max: 100, axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { show: false } }],
    series: [{ name: "数量", type: "bar", data: failureCauseData.map(f => f.count), itemStyle: { color: COLORS.danger } }, { name: "累计占比", type: "line", yAxisIndex: 1, data: failureCauseCumulativeData, lineStyle: { color: COLORS.warning }, itemStyle: { color: COLORS.warning }, smooth: true }],
  };

  const missingByProjectOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "20%", top: "3%", containLabel: true },
    xAxis: { type: "category", data: data.missing_by_project.map(p => p.project), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 9, rotate: 30 } },
    yAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } }, name: "缺失数" },
    series: [{ type: "bar", data: data.missing_by_project.map((p, i) => ({ value: p.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] }, label: { show: true, position: "top", color: "#fff", fontSize: 9, formatter: (params: any) => `${data.missing_by_project[params.dataIndex]?.rate || 0}%` } })), barWidth: "50%" }],
  };

  const sankeyOption = {
    ...baseTheme,
    tooltip: { trigger: "item" },
    series: [{ type: "sankey", layout: "none", nodeAlign: "left", nodeGap: 12, nodeWidth: 20, lineStyle: { color: "gradient", curveness: 0.5 }, label: { color: "#fff", fontSize: 11 }, data: data.sankey.nodes?.map(n => ({ name: n.name })) || [], links: (data.sankey.links || []).map(l => ({ source: l.source, target: l.target, value: l.value })), emphasis: { focus: "adjacency" } }],
  };

  const responsibilityOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: "2%", top: "center", textStyle: { color: COLORS.onSurfaceVariant } },
    series: [{ type: "pie", radius: ["45%", "75%"], center: ["35%", "50%"], avoidLabelOverlap: false, itemStyle: { borderColor: COLORS.background, borderWidth: 3 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 15, fontWeight: "bold" } }, data: Object.entries(data.kpi.responsibility).map(([name, info], i) => ({ value: info.count, name, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })) }],
  };

  const unitRankingOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "category", data: data.responsibility.top_units.map(u => u.unit).reverse(), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10 } },
    series: [{ type: "bar", data: data.responsibility.top_units.map(u => u.count).reverse(), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#fce4e6" }, { offset: 1, color: COLORS.danger }] } }, barWidth: "55%"}],
  };

  const unitFailureOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: { data: data.unit_failure_cross.modes?.slice(0, 6) || [], textStyle: { color: COLORS.onSurfaceVariant, fontSize: 9 }, top: "3%" },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "18%" },
    xAxis: { type: "category", data: data.unit_failure_cross.units?.slice(0, 8) || [], axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 20, fontSize: 9 } },
    yAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: data.unit_failure_cross.modes?.slice(0, 6).map((mode, i) => ({
      name: mode, type: "bar", stack: "total", itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] },
      data: data.unit_failure_cross.units?.slice(0, 8).map(unit => {
        const item = data.unit_failure_cross.data?.find(d => d['责任单位'] === unit && d['失效模式'] === mode);
        return item ? item.count : 0;
      })
    })) || [],
  };

  const efficiencyOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "category", data: data.efficiency.distribution.map(d => d.range), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant } },
    yAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [{ type: "bar", data: data.efficiency.distribution.map(d => d.count), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.danger }, { offset: 1, color: COLORS.success }] } }, barWidth: "45%"}],
  };

  const teamBubbleOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: 工单{c}, 平均{h}小时" },
    grid: { left: "3%", right: "4%", bottom: "10%", top: "5%" },
    xAxis: { type: "value", name: "工单数", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "value", name: "平均时长(h)", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [{ type: "scatter", symbolSize: 20, data: data.efficiency.team_comparison.map(t => ({ name: t.team, value: [t.count, t.avg_hours, t.count], itemStyle: { color: t.avg_hours > 72 ? COLORS.danger : t.avg_hours > 48 ? COLORS.warning : COLORS.success } })), label: { show: true, formatter: "{b}", color: "#fff", fontSize: 9, position: "right" } }],
  };

  const wordCloudPhenOption = {
    ...baseTheme,
    tooltip: { formatter: (p: any) => `${p.name}: ${p.value}次` },
    series: [{ type: "treemap", width: "95%", height: "85%", top: "8%", left: "center", label: { show: true, formatter: "{b}", fontSize: 10, color: "#fff" }, data: data.wordcloud.phenomena.slice(0, 30).map((w, i) => ({ name: w.word, value: w.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })), levels: [{ itemStyle: { borderWidth: 2, gapWidth: 2 } }] }],
  };

  const wordCloudSolOption = {
    ...baseTheme,
    tooltip: { formatter: (p: any) => `${p.name}: ${p.value}次` },
    series: [{ type: "treemap", width: "95%", height: "85%", top: "8%", left: "center", label: { show: true, formatter: "{b}", fontSize: 10, color: "#fff" }, data: data.wordcloud.solutions.slice(0, 30).map((w, i) => ({ name: w.word, value: w.count, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })), levels: [{ itemStyle: { borderWidth: 2, gapWidth: 2 } }] }],
  };

  const personOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "category", data: data.person_rankings.map(p => p.name).reverse(), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10 } },
    series: [{ type: "bar", data: data.person_rankings.map(p => p.count).reverse(), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#fce4e6" }, { offset: 1, color: COLORS.danger }] } }, barWidth: "55%"}],
  };

  const teamRadarModes = data.team_radar?.[0]?.indicators?.map(i => i.mode) || [];
  const maxRadarValue = Math.max(30, ...(data.team_radar?.flatMap(t => t.indicators.map(ind => ind.value)) || [30]));
  const teamRadarOption = {
    ...baseTheme,
    tooltip: { trigger: "item" },
    legend: { bottom: "5%", textStyle: { color: COLORS.onSurfaceVariant } },
    radar: { indicator: teamRadarModes.map(m => ({ name: m, max: maxRadarValue })), shape: "polygon", splitNumber: 4, axisName: { color: COLORS.onSurfaceVariant, fontSize: 9 }, splitLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, splitArea: { areaStyle: { color: [COLORS.surfaceContainerLow, COLORS.background] } } },
    series: [{ type: "radar", data: data.team_radar?.map((t, i) => ({ name: t.team, value: t.indicators.map(ind => ind.value), itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] }, areaStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length], opacity: 0.2 } })) || [] }],
  };

  const trainPosOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "5%" },
    xAxis: { type: "category", data: data.train_position_heatmap.map(p => p.position), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 30, fontSize: 9 } },
    yAxis: { type: "value", name: "故障数", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [{
      type: "bar",
      data: data.train_position_heatmap.map(p => {
        return {
          value: p.count,
          itemStyle: {
            color: {
              type: "linear",
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: COLORS.danger },
                { offset: 1, color: COLORS.accent }
              ]
            }
          }
        };
      }),
      label: { show: true, position: "top", color: "#fff", fontSize: 10 }
    }],
  };

  const lineSegOption = {
    ...baseTheme,
    tooltip: { trigger: "item" },
    grid: { left: "3%", right: "4%", bottom: "15%", top: "5%" },
    xAxis: { type: "category", data: [...new Set([...data.line_segments.map(s => s.起始位置), ...data.line_segments.map(s => s.终止位置)])].slice(0, 12), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, rotate: 30, fontSize: 9 } },
    yAxis: { type: "category", data: ["起点", "终点"], axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [
      { type: "effectScatter", symbolSize: 18, data: [...new Set(data.line_segments.map(s => s.起始位置))].slice(0, 12).map((p, i) => [i, 0]), rippleEffect: { brushType: "stroke", scale: 3 }, itemStyle: { color: COLORS.chartPalette[0] } },
      { type: "effectScatter", symbolSize: 18, data: [...new Set(data.line_segments.map(s => s.终止位置))].slice(0, 12).map((p, i) => [i, 1]), rippleEffect: { brushType: "stroke", scale: 3 }, itemStyle: { color: COLORS.chartPalette[1] } }
    ],
  };

  const anomalyCatOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", right: "2%", top: "center", textStyle: { color: COLORS.onSurfaceVariant } },
    series: [{ type: "pie", radius: ["40%", "70%"], center: ["40%", "50%"], avoidLabelOverlap: false, itemStyle: { borderColor: COLORS.background, borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: "bold" } }, data: data.anomaly_categories.map((c, i) => ({ value: c.count, name: c.category, itemStyle: { color: COLORS.chartPalette[i % COLORS.chartPalette.length] } })) }],
  };

  const processStepsOption = {
    ...baseTheme,
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "value", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "category", data: data.process_steps.map(s => s.step).reverse(), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant, fontSize: 10 } },
    series: [{ type: "bar", data: data.process_steps.map(s => s.count).reverse(), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 1, y2: 0, colorStops: [{ offset: 0, color: "#fce4e6" }, { offset: 1, color: COLORS.danger }] } }, barWidth: "55%"}],
  };

  const diagWorkloadOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: 工单{c}, 平均{h}小时" },
    grid: { left: "3%", right: "4%", bottom: "10%", top: "5%" },
    xAxis: { type: "value", name: "工单数", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    yAxis: { type: "value", name: "平均时长(h)", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [{
      type: "scatter",
      symbolSize: 25,
      data: data.diagnosis_person_workload.map(d => ({ name: d.name, value: [d.count, d.avg_hours, d.count], itemStyle: { color: d.avg_hours > 48 ? COLORS.danger : COLORS.success } })),
      label: { show: true, formatter: "{b}", color: "#fff", fontSize: 9, position: "right" }
    }],
  };

  const hourlyOption = {
    ...baseTheme,
    tooltip: { trigger: "axis" },
    grid: { left: "3%", right: "4%", bottom: "3%", top: "3%", containLabel: true },
    xAxis: { type: "category", data: data.hourly_trend.map(h => h.hour + "时"), axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant } },
    yAxis: { type: "value", name: "异常数", axisLine: { lineStyle: { color: COLORS.surfaceContainerHigh } }, axisLabel: { color: COLORS.onSurfaceVariant }, splitLine: { lineStyle: { color: COLORS.surfaceContainerLow } } },
    series: [{ type: "bar", data: data.hourly_trend.map(h => h.count), itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: COLORS.accent }, { offset: 1, color: "#06b6d4" }] } }, barWidth: "60%"}],
  };

  const imageRateOption = {
    ...baseTheme,
    tooltip: { formatter: "{c}%" },
    series: [{ type: "gauge", center: ["50%", "60%"], radius: "80%", startAngle: 200, endAngle: -20, min: 0, max: 100, splitNumber: 10, itemStyle: { color: COLORS.success }, progress: { show: true, width: 20 }, pointer: { show: true, length: "60%", width: 6 }, axisLine: { lineStyle: { color: [[1, COLORS.surfaceContainerHigh]] } }, axisTick: { show: true, distance: -20, length: 5 }, splitLine: { distance: -20, length: 10 }, axisLabel: { color: COLORS.onSurfaceVariant, distance: -30 }, detail: { valueAnimation: true, formatter: "{value}%", color: "#fff", fontSize: 24, offsetCenter: [0, "40%"] }, data: [{ value: data.image_attachment_rate.rate }] }],
  };

  const reworkBasisOption = {
    ...baseTheme,
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { bottom: "5%", textStyle: { color: COLORS.onSurfaceVariant } },
    series: [{ type: "pie", radius: ["40%", "70%"], center: ["50%", "50%"], avoidLabelOverlap: false, itemStyle: { borderColor: COLORS.background, borderWidth: 3 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 16, fontWeight: "bold" } }, data: data.rework_basis.map((r, i) => ({ value: r.count, name: r.type, itemStyle: { color: i === 0 ? COLORS.success : COLORS.warning } })) }],
  };

  return (
    <div className="min-h-screen p-4 md:p-6 lg:p-8 bg-[#f8f9fa]">
      {/* 标题栏 - Editorial Style */}
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-[#191c1d] tracking-tight" style={{ letterSpacing: "-0.02em" }}>
          校线质量异常分析
        </h1>
        <p className="font-body text-sm text-[#4f4440] mt-2">Ethereal Precision · 数据可视化</p>
        <div className="flex flex-col items-center mt-6 gap-3">
          <div className="flex items-center gap-4">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-5 py-2.5 font-body text-sm font-medium text-white rounded-lg transition-all duration-300 btn-primary flex items-center gap-2"
            >
              {uploading ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              )}
              {uploading ? "上传中..." : "选择Excel"}
            </button>
            <button
              onClick={fetchData}
              className="px-5 py-2.5 font-body text-sm font-medium text-[#9a0011] rounded-lg transition-all duration-300 btn-secondary"
            >
              刷新数据
            </button>
          </div>
          {uploadStatus && (
            <p className={`text-xs font-body ${uploadStatus.includes("成功") ? "text-[#10b981]" : "text-[#c70019]"}`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </header>

      {/* KPI卡片 - No-Line效果，通过背景色差分层 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-0 mb-8">
        {kpiCards.map((card, i) => (
          <div
            key={i}
            className={`p-6 ${i === 0 ? "bg-[#ffffff]" : i === 2 ? "bg-[#f3f4f5]" : "bg-[#ebecef]"}`}
            style={{ borderRadius: "8px" }}
          >
            <p className="text-[#4f4440] text-xs font-body mb-2 tracking-wide label-uppercase">{card.label}</p>
            <p className="text-3xl md:text-4xl font-display font-semibold text-[#191c1d]">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
              <span className="text-xs text-[#4f4440] ml-1 font-body">{card.unit}</span>
            </p>
            <div className="mt-3 h-0.5 w-12 bg-gradient-to-r from-[#c70019] to-transparent" style={{ borderRadius: "2px" }}></div>
          </div>
        ))}
      </section>

      {/* 第一行 */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-[#ffffff] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#c70019] tracking-wide">每节车平均异常数量（SPC）</h2>
          <ReactECharts option={perCarTrendOption} style={{ height: "220px" }} />
        </div>
        <div className="bg-[#f3f4f5] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#825154] tracking-wide">项目分布</h2>
          <ReactECharts option={projectOption} style={{ height: "320px" }} />
        </div>
        <div className="bg-[#ffffff] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#3b82f6] tracking-wide">故障频发列车 Top10</h2>
          <ReactECharts option={trainOption} style={{ height: "220px" }} />
        </div>
      </section>

      {/* 第二行 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#f3f4f5] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#8b5cf6] tracking-wide">现象分类帕累托</h2>
          <ReactECharts option={phenomenonOption} style={{ height: "260px" }} />
        </div>
        <div className="bg-[#ffffff] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#06b6d4] tracking-wide">核心失效模式(帕累托)</h2>
          <ReactECharts option={failureModeOption} style={{ height: "260px" }} />
        </div>
      </section>

      {/* 第三行 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#ffffff] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#c70019] tracking-wide">失效原因帕累托</h2>
          <ReactECharts option={failureCauseOption} style={{ height: "260px" }} />
        </div>
        <div className="bg-[#f3f4f5] p-5 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-3 text-[#f59e0b] tracking-wide">各项目缺失项统计</h2>
          <ReactECharts option={missingByProjectOption} style={{ height: "260px" }} />
        </div>
      </section>

      {/* 第四行：失效原因与Top诊断人表格 */}
      <section className="mb-6">
        <div className="bg-[#ebecef] p-6 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-4 text-[#06b6d4] tracking-wide">各失效原因Top10诊断人</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-[#4f4440] border-b border-[#d4d7d9]">
                  <th className="px-4 py-3 text-left w-48 font-medium">失效原因</th>
                  <th className="px-4 py-3 text-center w-20 font-medium">总数</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="px-4 py-3 text-center min-w-24 font-medium">Top{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.failure_cause_rectifiers.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#ebecef] hover:bg-[#f3f4f5] transition-colors">
                    <td className="px-4 py-3 text-[#191c1d] text-left font-medium" title={row.cause}>{row.cause.length > 20 ? row.cause.slice(0, 20) + '...' : row.cause}</td>
                    <td className="px-4 py-3 text-center text-[#c70019] font-semibold">{row.total_count}</td>
                    {Array.from({ length: 10 }, (_, i) => {
                      const person = row.persons[i];
                      return (
                        <td key={i} className="px-4 py-3 text-center text-[#4f4440]">
                          {person ? `${person.name} (${person.count})` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 第五行：责任单位与Top诊断人表格 */}
      <section className="mb-6">
        <div className="bg-[#f3f4f5] p-6 rounded-lg">
          <h2 className="text-sm font-display font-medium mb-4 text-[#825154] tracking-wide">各责任单位Top10诊断人</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="text-[#4f4440] border-b border-[#d4d7d9]">
                  <th className="px-4 py-3 text-left w-48 font-medium">责任单位</th>
                  <th className="px-4 py-3 text-center w-20 font-medium">总数</th>
                  {Array.from({ length: 10 }, (_, i) => (
                    <th key={i} className="px-4 py-3 text-center min-w-24 font-medium">Top{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.responsibility_diagnosis_persons.map((row, idx) => (
                  <tr key={idx} className="border-b border-[#f3f4f5] hover:bg-[#ebecef] transition-colors">
                    <td className="px-4 py-3 text-[#191c1d] text-left font-medium" title={row.unit}>{row.unit.length > 20 ? row.unit.slice(0, 20) + '...' : row.unit}</td>
                    <td className="px-4 py-3 text-center text-[#c70019] font-semibold">{row.total_count}</td>
                    {Array.from({ length: 10 }, (_, i) => {
                      const person = row.persons[i];
                      return (
                        <td key={i} className="px-4 py-3 text-center text-[#4f4440]">
                          {person ? `${person.name} (${person.count})` : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="mt-8 text-center">
        <p className="text-[#81736c] text-xs font-body tracking-wide">
          校线质量异常分析系统 · Ethereal Precision | 共 {data.kpi.total_anomalies} 条异常 | 缺失 {data.missing_stats.missing_count} 条 | 更新: {new Date().toLocaleString()}
        </p>
      </footer>
    </div>
  );
}
