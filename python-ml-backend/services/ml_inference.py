import asyncio
import time
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import uuid

try:
    from models.patchcore_model import PatchcoreModel
except ImportError as e:
    logger = logging.getLogger(__name__)
    logger.warning(f"Failed to import PatchcoreModel, using simple version: {e}")
    from models.simple_patchcore import SimplePatchcoreModel as PatchcoreModel

from services.image_processor import ImageProcessor
from services.bounding_box import BoundingBoxDetector
from services.thermal_visualization import ThermalVisualizationService
from config import MODEL_CONFIG, CLASSIFICATION_CONFIG, STORAGE_CONFIG

logger = logging.getLogger(__name__)

class MLInferenceService:
    """Main ML inference service orchestrating all components"""
    
    def __init__(self):
        self.model = None
        self.image_processor = ImageProcessor()
        self.bbox_detector = BoundingBoxDetector()
        self.thermal_viz = ThermalVisualizationService()
        self.ready = False
        
    async def initialize(self):
        """Initialize the ML inference service"""
        try:
            logger.info("Initializing ML Inference Service...")
            
            # Initialize model
            self.model = PatchcoreModel(
                checkpoint_path=MODEL_CONFIG["checkpoint_path"],
                config_path=MODEL_CONFIG["config_path"],
                device=MODEL_CONFIG["device"]
            )
            
            success = await self.model.load_model()
            if not success:
                raise RuntimeError("Failed to load PatchCore model")
            
            self.ready = True
            logger.info("ML Inference Service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize ML service: {e}")
            raise e
    
    def is_ready(self) -> bool:
        """Check if the service is ready for inference"""
        return self.ready and self.model and self.model.is_loaded
    
    async def process_single_image(
        self, 
        image_path: Path, 
        return_visualizations: bool = True,
        threshold: float = 0.5
    ) -> Dict:
        """
        Process a single image for anomaly detection
        
        Args:
            image_path: Path to the input image
            return_visualizations: Whether to generate visualization images
            threshold: Anomaly threshold for classification
            
        Returns:
            Dictionary containing inference results
        """
        if not self.is_ready():
            raise RuntimeError("ML service not ready")
        
        start_time = time.time()
        image_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"Processing image: {image_path}")
            
            # Load and preprocess image
            image_tensor, original_image = self.image_processor.preprocess_image(image_path)
            
            # Run inference
            if hasattr(self.model, 'predict'):
                # Use our enhanced prediction method (synchronous)
                prediction_result = self.model.predict(str(image_path))
                
                if isinstance(prediction_result, dict):
                    anomaly_score = prediction_result.get('anomaly_score', 0.5)
                    anomaly_map = prediction_result.get('anomaly_map', None)
                    
                    # Update bounding boxes if provided by the model
                    if 'bounding_boxes' in prediction_result:
                        bounding_boxes = prediction_result['bounding_boxes']
                    else:
                        bounding_boxes = []
                else:
                    # Handle tuple return (score, map)
                    if isinstance(prediction_result, (tuple, list)) and len(prediction_result) >= 2:
                        anomaly_score, anomaly_map = prediction_result[0], prediction_result[1]
                    else:
                        anomaly_score = float(prediction_result) if prediction_result is not None else 0.5
                        anomaly_map = None
                    bounding_boxes = []
            else:
                # Fallback to tensor-based prediction
                prediction_result = await self.model.predict(image_tensor)
                if isinstance(prediction_result, (tuple, list)) and len(prediction_result) >= 2:
                    anomaly_score, anomaly_map = prediction_result[0], prediction_result[1]
                else:
                    anomaly_score = float(prediction_result) if prediction_result is not None else 0.5
                    anomaly_map = None
                bounding_boxes = []
            
            # Use threshold parameter or default from model
            actual_threshold = threshold
            if actual_threshold is None:
                actual_threshold = getattr(self.model, 'threshold', 0.5)
                if hasattr(self.model, 'model') and hasattr(self.model.model, 'threshold'):
                    actual_threshold = float(self.model.model.threshold)
            
            # Classify result
            classification = self._classify_anomaly_score(anomaly_score)
            confidence = self._get_confidence_level(anomaly_score)
            is_anomalous = anomaly_score > actual_threshold
            
            # Generate additional bounding boxes if needed and none provided by model
            if is_anomalous and anomaly_map is not None and not bounding_boxes:
                bounding_boxes = self.bbox_detector.detect_bounding_boxes(
                    anomaly_map, 
                    original_image.size,
                    anomaly_score
                )
            
            # Generate visualizations if requested
            visualizations = {}
            if return_visualizations and anomaly_map is not None:
                visualizations = await self._generate_visualizations(
                    image_path,  # Pass image path for thermal visualization
                    anomaly_map, 
                    bounding_boxes,
                    image_id,
                    anomaly_score
                )
            
            processing_time = time.time() - start_time
            
            result = {
                "anomaly_score": round(anomaly_score, 4),
                "classification": classification,
                "confidence": confidence,
                "is_anomalous": is_anomalous,
                "bounding_boxes": bounding_boxes,
                "visualizations": visualizations,
                "processing_time": round(processing_time, 2),
                "model_version": "v1.0",
                "image_id": image_id
            }
            
            logger.info(f"Image processed successfully: {classification} (score: {anomaly_score:.4f})")
            return result
            
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            raise e
    
    async def process_batch_images(
        self, 
        image_paths: List[Path], 
        return_visualizations: bool = True
    ) -> Dict:
        """
        Process multiple images in batch
        
        Args:
            image_paths: List of image paths
            return_visualizations: Whether to generate visualizations
            
        Returns:
            Dictionary containing batch results
        """
        start_time = time.time()
        results = []
        
        logger.info(f"Processing batch of {len(image_paths)} images")
        
        for image_path in image_paths:
            try:
                result = await self.process_single_image(
                    image_path, 
                    return_visualizations=return_visualizations
                )
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing {image_path}: {e}")
                results.append({
                    "error": str(e),
                    "image_path": str(image_path),
                    "anomaly_score": 0.0,
                    "classification": "Error",
                    "is_anomalous": False
                })
        
        # Calculate summary statistics
        valid_results = [r for r in results if "error" not in r]
        faulty_count = sum(1 for r in valid_results if r["is_anomalous"])
        normal_count = len(valid_results) - faulty_count
        avg_processing_time = sum(r.get("processing_time", 0) for r in valid_results) / len(valid_results) if valid_results else 0
        
        total_time = time.time() - start_time
        
        return {
            "results": results,
            "summary": {
                "total_images": len(image_paths),
                "successful_processes": len(valid_results),
                "failed_processes": len(image_paths) - len(valid_results),
                "faulty_count": faulty_count,
                "normal_count": normal_count,
                "average_processing_time": round(avg_processing_time, 2),
                "total_processing_time": round(total_time, 2)
            }
        }
    
    def _classify_anomaly_score(self, score: float) -> str:
        """Classify anomaly score into categories"""
        if score < CLASSIFICATION_CONFIG["normal_threshold"]:
            return "Normal"
        elif score < CLASSIFICATION_CONFIG["potential_threshold"]:
            return "Potential"
        elif score < CLASSIFICATION_CONFIG["overloway_threshold"]:
            return "Overloway"
        else:
            return "Faulty"
    
    def _get_confidence_level(self, score: float) -> str:
        """Get confidence level based on score"""
        if score < 0.2:
            return "Very Low"
        elif score < 0.4:
            return "Low"
        elif score < 0.6:
            return "Medium"
        elif score < 0.8:
            return "High"
        else:
            return "Very High"
    
    async def _generate_visualizations(
        self, 
        original_image, 
        anomaly_map, 
        bounding_boxes: List[Dict],
        image_id: str,
        anomaly_score: float = 0.5
    ) -> Dict:
        """Generate thermal visualization images like the original trained model"""
        visualizations = {}
        
        try:
            # Get image dimensions
            if hasattr(original_image, 'size'):
                img_size = original_image.size
            else:
                # If it's a path, load it to get size
                from PIL import Image
                temp_img = Image.open(original_image)
                img_size = temp_img.size
                temp_img.close()
            
            # 1. Generate thermal overlay with bounding boxes (main visualization)
            overlay_output_path = STORAGE_CONFIG["output_dir"] / "overlays" / f"{image_id}_overlay_filtered.png"
            
            try:
                thermal_overlay_path = self.thermal_viz.create_thermal_overlay_with_boxes(
                    original_image if isinstance(original_image, str) else original_image,
                    anomaly_map,
                    bounding_boxes,
                    anomaly_score,
                    str(overlay_output_path)
                )
                if thermal_overlay_path:
                    visualizations["thermal_overlay_url"] = f"/outputs/overlays/{overlay_output_path.name}"
                    visualizations["main_visualization_url"] = visualizations["thermal_overlay_url"]
            except Exception as e:
                logger.error(f"Error creating thermal overlay: {e}")
            
            # 2. Generate pure anomaly mask
            mask_output_path = STORAGE_CONFIG["output_dir"] / "masks" / f"{image_id}_mask.png"
            try:
                mask_path = self.thermal_viz.create_pure_anomaly_mask(
                    anomaly_map,
                    img_size,
                    str(mask_output_path)
                )
                if mask_path:
                    visualizations["mask_url"] = f"/outputs/masks/{mask_output_path.name}"
            except Exception as e:
                logger.error(f"Error creating anomaly mask: {e}")
            
            # 3. Generate filtered anomaly image
            filtered_output_path = STORAGE_CONFIG["output_dir"] / "filtered" / f"{image_id}_filtered.png"
            try:
                # Use threshold from model if available
                threshold = getattr(self.model, 'threshold', 0.5)
                if hasattr(self.model, 'model') and hasattr(self.model.model, 'threshold'):
                    threshold = float(self.model.model.threshold)
                
                filtered_path = self.thermal_viz.create_filtered_anomaly_image(
                    original_image if isinstance(original_image, str) else original_image,
                    anomaly_map,
                    threshold,
                    str(filtered_output_path)
                )
                if filtered_path:
                    visualizations["filtered_url"] = f"/outputs/filtered/{filtered_output_path.name}"
            except Exception as e:
                logger.error(f"Error creating filtered image: {e}")
            
            # 4. Generate simple bounded image (fallback)
            if bounding_boxes:
                bounded_output_path = STORAGE_CONFIG["output_dir"] / "bounded" / f"{image_id}_bounded.png"
                try:
                    bounded_path = await self.image_processor.generate_bounded_image(
                        original_image, bounding_boxes, image_id
                    )
                    if bounded_path:
                        visualizations["bounded_url"] = f"/outputs/bounded/{bounded_path.name}"
                except Exception as e:
                    logger.error(f"Error creating bounded image: {e}")
            
            logger.info(f"Generated thermal visualizations for {image_id}: {list(visualizations.keys())}")
            
        except Exception as e:
            logger.error(f"Error generating thermal visualizations: {e}")
        
        return visualizations
    
    def get_model_info(self) -> Dict:
        """Get model information"""
        if not self.model:
            return {"error": "Model not initialized"}
        
        return {
            "model_type": "PatchCore",
            "version": "v1.0",
            "accuracy": 88.7,
            "f1_score": 91.6,
            "training_date": "2025-09-30",
            "supported_formats": ["jpg", "jpeg", "png"],
            "device": str(self.model.device),
            "is_ready": self.is_ready(),
            **self.model.get_model_info()
        }
    
    async def cleanup(self):
        """Clean up resources"""
        if self.model:
            await self.model.cleanup()
        self.ready = False
        logger.info("ML Inference Service cleanup completed")