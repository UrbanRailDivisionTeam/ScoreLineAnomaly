"""
分析API路由
"""
from fastapi import APIRouter, HTTPException
from typing import Optional

from services.data_processor import DataProcessor

router = APIRouter(prefix="/api", tags=["analysis"])

# 全局数据处理器（由main.py注入）
_processor: Optional[DataProcessor] = None


def set_processor(processor: DataProcessor):
    global _processor
    _processor = processor


def get_processor() -> DataProcessor:
    if _processor is None:
        raise HTTPException(status_code=500, detail="数据处理器未初始化")
    return _processor


@router.get("/kpi")
async def get_kpi():
    """核心KPI指标"""
    processor = get_processor()
    return processor.get_kpi()


@router.get("/trend")
async def get_trend():
    """每日提报趋势"""
    processor = get_processor()
    return processor.get_trend()


@router.get("/projects")
async def get_projects():
    """项目分布"""
    processor = get_processor()
    return processor.get_projects()


@router.get("/trains")
async def get_trains(top: int = 15):
    """故障频发列车"""
    processor = get_processor()
    return processor.get_trains_top(top)


@router.get("/phenomena")
async def get_phenomena():
    """现象分类"""
    processor = get_processor()
    return processor.get_phenomena()


@router.get("/failure-modes")
async def get_failure_modes():
    """失效模式排行"""
    processor = get_processor()
    return processor.get_failure_modes()


@router.get("/responsibility")
async def get_responsibility():
    """责任归属"""
    processor = get_processor()
    return processor.get_responsibility()


@router.get("/efficiency")
async def get_efficiency():
    """时效分析"""
    processor = get_processor()
    return processor.get_efficiency()


@router.get("/wordcloud")
async def get_wordcloud():
    """词云数据"""
    processor = get_processor()
    return processor.get_wordcloud_data()


@router.get("/person-rankings")
async def get_person_rankings(top: int = 10):
    """人员红黑榜"""
    processor = get_processor()
    return processor.get_person_rankings(top)


@router.get("/full-analysis")
async def get_full_analysis():
    """完整分析数据（一次性获取所有数据）"""
    processor = get_processor()
    return {
        'kpi': processor.get_kpi(),
        'trend': processor.get_trend(),
        'per_car_trend': processor.get_per_car_anomaly_trend(),
        'projects': processor.get_projects(),
        'trains': processor.get_trains_top(15),
        'phenomena': processor.get_phenomena(),
        'failure_modes': processor.get_failure_modes(),
        'failure_causes_pareto': processor.get_failure_causes_pareto(),
        'failure_cause_rectifiers': processor.get_failure_cause_with_rectifiers(),
        'responsibility_diagnosis_persons': processor.get_responsibility_with_diagnosis_persons(),
        'missing_stats': processor.get_missing_stats(),
        'missing_by_project': processor.get_missing_by_project(),
        'responsibility': processor.get_responsibility(),
        'efficiency': processor.get_efficiency(),
        'wordcloud': processor.get_wordcloud_data(),
        'person_rankings': processor.get_person_rankings(10),
        'status_distribution': processor.get_status_distribution(),
        'configurations': processor.get_configurations(),
        'project_config_heatmap': processor.get_project_config_heatmap(),
        'sankey': processor.get_sankey_data(),
        'anomaly_categories': processor.get_anomaly_categories(),
        'process_steps': processor.get_process_steps(),
        'diagnosis_person_workload': processor.get_diagnosis_person_workload(),
        'hourly_trend': processor.get_hourly_trend(),
        'image_attachment_rate': processor.get_image_attachment_rate(),
        'rework_basis': processor.get_rework_basis(),
        'unit_failure_cross': processor.get_unit_failure_cross(),
        'team_radar': processor.get_team_radar(),
        'train_position_heatmap': processor.get_train_position_heatmap(),
        'line_segments': processor.get_line_segments()
    }


# 新的API端点
@router.get("/status-distribution")
async def get_status_distribution():
    """单据状态分布（漏斗图）"""
    return get_processor().get_status_distribution()


@router.get("/configurations")
async def get_configurations():
    """产品构型分布（矩形树图）"""
    return get_processor().get_configurations()


@router.get("/project-config-heatmap")
async def get_project_config_heatmap():
    """项目vs构型热力图"""
    return get_processor().get_project_config_heatmap()


@router.get("/sankey")
async def get_sankey():
    """桑基图数据"""
    return get_processor().get_sankey_data()


@router.get("/anomaly-categories")
async def get_anomaly_categories():
    """异常类别分布"""
    return get_processor().get_anomaly_categories()


@router.get("/process-steps")
async def get_process_steps():
    """工序缺陷爆发率"""
    return get_processor().get_process_steps()


@router.get("/diagnosis-person-workload")
async def get_diagnosis_person_workload():
    """诊断人工作负载"""
    return get_processor().get_diagnosis_person_workload()


@router.get("/hourly-trend")
async def get_hourly_trend():
    """24小时异常发生节律"""
    return get_processor().get_hourly_trend()


@router.get("/image-attachment-rate")
async def get_image_attachment_rate():
    """图文附件率"""
    return get_processor().get_image_attachment_rate()


@router.get("/rework-basis")
async def get_rework_basis():
    """返工依据分类"""
    return get_processor().get_rework_basis()


@router.get("/unit-failure-cross")
async def get_unit_failure_cross():
    """责任单位vs失效原因交叉"""
    return get_processor().get_unit_failure_cross()


@router.get("/team-radar")
async def get_team_radar():
    """班组雷达图"""
    return get_processor().get_team_radar()


@router.get("/train-position-heatmap")
async def get_train_position_heatmap():
    """列车车厢位置热力"""
    return get_processor().get_train_position_heatmap()


@router.get("/line-segments")
async def get_line_segments():
    """线路起始-终止点"""
    return get_processor().get_line_segments()


@router.get("/missing-stats")
async def get_missing_stats():
    """缺失项统计"""
    return get_processor().get_missing_stats()


@router.get("/missing-by-project")
async def get_missing_by_project():
    """各项目缺失项占比"""
    return get_processor().get_missing_by_project()


@router.get("/failure-causes-pareto")
async def get_failure_causes_pareto():
    """失效原因帕累托"""
    return get_processor().get_failure_causes_pareto()


@router.get("/failure-cause-with-rectifiers")
async def get_failure_cause_with_rectifiers():
    """失效原因及对应Top诊断人"""
    return get_processor().get_failure_cause_with_rectifiers()


@router.get("/responsibility-with-diagnosis-persons")
async def get_responsibility_with_diagnosis_persons():
    """责任单位及对应Top诊断人"""
    return get_processor().get_responsibility_with_diagnosis_persons()


@router.get("/per-car-trend")
async def get_per_car_trend():
    """每节车平均异常数量趋势（半月粒度）- SPC风格"""
    return get_processor().get_per_car_anomaly_trend()