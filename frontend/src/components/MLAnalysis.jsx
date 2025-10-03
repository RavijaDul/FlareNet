import React, { useState, useCallback } from 'react';
import axios from 'axios';

const JAVA_BACKEND_URL = 'http://localhost:8080';

// Hook for ML image analysis through Java backend
export const useMLAnalysis = (transformerId) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);

  const analyzeImage = useCallback(async (imageFile, options = {}) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('transformerId', transformerId || '');
      formData.append('return_visualizations', options.returnVisualizations || 'true');
      formData.append('threshold', options.threshold || '0.5');

      // Call Java backend which forwards to Python ML backend
      const response = await axios.post(
        `${JAVA_BACKEND_URL}/api/ml/detect-anomaly`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 60000, // 60 second timeout for ML processing
        }
      );

      const result = response.data;
      setAnalysisResult(result);
      
      return result;

    } catch (err) {
      console.error('ML analysis failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Analysis failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsAnalyzing(false);
    }
  }, [transformerId]);

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

// Component to display ML analysis results with bounding boxes
export const MLResultsDisplay = ({ result }) => {
  if (!result) return null;

  const { mlResult } = result;
  
  const getClassificationColor = (classification) => {
    switch (classification?.toLowerCase()) {
      case 'faulty': return 'text-red-600 bg-red-100 border-red-300';
      case 'overloway': return 'text-orange-600 bg-orange-100 border-orange-300';
      case 'potential': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'normal': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case 'CRITICAL': return 'text-red-800 bg-red-200 border-red-400';
      case 'HIGH': return 'text-red-600 bg-red-100 border-red-300';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-300';
      case 'LOW': return 'text-green-600 bg-green-100 border-green-300';
      default: return 'text-gray-600 bg-gray-100 border-gray-300';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">🤖 ML Analysis Results</h3>
      
      {/* Main Results Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {(mlResult.anomalyScore * 100).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Anomaly Score</div>
        </div>
        
        <div className="text-center">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${getClassificationColor(mlResult.classification)}`}>
            {mlResult.classification}
          </div>
          <div className="text-sm text-gray-600 mt-1">Classification</div>
        </div>
        
        <div className="text-center">
          <div className={`px-3 py-2 rounded-lg text-sm font-medium border ${getRiskColor(result.riskLevel)}`}>
            {result.riskLevel}
          </div>
          <div className="text-sm text-gray-600 mt-1">Risk Level</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-lg font-semibold text-gray-800">
            {mlResult.processingTime}s
          </div>
          <div className="text-sm text-gray-600">Processing Time</div>
        </div>
      </div>

      {/* Bounding Boxes Section */}
      {mlResult.boundingBoxes && mlResult.boundingBoxes.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium mb-3 text-gray-800">
            🎯 Detected Anomalies ({mlResult.boundingBoxes.length})
          </h4>
          <div className="space-y-2">
            {mlResult.boundingBoxes.map((bbox, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    bbox.type === 'Critical' ? 'bg-red-500' :
                    bbox.type === 'Major' ? 'bg-orange-500' :
                    bbox.type === 'Minor' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <span className="text-sm font-medium">{bbox.type}</span>
                  <span className="text-sm text-gray-600">
                    Confidence: {(bbox.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {bbox.width}×{bbox.height}px @ ({bbox.x}, {bbox.y})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Action */}
      <div className="mb-6">
        <h4 className="font-medium mb-2 text-gray-800">📋 Recommended Action</h4>
        <div className={`p-4 rounded-lg border ${
          result.inspectionRequired ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-xl">
              {result.inspectionRequired ? '⚠️' : '✅'}
            </span>
            <span className={`font-medium ${
              result.inspectionRequired ? 'text-red-800' : 'text-green-800'
            }`}>
              {result.recommendedAction?.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            Priority: <span className="font-medium">{result.priority}</span>
          </div>
        </div>
      </div>

      {/* Visualizations */}
      {mlResult.visualizations && Object.keys(mlResult.visualizations).length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-gray-800">🎨 Visualizations</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(mlResult.visualizations).map(([type, url]) => (
              <a
                key={type}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-3 text-center text-sm bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div className="font-medium text-blue-700 group-hover:text-blue-800">
                  {type.replace('_url', '').replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-xs text-blue-600 mt-1">View Image</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Image Upload Component with ML Analysis
export const EnhancedImageUpload = ({ transformerId, onAnalysisComplete }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const { isAnalyzing, analysisResult, error, analyzeImage, clearResults } = useMLAnalysis(transformerId);

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

  const handleAnalyze = useCallback(async () => {
    if (selectedFile) {
      try {
        const result = await analyzeImage(selectedFile);
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        }
      } catch (error) {
        console.error('Analysis failed:', error);
      }
    }
  }, [selectedFile, analyzeImage, onAnalysisComplete]);

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="ml-image-upload"
        />
        <label htmlFor="ml-image-upload" className="cursor-pointer">
          <div className="space-y-3">
            <div className="mx-auto h-12 w-12 text-gray-400">
              🖼️
            </div>
            <div className="text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">PNG, JPG up to 10MB (Thermal images preferred)</p>
          </div>
        </label>
      </div>

      {/* Preview and Analysis Controls */}
      {preview && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">📁 {selectedFile?.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile?.size / 1024 / 1024).toFixed(1)} MB)
              </span>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isAnalyzing 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🤖 Analyze with AI'}
            </button>
          </div>
          
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full h-auto rounded-lg shadow-md border"
              style={{ maxHeight: '400px', margin: '0 auto', display: 'block' }}
            />
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="bg-white p-4 rounded-lg flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-sm font-medium">Processing with PatchCore AI...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">❌</span>
            <span className="text-red-800 text-sm font-medium">Analysis Failed</span>
          </div>
          <div className="text-red-700 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Results Display */}
      {analysisResult && <MLResultsDisplay result={analysisResult} />}
    </div>
  );
};

export default {
  useMLAnalysis,
  MLResultsDisplay,
  EnhancedImageUpload
};