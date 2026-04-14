# 校线质量异常分析系统

基于 Python FastAPI + Next.js 的校线质量异常数据可视化分析系统。

## 功能特性

- **KPI 核心指标**：总异常数、缺失项数、有效分析数、平均处理时长
- **趋势分析**：每节车平均异常数量 SPC 监控图（半月粒度）
- **项目分布**：各项目异常数量统计
- **故障频发列车**：Top 10 故障列车
- **帕累托分析**：现象分类、失效模式、失效原因
- **缺失项统计**：各项目缺失项占比
- **人员诊断排行**：各失效原因/责任单位 Top 10 诊断人

## 技术架构

```
Excel数据 → Python后端(FastAPI) → Next.js前端(ECharts大屏)
```

- **后端**：Python 3.11 + FastAPI + Pandas + Uvicorn
- **前端**：Next.js 16 + React 19 + Tailwind CSS v4 + ECharts
- **端口**：后端 8001，前端 3001

## 快速启动

### 方式一：使用快捷方式（Windows）

双击桌面快捷方式启动系统：
- **RailAnalysis-Start.lnk** - 启动系统
- **RailAnalysis-Stop.lnk** - 停止系统

### 方式二：手动启动

**后端**
```bash
cd backend
.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

**前端**
```bash
cd frontend
npm run dev -- --port 3001
```

访问 http://localhost:3001

## 访问地址

- 前端页面：http://localhost:3001
- 后端 API 文档：http://localhost:8001/docs

## 数据说明

系统支持上传 Excel 工单数据（.xlsx/.xls），后端启动时自动加载目录下的 Excel 文件。

关键字段：单据编号、单据状态、响应时间、验收时间、项目号、列车号、校线节车号、现象分类、失效模式、失效原因、责任分类、责任单位、诊断人等。

## SPC 分析说明

每节车平均异常数量趋势图采用 SPC 控制限分析：
- **CL（中心线）**：均值
- **UCL**：均值 + 3σ
- **LCL**：均值 - 3σ（最小为 0）
- 超限点自动标记红色

## 项目结构

```
├── backend/                    # Python FastAPI后端
│   ├── main.py                 # FastAPI入口
│   ├── routers/analysis.py     # 分析API路由
│   ├── services/
│   │   ├── data_processor.py   # 数据处理服务
│   │   └── work_hours.py       # 有效工作时长计算
│   └── requirements.txt
├── frontend/                   # Next.js前端
│   ├── app/
│   │   ├── page.tsx           # 主仪表盘页面
│   │   ├── layout.tsx         # 布局
│   │   └── globals.css         # 全局样式
│   ├── package.json
│   └── components/
├── scripts/                    # 启动/停止脚本
├── docs/                       # 文档目录
└── CLAUDE.md                   # Claude Code 项目指引
```

## License

MIT
