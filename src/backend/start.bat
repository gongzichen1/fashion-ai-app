@echo off
chcp 65001 >nul
echo ==========================================
echo   智搭后端服务启动脚本 (Windows)
echo ==========================================

REM 检查Python环境
python --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Python，请先安装Python3
    pause
    exit /b 1
)

REM 检查虚拟环境
if not exist "venv" (
    echo 创建虚拟环境...
    python -m venv venv
)

REM 激活虚拟环境
echo 激活虚拟环境...
call venv\Scripts\activate

REM 安装依赖
echo 安装依赖...
pip install -r requirements.txt -q

REM 检查环境变量
if not exist ".env" (
    echo.
    echo 警告: 未找到.env文件
    echo 请复制.env.example为.env并填入智谱AI的API密钥
    echo.
    set /p continue="是否继续启动（无API密钥将无法使用AI功能）? [y/N]: "
    if /i not "%continue%"=="y" exit /b 1
)

REM 启动服务
echo.
echo 启动服务...
python app.py

pause
