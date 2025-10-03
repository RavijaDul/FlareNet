from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
from pathlib import Path

from config import API_CONFIG, CORS_CONFIG, STORAGE_CONFIG, LOGGING_CONFIG
from api.routes import router
from services.ml_inference import MLInferenceService
from utils.logger import setup_logger

# Setup logging
setup_logger()
logger = logging.getLogger(__name__)

# Global ML service instance
ml_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    global ml_service
    
    # Startup
    logger.info("Starting FlareNet ML Backend...")
    try:
        ml_service = MLInferenceService()
        await ml_service.initialize()
        
        # Set the service in app state after successful initialization
        app.state.ml_service = ml_service
        
        logger.info("ML service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize ML service: {e}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down FlareNet ML Backend...")
    if ml_service:
        await ml_service.cleanup()

# Create FastAPI app
app = FastAPI(
    title=API_CONFIG["title"],
    description=API_CONFIG["description"],
    version=API_CONFIG["version"],
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_CONFIG["allow_origins"],
    allow_credentials=CORS_CONFIG["allow_credentials"],
    allow_methods=CORS_CONFIG["allow_methods"],
    allow_headers=CORS_CONFIG["allow_headers"],
)

# Mount static files for serving outputs
app.mount("/outputs", StaticFiles(directory=STORAGE_CONFIG["output_dir"]), name="outputs")

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FlareNet ML Backend",
        "version": API_CONFIG["version"],
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    global ml_service
    
    model_loaded = ml_service is not None and ml_service.is_ready()
    
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "version": API_CONFIG["version"]
    }

@app.middleware("http")
async def add_ml_service_to_state(request: Request, call_next):
    """Add ML service to request state"""
    global ml_service
    request.state.ml_service = ml_service
    response = await call_next(request)
    return response

# ml_service will be set in app.state during lifespan startup

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=API_CONFIG["host"],
        port=API_CONFIG["port"],
        reload=API_CONFIG["debug"],
        log_level=LOGGING_CONFIG["level"].lower()
    )