"""
FastAPI主入口
校线质量异常分析后端服务
"""
import os
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import pandas as pd

from services.data_processor import DataProcessor
from routers import analysis

# 全局数据处理器
_processor: DataProcessor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    global _processor
    # 启动时尝试加载默认数据（搜索目录下所有xlsx文件）
    base_dir = os.path.dirname(__file__)
    parent_dir = os.path.dirname(base_dir)
    excel_files = [f for f in os.listdir(parent_dir) if f.endswith('.xlsx')]
    if excel_files:
        default_file = os.path.join(parent_dir, excel_files[0])
        try:
            df = pd.read_excel(default_file)
            _processor = DataProcessor(df)
            analysis.set_processor(_processor)
            print(f"成功加载默认数据: {len(df)} 行, 文件: {excel_files[0]}")
        except Exception as e:
            print(f"加载默认数据失败: {e}")
    yield
    # 关闭时清理


app = FastAPI(
    title="校线质量异常分析API",
    description="提供校线质量异常数据的统计分析和可视化接口",
    version="1.0.0",
    lifespan=lifespan
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)):
    """上传Excel文件并更新数据"""
    global _processor

    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="只支持 .xlsx 或 .xls 文件")

    try:
        # 保存上传文件到临时目录
        with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        # 读取Excel
        df = pd.read_excel(tmp_path)
        print(f"成功加载数据: {len(df)} 行, {len(df.columns)} 列")

        # 初始化数据处理器
        _processor = DataProcessor(df)
        analysis.set_processor(_processor)

        # 删除临时文件
        os.unlink(tmp_path)

        return {
            "message": "文件上传成功",
            "rows": len(df),
            "columns": len(df.columns)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理文件失败: {str(e)}")


@app.get("/api/status")
async def get_status():
    """获取数据状态"""
    global _processor
    if _processor is None:
        return {"status": "no_data", "rows": 0}
    return {
        "status": "ready",
        "rows": len(_processor.df)
    }


# 注册路由
app.include_router(analysis.router)


@app.get("/")
async def root():
    return {"message": "校线质量异常分析API", "docs": "/docs"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)