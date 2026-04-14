"""
有效工作时长计算服务
每日工作时间: 08:30-12:00, 13:30-17:30 (共7.5小时)
扣除: 午休12-13:30, 夜间17:30-次日08:30, 周末
"""
from datetime import datetime, timedelta, date
from typing import List, Tuple
import pandas as pd


def is_workday(dt: datetime) -> bool:
    """判断是否为工作日（周一至周五）"""
    return dt.weekday() < 5


def make_dt(d: date, h: int, m: int) -> datetime:
    """创建指定日期和时间 datetime 对象"""
    return datetime(d.year, d.month, d.day, h, m)


def get_work_segments(start: datetime, end: datetime) -> List[Tuple[datetime, datetime]]:
    """获取两个时间点之间所有的工作时间段"""
    segments = []
    if end <= start:
        return segments

    # 工作时段定义
    WORK_MORNING_START = (8, 30)
    WORK_MORNING_END = (12, 0)
    WORK_AFTERNOON_START = (13, 30)
    WORK_AFTERNOON_END = (17, 30)

    def next_workday_start(dt: datetime) -> datetime:
        """获取下一个工作日的开始时间（08:30）"""
        days_ahead = 1
        next_day = dt.date() + timedelta(days=days_ahead)
        while next_day.weekday() >= 5:  # 周六、周日
            days_ahead += 1
            next_day = dt.date() + timedelta(days=days_ahead)
        return make_dt(next_day, WORK_MORNING_START[0], WORK_MORNING_START[1])

    current = start

    while current < end:
        day = current.date()

        if not is_workday(current):
            # 跳到下一个工作日
            current = next_workday_start(current)
            continue

        # 当天工作时间
        morning_start = make_dt(day, WORK_MORNING_START[0], WORK_MORNING_START[1])
        morning_end = make_dt(day, WORK_MORNING_END[0], WORK_MORNING_END[1])
        afternoon_start = make_dt(day, WORK_AFTERNOON_START[0], WORK_AFTERNOON_START[1])
        afternoon_end = make_dt(day, WORK_AFTERNOON_END[0], WORK_AFTERNOON_END[1])

        # 实际结束时间（不超过请求的结束时间）
        actual_end = min(end, datetime.combine(day, datetime.max.time()))

        # 上午段
        seg_start = max(current, morning_start)
        seg_end = min(actual_end, morning_end)
        if seg_start < seg_end and seg_start < morning_end:
            segments.append((seg_start, min(seg_end, morning_end)))

        # 下午段
        seg_start = max(current, afternoon_start)
        seg_end = min(actual_end, afternoon_end)
        if seg_start < seg_end and seg_start < afternoon_end:
            segments.append((seg_start, min(seg_end, afternoon_end)))

        # 移动到下一天
        next_day_date = day + timedelta(days=1)
        current = make_dt(next_day_date, WORK_MORNING_START[0], WORK_MORNING_START[1])

    return segments


def calc_work_hours(start_time, end_time) -> float:
    """
    计算两个时间点之间的有效工作小时数

    Args:
        start_time: 开始时间
        end_time: 结束时间

    Returns:
        有效工作小时数（浮点数）
    """
    # 解析时间
    if pd.isna(start_time) or pd.isna(end_time):
        return 0.0

    if isinstance(start_time, str):
        start = pd.to_datetime(start_time)
    else:
        start = start_time

    if isinstance(end_time, str):
        end = pd.to_datetime(end_time)
    else:
        end = end_time

    if pd.isna(start) or pd.isna(end):
        return 0.0

    if end <= start:
        return 0.0

    segments = get_work_segments(start, end)
    total_minutes = sum((e - s).total_seconds() / 60 for s, e in segments)

    return round(total_minutes / 60, 2)


# 测试
if __name__ == "__main__":
    from datetime import datetime

    # Case 1: 工作日早上提报，当天中午验收
    t1_start = datetime(2026, 4, 13, 8, 30)
    t1_end = datetime(2026, 4, 13, 11, 30)
    print(f"Case 1 (2h): {calc_work_hours(t1_start, t1_end)}")

    # Case 2: 工作日早上提报，次日下午验收
    t2_start = datetime(2026, 4, 13, 8, 30)
    t2_end = datetime(2026, 4, 14, 14, 0)
    print(f"Case 2 (~6.5h): {calc_work_hours(t2_start, t2_end)}")

    # Case 3: 周五提报，周一验收
    t3_start = datetime(2026, 4, 10, 17, 0)
    t3_end = datetime(2026, 4, 13, 10, 0)
    print(f"Case 3 (~1.5h): {calc_work_hours(t3_start, t3_end)}")

    # Case 4: 完整工作日
    t4_start = datetime(2026, 4, 13, 8, 30)
    t4_end = datetime(2026, 4, 13, 17, 30)
    print(f"Case 4 (7.5h): {calc_work_hours(t4_start, t4_end)}")