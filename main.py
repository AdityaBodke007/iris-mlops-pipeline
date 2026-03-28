import pickle
import logging
from typing import List
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from pydantic import BaseModel, ConfigDict
from contextlib import asynccontextmanager

# ==========================================
# EXPT 3: Error handling and logging
# ==========================================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("ml_backend")

# ML Model placeholder
model = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load the ML model during startup
    global model
    try:
        with open("model.pkl", "rb") as f:
            model = pickle.load(f)
        logger.info("ML model loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to load ML model: {e}")
    yield
    logger.info("Shutting down ML backend.")

# ==========================================
# EXPT 2: Create backend for model inference
# ==========================================
app = FastAPI(title="ML Prediction Service", lifespan=lifespan)

# Allow CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# EXPT 4: Implement basic authentication
# ==========================================
API_KEY = "supersecretapikey"
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=False)

async def get_api_key(api_key_header: str = Depends(api_key_header)):
    if api_key_header == API_KEY:
        return api_key_header
    logger.warning(f"Unauthorized access attempt with key: {api_key_header}")
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing API Key",
    )

# EXPT 3: Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"message": "Internal Server Error", "detail": str(exc)},
    )

class PredictionRequest(BaseModel):
    # Iris features: sepal length, sepal width, petal length, petal width
    features: List[float]
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {"features": [5.1, 3.5, 1.4, 0.2]}
        }
    )

class PredictionResponse(BaseModel):
    prediction: int
    predicted_class: str

IRIS_CLASSES = {0: "setosa", 1: "versicolor", 2: "virginica"}

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest, api_key: str = Depends(get_api_key)):
    """
    Predict the Iris class based on features.
    Requires Authentication (X-API-Key header).
    """
    # EXPT 3: Structured logging for requests
    logger.info(f"Received prediction request. Features: {request.features}")
    
    if len(request.features) != 4:
        logger.warning(f"Invalid feature length: {len(request.features)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Exactly 4 features are required for Iris dataset."
        )
        
    if model is None:
        logger.error("Model is not loaded.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail="ML model is unavailable."
        )
        
    try:
        # Predict uses a 2D array
        prediction_idx = int(model.predict([request.features])[0])
        predicted_class_name = IRIS_CLASSES.get(prediction_idx, "unknown")
        
        # EXPT 3: Structured logging for response
        logger.info(f"Prediction successful: {predicted_class_name}")
        
        return PredictionResponse(
            prediction=prediction_idx,
            predicted_class=predicted_class_name
        )
    except Exception as e:
        logger.error(f"Error during model inference: {e}")
        raise e

@app.get("/")
async def root():
    return {"message": "Welcome to the ML Prediction API. Send POST requests to /predict. Remember to set the X-API-Key header!"}
