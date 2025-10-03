@echo off
echo Setting up FlareNet Python ML Backend...

echo.
echo 1. Creating virtual environment...
python -m venv venv
if %ERRORLEVEL% neq 0 (
    echo Error: Failed to create virtual environment
    pause
    exit /b 1
)

echo.
echo 2. Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo 3. Upgrading pip...
python -m pip install --upgrade pip

echo.
echo 4. Installing basic requirements...
pip install fastapi uvicorn[standard] python-multipart Pillow numpy opencv-python
if %ERRORLEVEL% neq 0 (
    echo Warning: Some packages failed to install, continuing...
)

echo.
echo 5. Installing ML packages...
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install pytorch-lightning omegaconf pydantic aiofiles requests matplotlib scikit-learn scipy
if %ERRORLEVEL% neq 0 (
    echo Warning: Some ML packages failed to install, continuing...
)

echo.
echo 6. Installing anomalib (optional)...
pip install anomalib
if %ERRORLEVEL% neq 0 (
    echo Warning: Anomalib installation failed, will use basic model loading
)

echo.
echo 7. Copying model files...
if exist "..\Model\New folder\results\Patchcore\transformers\v1\weights\lightning\model.ckpt" (
    copy "..\Model\New folder\results\Patchcore\transformers\v1\weights\lightning\model.ckpt" "models\weights\model.ckpt"
    echo Model weights copied successfully
) else (
    echo Warning: Model weights not found. Please ensure training is completed.
)

if exist "..\Model\New folder\configs\patchcore_transformers.yaml" (
    copy "..\Model\New folder\configs\patchcore_transformers.yaml" "configs\patchcore_config.yaml"
    echo Config file copied successfully
) else (
    echo Warning: Config file not found.
)

echo.
echo 8. Creating necessary directories...
mkdir uploads 2>nul
mkdir logs 2>nul
mkdir outputs\masks 2>nul
mkdir outputs\overlays 2>nul
mkdir outputs\filtered 2>nul
mkdir outputs\bounded 2>nul

echo.
echo Setup complete!
echo.
echo To start the server:
echo   1. Activate environment: venv\Scripts\activate
echo   2. Run server: python main.py
echo   3. Or with uvicorn: uvicorn main:app --reload --port 8001
echo.
echo API will be available at: http://localhost:8001
echo API documentation: http://localhost:8001/docs
echo.
pause