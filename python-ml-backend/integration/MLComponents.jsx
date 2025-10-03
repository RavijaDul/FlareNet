import React, { useState, useCallback } from 'react';
import axios from 'axios';

const ML_BACKEND_URL = 'http://localhost:8001';
const JAVA_BACKEND_URL = 'http://localhost:8080';

export const MLImageAnalyzer = ({ transformerId, onAnalysisComplete }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeImage = useCallback(async (imageFile) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('return_visualizations', 'true');
      formData.append('threshold', '0.5');

      // Call Java backend which will forward to Python ML backend
      const response = await axios.post(
        `${JAVA_BACKEND_URL}/api/ml/transformers/${transformerId}/analyze-image`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      const result = response.data;
      setAnalysisResult(result);
      
      // Notify parent component
      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

    } catch (err) {
      console.error('ML analysis failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Analysis failed';
      setError(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [transformerId, onAnalysisComplete]);

  return {
    isAnalyzing,
    analysisResult,
    error,
    analyzeImage,
    clearResults: () => {
      setAnalysisResult(null);
      setError(null);
    }
  };
};

export const MLResultsDisplay = ({ result }) => {
  if (!result) return null;

  const { mlResult } = result;
  
  const getClassificationColor = (classification) => {
    switch (classification.toLowerCase()) {
      case 'faulty': return 'text-red-600 bg-red-100';
      case 'overloway': return 'text-orange-600 bg-orange-100';
      case 'potential': return 'text-yellow-600 bg-yellow-100';
      case 'normal': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-800 bg-red-200';
      case 'HIGH': return 'text-red-600 bg-red-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'LOW': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">ML Analysis Results</h3>
      
      {/* Main Results */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {(mlResult.anomalyScore * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Anomaly Score</div>
        </div>
        
        <div className="text-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getClassificationColor(mlResult.classification)}`}>
            {mlResult.classification}
          </div>
          <div className="text-sm text-gray-600 mt-1">Classification</div>
        </div>
        
        <div className="text-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(result.riskLevel)}`}>
            {result.riskLevel}
          </div>
          <div className="text-sm text-gray-600 mt-1">Risk Level</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-800">
            {mlResult.processingTime}s
          </div>
          <div className="text-sm text-gray-600">Processing Time</div>
        </div>
      </div>

      {/* Bounding Boxes */}
      {mlResult.boundingBoxes && mlResult.boundingBoxes.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-2">Detected Anomalies ({mlResult.boundingBoxes.length})</h4>
          <div className="space-y-2">
            {mlResult.boundingBoxes.map((bbox, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">
                  {bbox.type} - Confidence: {(bbox.confidence * 100).toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500">
                  {bbox.width}×{bbox.height}px
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Action */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Recommended Action</h4>
        <div className={`p-3 rounded ${result.inspectionRequired ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
          <span className={`font-medium ${result.inspectionRequired ? 'text-red-800' : 'text-green-800'}`}>
            {result.recommendedAction?.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Visualizations */}
      {mlResult.visualizations && (
        <div>
          <h4 className="font-medium mb-2">Visualizations</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(mlResult.visualizations).map(([type, url]) => (
              <a
                key={type}
                href={`${ML_BACKEND_URL}${url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 text-center text-sm bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
              >
                {type.replace('_url', '').replace('_', ' ').toUpperCase()}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Hook for batch processing
export const useMLBatchProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const processBatch = useCallback(async (imageFiles) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      imageFiles.forEach(file => {
        formData.append('files', file);
      });
      formData.append('return_visualizations', 'true');

      const response = await axios.post(
        `${JAVA_BACKEND_URL}/api/ml/batch-detect`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 120000, // 2 minute timeout for batch
        }
      );

      setResults(response.data);
    } catch (err) {
      console.error('Batch processing failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Batch processing failed';
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    results,
    error,
    processBatch,
    clearResults: () => {
      setResults(null);
      setError(null);
    }
  };
};

// Enhanced Image Upload Component with ML Integration
export const EnhancedImageUpload = ({ transformerId, onUploadComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { isAnalyzing, analysisResult, error, analyzeImage, clearResults } = MLImageAnalyzer({ 
    transformerId, 
    onAnalysisComplete: onUploadComplete 
  });

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
      
      // Clear previous results
      clearResults();
    }
  }, [clearResults]);

  const handleAnalyze = useCallback(() => {
    if (selectedFile) {
      analyzeImage(selectedFile);
    }
  }, [selectedFile, analyzeImage]);

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
          </div>
        </label>
      </div>

      {/* Preview and Analysis */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Selected: {selectedFile?.name}</span>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Image'}
            </button>
          </div>
          
          <img 
            src={preview} 
            alt="Preview" 
            className="max-w-full h-auto rounded-lg shadow-md"
            style={{ maxHeight: '300px' }}
          />
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Analyzing image with ML model...</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800 text-sm">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {analysisResult && <MLResultsDisplay result={analysisResult} />}
    </div>
  );
};

export default {
  MLImageAnalyzer,
  MLResultsDisplay,
  useMLBatchProcessor,
  EnhancedImageUpload
};