# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目背景

校线质量异常分析系统，包含 Python FastAPI 后端和 Next.js 前端，对500条工单数据进行清洗、分析和可视化。

## 技术架构

```
Excel数据 → Python后端(FastAPI) → Next.js前端(ECharts大屏)
```

## 目录结构

```
├── backend/                    # Python FastAPI后端
│   ├── main.py                 # FastAPI入口
│   ├── routers/analysis.py    # 分析API路由
│   ├── services/
│   │   ├── work_hours.py      # 有效工作时长计算
│   │   └── data_processor.py  # 数据清洗和统计
│   └── requirements.txt
├── frontend/                   # Next.js前端
│   ├── app/
│   │   ├── page.tsx           # 主仪表盘页面
│   │   ├── layout.tsx         # 布局
│   │   └── globals.css         # 全局样式
│   ├── package.json
│   └── components/             # 组件目录
└── CLAUDE.md
```

## 启动命令

### 后端启动
```bash
cd backend
.venv/Scripts/python -m uvicorn main:app --host 127.0.0.1 --port 8001
# API文档: http://localhost:8001/docs
```

### 前端启动
```bash
cd frontend
npm run dev -- --port 3002
# 访问: http://localhost:3002
```

## 关键数据处理规则

**每日工作时间**: 上午 08:30-12:00，下午 13:30-17:30（每天共计7.5小时）

**需扣除的时间段**:
- 午休时间：12:00-13:30
- 夜间非工作时间：17:30 至次日 08:30
- 周末（周六、周日）及常规法定节假日全天

## API接口

- `GET /api/kpi` - 核心KPI指标
- `GET /api/trend` - 每日提报趋势
- `GET /api/projects` - 项目分布
- `GET /api/trains` - 故障频发列车
- `GET /api/phenomena` - 现象分类
- `GET /api/failure-modes` - 失效模式排行
- `GET /api/responsibility` - 责任归属
- `GET /api/efficiency` - 时效分析
- `GET /api/wordcloud` - 词云数据
- `GET /api/person-rankings` - 人员红黑榜
- `GET /api/full-analysis` - 完整分析数据

## 数据字段（Excel列名）

关键字段包括：单据编号、单据状态、响应时间、验收时间、项目号.项目简称、列车号、现象分类、失效模式、失效原因、责任分类、责任单位、所属班组、提报人.姓名等。

## 设计方案参考

- `软件生成需求.md` - 数据分析师提示词与处理规则
- `校线质量异常分析大屏图表群设计方案.md` - 28个图表的详细设计