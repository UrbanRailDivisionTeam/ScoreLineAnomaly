"""
数据处理服务
负责数据清洗、转换和统计分析
"""
from datetime import datetime
from typing import Dict, List, Any
import pandas as pd
from .work_hours import calc_work_hours


class DataProcessor:
    def __init__(self, df: pd.DataFrame):
        """初始化数据处理器"""
        self.df = df.copy()
        self._preprocess()

    def _preprocess(self):
        """数据预处理"""
        # 确保时间列是datetime类型
        time_cols = ['验收时间', '修改时间', '响应时间']
        for col in time_cols:
            if col in self.df.columns:
                self.df[col] = pd.to_datetime(self.df[col], errors='coerce')

        # 计算有效工作时长
        if '响应时间' in self.df.columns and '验收时间' in self.df.columns:
            self.df['有效工作时长_小时'] = self.df.apply(
                lambda row: calc_work_hours(row.get('响应时间'), row.get('验收时间')),
                axis=1
            )
        else:
            self.df['有效工作时长_小时'] = 0.0

    @property
    def filtered_df(self) -> pd.DataFrame:
        """获取排除'缺失'类型后的数据"""
        if '现象分类' in self.df.columns:
            return self.df[self.df['现象分类'] != '缺失'].copy()
        return self.df

    def get_kpi(self) -> Dict[str, Any]:
        """获取核心KPI指标"""
        total_all = len(self.df)  # 原始总数（含缺失）
        df = self.filtered_df  # 排除缺失后的数据
        total_filtered = len(df)

        # 单据状态分布（基于过滤后数据）
        status_counts = df['单据状态'].value_counts().to_dict() if '单据状态' in df.columns else {}
        closed = status_counts.get('已闭环', 0) + status_counts.get('已关闭', 0) + status_counts.get('完工', 0) + status_counts.get('验收合格', 0)
        open_count = total_filtered - closed

        # 平均处理时长
        avg_hours = df['有效工作时长_小时'].mean()

        # 责任分类统计
        responsibility = {}
        if '责任分类' in df.columns:
            resp_counts = df['责任分类'].value_counts()
            total_resp = len(df[df['责任分类'].notna()])
            for name, count in resp_counts.items():
                responsibility[name] = {
                    'count': int(count),
                    'percentage': round(count / total_resp * 100, 1) if total_resp > 0 else 0
                }

        return {
            'total_anomalies': total_all,  # 返回原始总数
            'total_filtered': total_filtered,  # 有效分析数
            'open_count': int(open_count),
            'closed_count': int(closed),
            'avg_process_hours': round(avg_hours, 2),
            'responsibility': responsibility
        }

    def get_trend(self) -> List[Dict]:
        """获取每月提报趋势数据"""
        df = self.filtered_df
        if '响应时间' not in df.columns:
            return []

        # 按提报月份分组
        df_copy = df.copy()
        df_copy['提报月份'] = pd.to_datetime(df_copy['响应时间']).dt.to_period('M')
        monthly = df_copy.groupby('提报月份').size().reset_index(name='count')
        monthly['提报月份'] = monthly['提报月份'].astype(str)

        return monthly.to_dict('records')

    def get_per_car_anomaly_trend(self) -> List[Dict]:
        """每节车平均异常数量趋势（半月粒度）- SPC风格"""
        df = self.filtered_df

        if '响应时间' not in df.columns or '列车号' not in df.columns or '校线节车号' not in df.columns:
            return []

        df_copy = df.copy()
        df_copy['日期'] = pd.to_datetime(df_copy['响应时间'])

        # 创建节车标识：列车号+校线节车号
        df_copy['节车'] = df_copy['列车号'].astype(str) + '_' + df_copy['校线节车号'].astype(str)

        # 半月分组
        df_copy['半月'] = df_copy['日期'].dt.day.apply(lambda x: '上' if x <= 15 else '下')
        df_copy['年月半月'] = df_copy['日期'].dt.to_period('M').astype(str) + '-' + df_copy['半月']

        # 按半月分组统计
        grouped = df_copy.groupby('年月半月').agg(
            total_count=('节车', 'count'),
            unique_cars=('节车', 'nunique')
        ).reset_index()

        # 计算每节车平均异常数
        grouped['avg_per_car'] = (grouped['total_count'] / grouped['unique_cars']).round(2)

        return grouped[['年月半月', 'avg_per_car', 'total_count', 'unique_cars']].to_dict('records')

    def get_projects(self) -> List[Dict]:
        """获取项目分布"""
        df = self.filtered_df
        if '项目号.项目简称' not in df.columns:
            return []

        project_counts = df['项目号.项目简称'].value_counts().reset_index()
        project_counts.columns = ['project', 'count']
        project_counts['percentage'] = (project_counts['count'] / len(df) * 100).round(1)

        return project_counts.to_dict('records')

    def get_trains_top(self, top_n: int = 15) -> List[Dict]:
        """获取故障频发列车Top N (项目简称+车号后2位)"""
        df = self.filtered_df
        if '列车号' not in df.columns or '项目号.项目简称' not in df.columns:
            return []

        # 创建组合名称：项目简称 + 列车号后2位
        df_copy = df.copy()
        df_copy['列车号后2位'] = df_copy['列车号'].astype(str).str[-2:]
        df_copy['train_display'] = df_copy['项目号.项目简称'] + '-' + df_copy['列车号后2位']

        train_counts = df_copy['train_display'].value_counts().head(top_n).reset_index()
        train_counts.columns = ['train', 'count']

        return train_counts.to_dict('records')

    def get_phenomena(self) -> List[Dict]:
        """获取现象分类统计"""
        df = self.filtered_df
        if '现象分类' not in df.columns:
            return []

        counts = df['现象分类'].value_counts().reset_index()
        counts.columns = ['phenomenon', 'count']
        counts['percentage'] = (counts['count'] / len(df) * 100).round(1)

        return counts.to_dict('records')

    def get_failure_modes(self) -> List[Dict]:
        """获取失效模式排行（帕累托图用）"""
        df = self.filtered_df
        if '失效模式' not in df.columns:
            return []

        counts = df['失效模式'].value_counts().reset_index()
        counts.columns = ['mode', 'count']
        total = counts['count'].sum()
        counts['cumulative'] = (counts['count'].cumsum() / total * 100).round(1)

        return counts.to_dict('records')

    def get_missing_stats(self) -> Dict[str, Any]:
        """获取缺失项统计"""
        total_all = len(self.df)
        total_filtered = len(self.filtered_df)
        missing_count = total_all - total_filtered
        missing_rate = round(missing_count / total_all * 100, 1) if total_all > 0 else 0
        return {
            'missing_count': int(missing_count),
            'total_count': int(total_all),
            'missing_rate': missing_rate
        }

    def get_missing_by_project(self) -> List[Dict]:
        """获取各项目缺失项占比"""
        if '现象分类' not in self.df.columns or '项目号.项目简称' not in self.df.columns:
            return []

        # 计算每个项目的缺失数量
        df_all = self.df
        df_filtered = self.filtered_df

        # 每个项目的总数量
        total_by_project = df_all.groupby('项目号.项目简称').size().reset_index(name='total')
        # 每个项目的非缺失数量
        non_missing_by_project = df_filtered.groupby('项目号.项目简称').size().reset_index(name='non_missing')

        # 合并计算缺失数量
        merged = total_by_project.merge(non_missing_by_project, on='项目号.项目简称', how='left')
        merged['missing'] = merged['total'] - merged['non_missing'].fillna(0)
        merged['missing_rate'] = (merged['missing'] / merged['total'] * 100).round(1)
        merged = merged.sort_values('missing', ascending=False)

        return merged[['项目号.项目简称', 'missing', 'total', 'missing_rate']].rename(
            columns={'项目号.项目简称': 'project', 'missing': 'count', 'total': 'total_count', 'missing_rate': 'rate'}
        ).to_dict('records')

    def get_failure_causes_pareto(self) -> List[Dict]:
        """获取失效原因帕累托统计"""
        df = self.filtered_df
        if '失效原因' not in df.columns:
            return []

        counts = df['失效原因'].value_counts().reset_index()
        counts.columns = ['cause', 'count']
        total = counts['count'].sum()
        counts['cumulative'] = (counts['count'].cumsum() / total * 100).round(1)

        return counts.to_dict('records')

    def get_failure_cause_with_rectifiers(self, top_causes: int = 8, top_persons: int = 10) -> List[Dict]:
        """获取失效原因及对应的Top指定诊断人"""
        df = self.filtered_df
        if '失效原因' not in df.columns or '指定诊断人.姓名' not in df.columns:
            return []

        # 获取前N个失效原因
        top_cause_list = df['失效原因'].value_counts().head(top_causes).index.tolist()

        result = []
        for cause in top_cause_list:
            cause_df = df[df['失效原因'] == cause]
            top_persons_data = cause_df['指定诊断人.姓名'].value_counts().head(top_persons).reset_index()
            top_persons_data.columns = ['name', 'count']
            result.append({
                'cause': cause,
                'total_count': len(cause_df),
                'persons': top_persons_data.to_dict('records')
            })

        return result

    def get_responsibility_with_diagnosis_persons(self, top_units: int = 8, top_persons: int = 10) -> List[Dict]:
        """获取责任单位及对应的Top诊断人"""
        df = self.filtered_df
        if '责任单位' not in df.columns or '指定诊断人.姓名' not in df.columns:
            return []

        # 获取前N个责任单位
        top_unit_list = df['责任单位'].value_counts().head(top_units).index.tolist()

        result = []
        for unit in top_unit_list:
            unit_df = df[df['责任单位'] == unit]
            top_persons_data = unit_df['指定诊断人.姓名'].value_counts().head(top_persons).reset_index()
            top_persons_data.columns = ['name', 'count']
            result.append({
                'unit': unit,
                'total_count': len(unit_df),
                'persons': top_persons_data.to_dict('records')
            })

        return result

    def get_responsibility(self) -> Dict[str, Any]:
        """获取责任归属统计"""
        df = self.filtered_df
        result = {
            'by_type': {},
            'by_unit': {},
            'top_units': []
        }

        if '责任分类' in df.columns:
            resp_counts = df['责任分类'].value_counts().to_dict()
            result['by_type'] = {k: int(v) for k, v in resp_counts.items()}

        if '责任单位' in df.columns:
            unit_counts = df['责任单位'].value_counts().head(10).to_dict()
            result['by_unit'] = {k: int(v) for k, v in unit_counts.items()}
            result['top_units'] = [
                {'unit': k, 'count': int(v)}
                for k, v in unit_counts.items()
            ]

        return result

    def get_efficiency(self) -> Dict[str, Any]:
        """获取时效分析数据"""
        df = self.filtered_df
        hours = df['有效工作时长_小时'].dropna()

        if len(hours) == 0:
            return {}

        # 分布区间
        bins = [0, 24, 48, 72, 100, float('inf')]
        labels = ['0-24h', '24-48h', '48-72h', '72-100h', '>100h']
        vc = pd.cut(hours, bins=bins, labels=labels, include_lowest=True).value_counts(sort=False)
        distribution = [{'range': str(idx), 'count': int(val)} for idx, val in vc.items()]

        # 班组对标
        team_data = {}
        if '所属班组' in df.columns:
            team_stats = df.groupby('所属班组')['有效工作时长_小时'].agg(['mean', 'count']).reset_index()
            team_stats.columns = ['team', 'avg_hours', 'count']
            team_data = team_stats.to_dict('records')

        return {
            'distribution': distribution,
            'team_comparison': team_data
        }

    def get_wordcloud_data(self) -> Dict[str, List]:
        """获取词云数据"""
        df = self.filtered_df
        result = {
            'phenomena': [],  # 现象描述关键词
            'solutions': [],   # 整改方案关键词
        }

        if '现象描述' in df.columns:
            text = ' '.join(df['现象描述'].dropna().astype(str))
            result['phenomena'] = self._extract_keywords(text)

        if '整改方案' in df.columns:
            text = ' '.join(df['整改方案'].dropna().astype(str))
            result['solutions'] = self._extract_keywords(text)

        return result

    def _extract_keywords(self, text: str, top_n: int = 50) -> List[Dict]:
        """简单分词提取关键词（基于空格和标点分割）"""
        import re
        # 简单清理
        text = re.sub(r'[^\w\s\u4e00-\u9fff]', ' ', text)
        words = text.split()

        # 统计词频（过滤单字和常见词）
        stop_words = {'的', '了', '是', '在', '和', '与', '等', '为', '对', '有', '及', '等', '以', '于', '被'}
        word_counts = {}
        for word in words:
            if len(word) >= 2 and word not in stop_words:
                word_counts[word] = word_counts.get(word, 0) + 1

        # 排序返回Top N
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:top_n]
        return [{'word': w, 'count': c} for w, c in sorted_words]

    def get_person_rankings(self, top_n: int = 10) -> List[Dict]:
        """获取人员质量红黑榜"""
        df = self.filtered_df
        if '提报人.姓名' not in df.columns:
            return []

        person_counts = df['提报人.姓名'].value_counts().head(top_n).reset_index()
        person_counts.columns = ['name', 'count']

        return person_counts.to_dict('records')

    def get_status_distribution(self) -> Dict[str, Any]:
        """获取单据状态分布（漏斗图）"""
        df = self.filtered_df
        if '单据状态' not in df.columns:
            return {}
        counts = df['单据状态'].value_counts().to_dict()
        return {'stages': [{'name': k, 'count': int(v)} for k, v in counts.items()]}

    def get_configurations(self) -> List[Dict]:
        """获取产品构型分布（矩形树图）"""
        df = self.filtered_df
        if '产品构型名称.构型项名称' not in df.columns:
            return []
        counts = df['产品构型名称.构型项名称'].value_counts().head(30).reset_index()
        counts.columns = ['config', 'count']
        counts['percentage'] = (counts['count'] / len(df) * 100).round(1)
        return counts.to_dict('records')

    def get_project_config_heatmap(self) -> Dict[str, Any]:
        """获取项目vs构型热力图数据"""
        df = self.filtered_df
        if '项目号.项目简称' not in df.columns or '产品构型名称.构型项名称' not in df.columns:
            return {}
        cross = df.groupby(['项目号.项目简称', '产品构型名称.构型项名称']).size().reset_index(name='count')
        projects = cross['项目号.项目简称'].unique().tolist()
        configs = cross['产品构型名称.构型项名称'].unique().tolist()
        data = cross.to_dict('records')
        return {'projects': projects, 'configs': configs, 'data': data}

    def get_sankey_data(self) -> Dict[str, Any]:
        """获取桑基图数据（现象→失效模式→失效原因）"""
        df = self.filtered_df
        if '现象分类' not in df.columns or '失效模式' not in df.columns or '失效原因' not in df.columns:
            return {}
        nodes = []
        links = []
        phenomena = df['现象分类'].value_counts().to_dict()
        modes = df['失效模式'].value_counts().to_dict()
        reasons = df['失效原因'].fillna('未知').value_counts().to_dict()
        for p, c in phenomena.items():
            nodes.append({'name': p})
        for m, c in modes.items():
            if m not in [n['name'] for n in nodes]:
                nodes.append({'name': m})
        for r, c in reasons.items():
            if r not in [n['name'] for n in nodes]:
                nodes.append({'name': r})
        # 现象到失效模式
        ph_mode = df.groupby(['现象分类', '失效模式']).size().reset_index(name='value')
        for _, row in ph_mode.iterrows():
            links.append({'source': row['现象分类'], 'target': row['失效模式'], 'value': int(row['value'])})
        # 失效模式到失效原因
        mode_reason = df.groupby(['失效模式', '失效原因']).size().reset_index(name='value')
        for _, row in mode_reason.iterrows():
            links.append({'source': row['失效模式'], 'target': row['失效原因'], 'value': int(row['value'])})
        return {'nodes': nodes, 'links': links}

    def get_anomaly_categories(self) -> List[Dict]:
        """获取异常类别分布"""
        df = self.filtered_df
        if '异常类别' not in df.columns:
            return []
        counts = df['异常类别'].value_counts().reset_index()
        counts.columns = ['category', 'count']
        return counts.to_dict('records')

    def get_process_steps(self) -> List[Dict]:
        """获取工序缺陷爆发率"""
        df = self.filtered_df
        if '工序/工步' not in df.columns:
            return []
        counts = df['工序/工步'].value_counts().head(20).reset_index()
        counts.columns = ['step', 'count']
        return counts.to_dict('records')

    def get_diagnosis_person_workload(self) -> List[Dict]:
        """获取诊断人工作负载（气泡图）"""
        df = self.filtered_df
        if '诊断人.名称' not in df.columns:
            return []
        stats = df.groupby('诊断人.名称').agg({
            '有效工作时长_小时': 'mean',
            '单据编号': 'count'
        }).reset_index()
        stats.columns = ['name', 'avg_hours', 'count']
        stats['avg_hours'] = stats['avg_hours'].round(2)
        return stats.to_dict('records')

    def get_hourly_trend(self) -> List[Dict]:
        """获取24小时异常发生节律"""
        df = self.filtered_df
        if '响应时间' not in df.columns:
            return []
        df_copy = df.copy()
        df_copy['hour'] = pd.to_datetime(df_copy['响应时间']).dt.hour
        hourly = df_copy.groupby('hour').size().reset_index(name='count')
        hourly['hour'] = hourly['hour'].astype(str)
        return hourly.to_dict('records')

    def get_image_attachment_rate(self) -> Dict[str, Any]:
        """获取图文附件率"""
        df = self.filtered_df
        has_image = 0
        total = len(df)
        if '返工图片' in df.columns:
            has_image += df['返工图片'].notna().sum()
        if '故障图片' in df.columns:
            has_image += df['故障图片'].notna().sum()
        rate = round((has_image / total) * 100, 1) if total > 0 else 0
        return {'with_image': int(has_image), 'total': total, 'rate': rate}

    def get_rework_basis(self) -> List[Dict]:
        """获取返工依据分类（ECN vs 灵活处理）"""
        df = self.filtered_df
        if '返工依据编号(设计变更执行单/车间执行单 等)' not in df.columns:
            return []
        df_copy = df.copy()
        df_copy['has_ecn'] = df_copy['返工依据编号(设计变更执行单/车间执行单 等)'].fillna('').str.contains('ECN|设计变更', case=False)
        ecn_count = df_copy['has_ecn'].sum()
        flexible_count = len(df_copy) - ecn_count
        return [
            {'type': '设计变更(ECN)', 'count': int(ecn_count)},
            {'type': '车间灵活处理', 'count': int(flexible_count)}
        ]

    def get_config_detail_top(self, top_n: int = 10) -> List[Dict]:
        """获取构型详细分布Top"""
        df = self.filtered_df
        if '产品构型名称.构型项名称' not in df.columns:
            return []
        counts = df['产品构型名称.构型项名称'].value_counts().head(top_n).reset_index()
        counts.columns = ['name', 'count']
        return counts.to_dict('records')

    def get_unit_failure_cross(self) -> Dict[str, Any]:
        """获取责任单位vs失效原因交叉数据"""
        df = self.filtered_df
        if '责任单位' not in df.columns or '失效模式' not in df.columns:
            return {}
        cross = df.groupby(['责任单位', '失效模式']).size().reset_index(name='count')
        units = cross['责任单位'].unique().tolist()
        modes = cross['失效模式'].unique().tolist()
        data = cross.to_dict('records')
        return {'units': units, 'modes': modes, 'data': data}

    def get_team_radar(self) -> List[Dict]:
        """获取班组雷达图数据"""
        df = self.filtered_df
        if '所属班组' not in df.columns or '失效模式' not in df.columns:
            return []
        cross = df.groupby(['所属班组', '失效模式']).size().reset_index(name='value')
        teams = cross['所属班组'].unique().tolist()
        modes = cross['失效模式'].unique().tolist()
        result = []
        for team in teams:
            team_data = cross[cross['所属班组'] == team]
            indicators = []
            for mode in modes:
                val = team_data[team_data['失效模式'] == mode]['value'].values
                indicators.append({'mode': mode, 'value': int(val[0]) if len(val) > 0 else 0})
            result.append({'team': team, 'indicators': indicators})
        return result

    def get_train_position_heatmap(self) -> List[Dict]:
        """获取列车车厢位置热力数据"""
        df = self.filtered_df
        if '校线节车号' not in df.columns:
            return []
        counts = df.groupby('校线节车号').size().reset_index(name='count')
        counts.columns = ['position', 'count']
        return counts.to_dict('records')

    def get_line_segments(self) -> List[Dict]:
        """获取线路起始-终止点数据（和弦图）"""
        df = self.filtered_df
        if '起始位置' not in df.columns or '终止位置' not in df.columns:
            return []
        df_copy = df.copy()
        df_copy['起始位置'] = df_copy['起始位置'].fillna('未知')
        df_copy['终止位置'] = df_copy['终止位置'].fillna('未知')
        links = df_copy.groupby(['起始位置', '终止位置']).size().reset_index(name='value')
        links = links[links['value'] > 1].head(30)
        return links.to_dict('records')