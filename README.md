# 校线质量异常分析系统

基于 Python FastAPI + Next.js 的校线质量异常数据可视化分析系统。支持数据上传、统计分析和 SPC 过程监控。

## 技术架构

```
Excel数据 → Python后端(FastAPI) → Next.js前端(ECharts大屏)
```

| 层级 | 技术 | 版本 |
|------|------|------|
| 后端框架 | FastAPI | - |
| Python | Python | 3.11+ |
| 数据处理 | Pandas | - |
| 服务 | Uvicorn | - |
| 前端框架 | Next.js | 16.2.3 |
| UI库 | React | 19 |
| 样式 | Tailwind CSS | v4 |
| 图表 | ECharts | - |

## 快速启动

### 1. 启动后端

```bash
cd backend
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001
# API文档: http://localhost:8001/docs
```

### 2. 启动前端

```bash
cd frontend
npm run dev -- --port 3002
# 访问: http://localhost:3002
```

## 项目结构

```
.
├── backend/                         # Python FastAPI 后端
│   ├── main.py                      # FastAPI 入口、生命周期管理
│   ├── requirements.txt            # Python 依赖
│   ├── routers/
│   │   └── analysis.py             # 分析 API 路由（30+ 接口）
│   └── services/
│       ├── data_processor.py       # 数据处理服务
│       └── work_hours.py           # 有效工作时长计算
├── frontend/                        # Next.js 前端
│   ├── app/
│   │   ├── page.tsx               # 主仪表盘页面
│   │   ├── layout.tsx             # 布局组件
│   │   └── globals.css            # 全局样式
│   ├── package.json               # Node 依赖
│   └── next.config.ts
├── scripts/                         # 启动脚本
│   ├── 启动校线分析系统.bat
│   └── 停止校线分析系统.bat
├── CLAUDE.md                       # Claude Code 项目指引
└── README.md                       # 本文档
```

## 功能特性

### 1. 核心 KPI 指标
- **总异常数**：原始异常记录数量
- **缺失项数**：现象分类为"缺失"的记录数
- **有效分析数**：排除缺失项后的分析数量
- **平均处理时长**：从响应到验收的有效工作小时数

### 2. SPC 过程监控
- **每节车平均异常数量趋势**（半月粒度）
  - 每节车 = 列车号 + 校线节车号
  - 均值线（CL）、上控制限（UCL = 均值 + 3σ）、下控制限（LCL = 均值 - 3σ）
  - 超限点自动标记红色

### 3. 帕累托分析
- 现象分类帕累托
- 核心失效模式帕累托
- 失效原因帕累托

### 4. 分布统计
- 项目分布柱状图
- 故障频发列车 Top 10
- 各项目缺失项统计
- 单据状态分布（漏斗图）

### 5. 交叉分析
- 产品构型分布（矩形树图）
- 项目 vs 构型热力图
- 责任单位 vs 失效原因堆叠图
- 班组雷达图

### 6. 人员分析
- 人员红黑榜
- 各失效原因 Top 10 诊断人
- 各责任单位 Top 10 诊断人
- 诊断人工作负载气泡图

### 7. 时效分析
- 处理时效分布
- 班组对标气泡图

### 8. 其他分析
- 24小时异常发生节律
- 列车车厢位置热力
- 图文附件率仪表
- 返工依据分类

## API 接口

访问 http://localhost:8001/docs 查看完整 API 文档。

### 核心接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/full-analysis` | GET | 完整分析数据（所有指标） |
| `/api/kpi` | GET | 核心 KPI 指标 |
| `/api/upload` | POST | 上传 Excel 数据文件 |

### 独立接口

| 接口 | 说明 |
|------|------|
| `/api/trend` | 每月提报趋势 |
| `/api/projects` | 项目分布 |
| `/api/trains` | 故障频发列车 Top 15 |
| `/api/phenomena` | 现象分类统计 |
| `/api/failure-modes` | 失效模式排行 |
| `/api/failure-causes-pareto` | 失效原因帕累托 |
| `/api/missing-stats` | 缺失项统计 |
| `/api/missing-by-project` | 各项目缺失项占比 |
| `/api/responsibility` | 责任归属统计 |
| `/api/efficiency` | 时效分析 |
| `/api/person-rankings` | 人员红黑榜 Top 10 |
| `/api/status-distribution` | 单据状态分布 |
| `/api/configurations` | 产品构型分布 |
| `/api/project-config-heatmap` | 项目 vs 构型热力图 |
| `/api/sankey` | 桑基图数据 |
| `/api/anomaly-categories` | 异常类别分布 |
| `/api/process-steps` | 工序缺陷爆发率 |
| `/api/diagnosis-person-workload` | 诊断人工作负载 |
| `/api/hourly-trend` | 24小时异常节律 |
| `/api/image-attachment-rate` | 图文附件率 |
| `/api/rework-basis` | 返工依据分类 |
| `/api/unit-failure-cross` | 责任单位 vs 失效原因 |
| `/api/team-radar` | 班组雷达图 |
| `/api/train-position-heatmap` | 车厢位置热力 |
| `/api/line-segments` | 线路起止点 |
| `/api/failure-cause-with-rectifiers` | 失效原因 Top 10 诊断人 |
| `/api/responsibility-with-diagnosis-persons` | 责任单位 Top 10 诊断人 |

## 数据说明

### 支持的文件格式
- `.xlsx` (Excel 2007+)
- `.xls` (Excel 97-2003)

### 数据字段

| 字段名 | 说明 |
|--------|------|
| 单据编号 | 唯一标识 |
| 单据状态 | 已闭环/未闭环等 |
| 响应时间 | 提报时间 |
| 验收时间 | 完工验收时间 |
| 项目号.项目简称 | 项目名称 |
| 列车号 | 列车编号 |
| 校线节车号 | 车厢位置编号 |
| 现象分类 | 异常现象类型 |
| 失效模式 | 失效模式分类 |
| 失效原因 | 失效原因分析 |
| 责任分类 | 责任类型 |
| 责任单位 | 责任归属单位 |
| 指定诊断人.姓名 / 诊断人.名称 | 诊断处理人员 |

### 数据处理规则

- **有效工作时长**：每日 08:30-12:00、13:30-17:30（7.5小时）
- **扣除时段**：午休 12:00-13:30、夜间 17:30-次日 08:30、周末
- **缺失过滤**：现象分类为"缺失"的记录不纳入分析（KPI 除外）

## SPC 分析说明

每节车平均异常数量趋势图采用 SPC 控制限分析：

### 计算公式
- **每节车异常数** = 异常总数 ÷ 唯一节车数
- **节车标识** = 列车号 + 校线节车号
- **时间粒度**：每月1-15日为上半月，16-31日为下半月

### 控制限
- **CL（中心线）**：所有半月均值的平均值
- **UCL**：均值 + 3σ（标准差）
- **LCL**：均值 - 3σ（最小为 0）

### 报警规则
- 超限点（> UCL 或 < LCL）自动标记红色

## 环境要求

### 后端
- Python 3.11+
- pandas
- openpyxl
- fastapi
- uvicorn

### 前端
- Node.js 18+
- npm

## License

MIT
