#!/bin/bash
# Setup script for FlareNet Python ML Backend on WSL

echo "Setting up FlareNet Python ML Backend..."

# Check if running in WSL
if ! grep -q Microsoft /proc/version; then
    echo "Warning: This script is designed for WSL. Continuing anyway..."
fi

echo ""
echo "1. Creating virtual environment..."
python3 -m venv venv
if [ $? -ne 0 ]; then
    echo "Error: Failed to create virtual environment"
    exit 1
fi

echo ""
echo "2. Activating virtual environment..."
source venv/bin/activate

echo ""
echo "3. Upgrading pip..."
pip install --upgrade pip

echo ""
echo "4. Installing requirements..."
pip install -r requirements.txt
if [ $? -ne 0 ]; then
    echo "Error: Failed to install requirements"
    exit 1
fi

echo ""
echo "5. Copying model files..."
MODEL_PATH="../Model/New folder/results/Patchcore/transformers/v1/weights/lightning/model.ckpt"
CONFIG_PATH="../Model/New folder/configs/patchcore_transformers.yaml"

if [ -f "$MODEL_PATH" ]; then
    cp "$MODEL_PATH" "models/weights/model.ckpt"
    echo "Model weights copied successfully"
else
    echo "Warning: Model weights not found at $MODEL_PATH"
    echo "Please ensure training is completed."
fi

if [ -f "$CONFIG_PATH" ]; then
    cp "$CONFIG_PATH" "configs/patchcore_config.yaml"
    echo "Config file copied successfully"
else
    echo "Warning: Config file not found at $CONFIG_PATH"
fi

echo ""
echo "6. Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p outputs/{masks,overlays,filtered,bounded}

echo ""
echo "Setup complete!"
echo ""
echo "To start the server:"
echo "  1. Activate environment: source venv/bin/activate"
echo "  2. Run server: python main.py"
echo "  3. Or with uvicorn: uvicorn main:app --reload --port 8001"
echo ""
echo "API will be available at: http://localhost:8001"
echo "API documentation: http://localhost:8001/docs"
echo ""