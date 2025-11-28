// Transformer.jsx
import * as React from 'react';
import { useLocation } from "react-router-dom";

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField from "@mui/material/TextField";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
const { useState } = React;

import ZoomInIcon from "@mui/icons-material/ZoomIn";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { imagesAPI, annotationsAPI, maintenanceAPI } from '../services/api';
import { ActorContext } from '../context/AuthContext';
import MaintenanceRecord from '../components/MaintenanceRecord.jsx';

function Transformer() {
  const location = useLocation();
  const state = location.state || {};
  const { name: actorName, role: actorRole } = React.useContext(ActorContext);

  const [selectedbaselineFile, setSelectedbaselineFile] = React.useState(() => {
    const stored = localStorage.getItem('selectedbaselineFile');
    return stored ? JSON.parse(stored) : null;
  });
  const [selectedthermalFile, setSelectedthermalFile] = React.useState(() => {
    const stored = localStorage.getItem('selectedthermalFile');
    return stored ? JSON.parse(stored) : null;
  });
  const [weather, setweather] = React.useState(() => {
    return localStorage.getItem('weather') || "";
  });
  const [loading, setLoading] = React.useState(false);
  const [baselineUpdatedAt, setBaselineUpdatedAt] = React.useState(() => {
    const stored = localStorage.getItem('baselineUpdatedAt');
    return stored ? new Date(stored) : null;
  });
  const [baselineImageUrl, setBaselineImageUrl] = React.useState(() => {
    return localStorage.getItem('baselineImageUrl') || null;
  });
  const [thermalImageUrl, setThermalImageUrl] = React.useState(() => {
    return localStorage.getItem('thermalImageUrl') || null;
  });

  const mainImgRef = React.useRef(null);
  const [mainImgDims, setMainImgDims] = React.useState({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  });

  const updateMainDims = React.useCallback(() => {
    const img = mainImgRef.current;
    if (!img) return;
    setMainImgDims({
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      renderedWidth: img.clientWidth || 0,
      renderedHeight: img.clientHeight || 0,
    });
  }, []);

  // Initialize state from passed data or localStorage for persistence on refresh
  const [transformerNo, setTransformerNo] = React.useState(() => {
    const val = state.transformerNo || localStorage.getItem('transformerNo') || "";
    if (state.transformerNo) localStorage.setItem('transformerNo', state.transformerNo);
    return val;
  });

  const [poleno, setPoleno] = React.useState(() => {
    const val = state.poleNo || localStorage.getItem('poleNo') || "";
    if (state.poleNo) localStorage.setItem('poleNo', state.poleNo);
    return val;
  });

  const [branch, setBranch] = React.useState(() => {
    const val = state.region || localStorage.getItem('region') || "";
    if (state.region) localStorage.setItem('region', state.region);
    return val;
  });

  const [inspectedBy, setInspectedBy] = React.useState(() => {
    const val = state.inspectedBy || localStorage.getItem('inspectedBy') || actorName || "H1210";
    if (state.inspectedBy) localStorage.setItem('inspectedBy', state.inspectedBy);
    return val;
  });

  const [inspectionID, setInspectionID] = React.useState(() => {
    const val = state.inspectionID || localStorage.getItem('inspectionID') || "";
    if (state.inspectionID) localStorage.setItem('inspectionID', state.inspectionID);
    return val;
  });

  const [inspectionDate, setInspectionDate] = React.useState(() => {
    const val = state.inspectionDate || localStorage.getItem('inspectionDate') || "";
    if (state.inspectionDate) localStorage.setItem('inspectionDate', state.inspectionDate);
    return val;
  });

  const [transformerId, setTransformerId] = React.useState(() => {
    const val = state.transformerId || localStorage.getItem('transformerId') || "";
    if (state.transformerId) localStorage.setItem('transformerId', state.transformerId);
    return val;
  });

  const [inspectionNumber, setInspectionNumber] = React.useState(() => {
    const val = state.inspectionNumber || localStorage.getItem('inspectionNumber') || "";
    if (state.inspectionNumber) localStorage.setItem('inspectionNumber', state.inspectionNumber);
    return val;
  });

  // Persist
  React.useEffect(() => { localStorage.setItem('transformerNo', transformerNo); }, [transformerNo]);
  React.useEffect(() => { localStorage.setItem('poleNo', poleno); }, [poleno]);
  React.useEffect(() => { localStorage.setItem('region', branch); }, [branch]);
  React.useEffect(() => { localStorage.setItem('inspectedBy', inspectedBy); }, [inspectedBy]);
  React.useEffect(() => { localStorage.setItem('inspectionID', inspectionID); }, [inspectionID]);
  React.useEffect(() => { localStorage.setItem('inspectionDate', inspectionDate); }, [inspectionDate]);
  React.useEffect(() => { localStorage.setItem('transformerId', transformerId); }, [transformerId]);
  React.useEffect(() => { localStorage.setItem('inspectionNumber', inspectionNumber); }, [inspectionNumber]);

  const [thermalUploaded, setThermalUploaded] = React.useState(false);
  const [showComparison, setShowComparison] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [tempthreshold, setTempthreshold] = React.useState(50);

  // Maintenance record dialog state
  const [openMaintenanceDialog, setOpenMaintenanceDialog] = React.useState(false);
  const [maintenanceMode, setMaintenanceMode] = React.useState('add'); // 'add' | 'edit'
  const [maintenanceInitialData, setMaintenanceInitialData] = React.useState(null);
  const [savedMaintenanceRecord, setSavedMaintenanceRecord] = React.useState(null);

  const [comment, setComment] = React.useState("");
  const [savedComment, setSavedComment] = React.useState("");
  const [isEditing, setIsEditing] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState(null);

  ///////////////////////////////////////////////////////////
  const [anomalyData, setAnomalyData] = useState({
    image: "",
    status: "",
    anomalies: [],
  });

  // Edit mode states
  const [isEditMode, setIsEditMode] = React.useState(false);
  const [isAdding, setIsAdding] = React.useState(false);
  const [selectedAnomaly, setSelectedAnomaly] = React.useState(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [draggedAnomaly, setDraggedAnomaly] = React.useState(null);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizedAnomaly, setResizedAnomaly] = React.useState(null);
  const [resizeHandle, setResizeHandle] = React.useState(null);
  const [draggingState, setDraggingState] = React.useState(null);
  const [resizingState, setResizingState] = React.useState(null);
  const [openZoom, setOpenZoom] = React.useState(false);
  const [reasonEditing, setReasonEditing] = React.useState({});

  const handleOpenZoom = () => setOpenZoom(true);
  const handleCloseZoom = () => setOpenZoom(false);

  // Whenever analysisResult changes, update anomalyData
  React.useEffect(() => {
    if (analysisResult) {
      setAnomalyData(prev => ({
        image: analysisResult.image || "",
        status: analysisResult.status || "",
        anomalies: (analysisResult.anomalies || []).map(a => ({
          ...a,
          isUserAdded: a.isUserAdded ?? false,
          isDeleted: a.isDeleted ?? false,
        })),
      }));
    }
  }, [analysisResult]);

  const imgRef = React.useRef(null);
  const [imgDims, setImgDims] = React.useState({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  });

  const updateDims = React.useCallback(() => {
    const img = imgRef.current;
    if (!img) return;
    setImgDims({
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      renderedWidth: img.clientWidth || 0,
      renderedHeight: img.clientHeight || 0,
    });
  }, []);

  React.useEffect(() => {
    if (!imgRef.current) return;
    const ro = new ResizeObserver(updateDims);
    ro.observe(imgRef.current);
    return () => ro.disconnect();
  }, [updateDims, thermalImageUrl]);

  React.useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (draggingState) {
        setAnomalyData(prev => ({
          ...prev,
          anomalies: prev.anomalies.map((a, i) =>
            i === draggingState.idx ? markEdited({ ...a, bbox: draggingState.bbox }) : a
          )
        }));
        setDraggingState(null);
      }
      if (resizingState) {
        setAnomalyData(prev => ({
          ...prev,
          anomalies: prev.anomalies.map((a, i) =>
            i === resizingState.idx ? markEdited({ ...a, bbox: resizingState.bbox }) : a
          )
        }));
        setResizingState(null);
      }
      setIsDragging(false);
      setDraggedAnomaly(null);
      setIsResizing(false);
      setResizedAnomaly(null);
      setResizeHandle(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [draggingState, resizingState]);

  React.useEffect(() => {
    if (!(isDragging || isResizing)) return;
    const onMove = (e) => handleMouseMove(e);
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [isDragging, isResizing]);

  const handleSaveComment = () => {
    setSavedComment(comment);
    setIsEditing(false);
  };

  const handleEditComment = () => {
    setIsEditing(true);
  };

  const handleClearComment = () => {
    setComment("");
    setSavedComment("");
    setIsEditing(false);
  };

  // Helper functions for edit mode
  const convertRenderedToNatural = (renderedX, renderedY, renderedW, renderedH) => {
    const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = mainImgDims;
    if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight)
      return { x: 0, y: 0, width: 0, height: 0 };
    const sx = naturalWidth / renderedWidth;
    const sy = naturalHeight / renderedHeight;
    const offsetX = 0;
    const offsetY = 43;
    return {
      x: Math.max(0, (renderedX - offsetX) * sx),
      y: Math.max(0, (renderedY - offsetY) * sy),
      width: renderedW * sx,
      height: renderedH * sy,
    };
  };

  const convertNaturalToRendered = (naturalX, naturalY, naturalW, naturalH) => {
    const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = mainImgDims;
    if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight)
      return { x: 0, y: 0, width: 0, height: 0 };
    const sx = renderedWidth / naturalWidth;
    const sy = renderedHeight / naturalHeight;
    const offsetX = 0;
    const offsetY = 43;
    return {
      x: naturalX * sx + offsetX,
      y: naturalY * sy + offsetY,
      width: naturalW * sx,
      height: naturalH * sy,
    };
  };

  const handleEditToggle = () => {
    setIsEditMode(!isEditMode);
    setIsAdding(false);
    setSelectedAnomaly(null);
  };

  const handleAddToggle = () => {
    setIsAdding(!isAdding);
    setSelectedAnomaly(null);
  };

  const currentUserId = (actorName && actorName.trim()) || inspectedBy || "UNKNOWN";

  const handleSaveAnnotations = async () => {
    if (!selectedthermalFile || !selectedthermalFile.id) return;
    const annotationsJson = JSON.stringify(anomalyData);
    try {
      await annotationsAPI.save(selectedthermalFile.id, currentUserId, annotationsJson);
      alert("Annotations saved successfully!");
      setIsEditMode(false);
      setSelectedAnomaly(null);
      setIsAdding(false);
    } catch (err) {
      console.error("Save error:", err);
      alert("Failed to save annotations");
    }
  };

  const markEdited = (anomaly, opts = {}) => {
    const { setConfidenceToOne = true } = opts;
    return {
      ...anomaly,
      edited: true,
      editedAt: new Date().toISOString(),
      editedBy: currentUserId,
      ...(setConfidenceToOne ? { confidence: 1 } : {}),
      isUserAdded: anomaly.isUserAdded ?? false,
      isDeleted: anomaly.isDeleted ?? false,
    };
  };

  const handleImageClick = (e) => {
    if (!isAdding) return;
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newAnomaly = markEdited({
      label: "New Anomaly",
      category: "unknown",
      severity: "Potentially Faulty",
      confidence: 0.5,
      bbox: convertRenderedToNatural(x, y, 50, 50),
      editReason: "",
      isDeleted: false,
      isUserAdded: true,
    });
    setAnomalyData(prev => ({
      ...prev,
      anomalies: [...prev.anomalies, newAnomaly],
    }));
    setIsAdding(false);
  };

  const handleDeleteAnomaly = (idx) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) =>
        i === idx ? { ...markEdited(a, { setConfidenceToOne: false }), isDeleted: true } : a
      )
    }));
  };

  const handleSeverityChange = (idx) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) =>
        i === idx
          ? markEdited({
              ...a,
              severity:
                a.severity === "Faulty"
                  ? "Potentially Faulty"
                  : a.severity === "Potentially Faulty"
                  ? "Normal"
                  : "Faulty",
            })
          : a
      ),
    }));
  };

  const handleLabelChange = (idx, newLabel) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) =>
        i === idx ? markEdited({ ...a, label: newLabel }) : a
      ),
    }));
  };

  const handleEditReasonChange = (idx, reason) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) =>
        i === idx ? { ...a, editReason: reason } : a
      ),
    }));
  };

  const handleEditReasonSave = (idx) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) =>
        i === idx ? { ...a, editReasonSavedAt: new Date().toISOString() } : a
      ),
    }));
  };

  const handleExportFeedbackLog = () => {
    if (!anomalyData || !anomalyData.anomalies || anomalyData.anomalies.length === 0) {
      alert('No anomalies to export');
      return;
    }

    const headers = [
      'Thermal_Image_ID',
      'Anomaly_Index',
      'Is_User_Added',
      'Model_Predicted_Label',
      'Model_Predicted_Severity',
      'Model_Predicted_Confidence',
      'Model_Predicted_BBox_X',
      'Model_Predicted_BBox_Y',
      'Model_Predicted_BBox_Width',
      'Model_Predicted_BBox_Height',
      'User_Edited',
      'Current_Label',
      'Current_Severity',
      'Current_Confidence',
      'Current_BBox_X',
      'Current_BBox_Y',
      'Current_BBox_Width',
      'Current_BBox_Height',
      'Is_Deleted',
      'Is_Final_Accepted',
      'User_ID',
      'Edit_Timestamp',
      'Edit_Reason'
    ];

    const rows = anomalyData.anomalies.map((anomaly, idx) => {
      const imageId = selectedthermalFile?.id || anomalyData.thermalImageId || 'N/A';
      const isUserAdded = anomaly.isUserAdded || false;
      const isEdited = anomaly.edited || false;
      const isDeleted = anomaly.isDeleted || false;
      const isFinalAccepted = !isDeleted;

      const modelLabel = isUserAdded ? 'N/A' : (anomaly.label || 'Unknown');
      const modelSeverity = isUserAdded ? 'N/A' : (anomaly.severity || 'Unknown');
      const modelConfidence = isUserAdded ? 'N/A' : (anomaly.confidence ?? 0);
      const modelBboxX = isUserAdded ? 'N/A' : (anomaly.bbox?.x ?? 0);
      const modelBboxY = isUserAdded ? 'N/A' : (anomaly.bbox?.y ?? 0);
      const modelBboxWidth = isUserAdded ? 'N/A' : (anomaly.bbox?.width ?? 0);
      const modelBboxHeight = isUserAdded ? 'N/A' : (anomaly.bbox?.height ?? 0);

      const currentLabel = anomaly.label || 'Unknown';
      const currentSeverity = anomaly.severity || 'Unknown';
      const currentConfidence = anomaly.confidence ?? 0;
      const currentBboxX = anomaly.bbox?.x ?? 0;
      const currentBboxY = anomaly.bbox?.y ?? 0;
      const currentBboxWidth = anomaly.bbox?.width ?? 0;
      const currentBboxHeight = anomaly.bbox?.height ?? 0;

      const userId = anomaly.editedBy || currentUserId || 'N/A';
      const editTimestamp = anomaly.editedAt || 'N/A';
      const editReason = anomaly.editReason || 'N/A';

      return [
        imageId,
        idx + 1,
        isUserAdded ? 'Yes' : 'No',
        modelLabel,
        modelSeverity,
        modelConfidence,
        modelBboxX,
        modelBboxY,
        modelBboxWidth,
        modelBboxHeight,
        isEdited ? 'Yes' : 'No',
        currentLabel,
        currentSeverity,
        currentConfidence,
        currentBboxX,
        currentBboxY,
        currentBboxWidth,
        currentBboxHeight,
        isDeleted ? 'Yes' : 'No',
        isFinalAccepted ? 'Yes' : 'No',
        userId,
        editTimestamp,
        editReason
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row =>
        row
          .map(cell => {
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `feedback_log_${selectedthermalFile?.id || 'unknown'}_${timestamp}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isOverlapping = (bbox1, bbox2) => {
    return !(
      bbox1.x + bbox1.width <= bbox2.x ||
      bbox2.x + bbox2.width <= bbox1.x ||
      bbox1.y + bbox1.height <= bbox2.y ||
      bbox2.y + bbox2.height <= bbox1.y
    );
  };

  const handleMouseMove = (e) => {
    if (isDragging && draggedAnomaly !== null) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const sx = mainImgDims.naturalWidth / mainImgDims.renderedWidth;
      const sy = mainImgDims.naturalHeight / mainImgDims.renderedHeight;
      const naturalDeltaX = deltaX * sx;
      const naturalDeltaY = deltaY * sy;
      const originalBbox = anomalyData.anomalies[draggedAnomaly].bbox;
      const newX = originalBbox.x + naturalDeltaX;
      const newY = originalBbox.y + naturalDeltaY;
      const newBbox = { ...originalBbox, x: newX, y: newY };
      setDraggingState({ idx: draggedAnomaly, bbox: newBbox });
      setDragStart({ x: e.clientX, y: e.clientY });
    } else if (isResizing && resizedAnomaly !== null) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      const sx = mainImgDims.naturalWidth / mainImgDims.renderedWidth;
      const sy = mainImgDims.naturalHeight / mainImgDims.renderedHeight;
      const naturalDeltaX = deltaX * sx;
      const naturalDeltaY = deltaY * sy;
      const originalBbox = anomalyData.anomalies[resizedAnomaly].bbox;
      const newWidth = Math.max(10, originalBbox.width + naturalDeltaX);
      const newHeight = Math.max(10, originalBbox.height + naturalDeltaY);
      const newBbox = { ...originalBbox, width: newWidth, height: newHeight };
      setResizingState({ idx: resizedAnomaly, bbox: newBbox });
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    if (draggingState) {
      setAnomalyData(prev => ({
        ...prev,
        anomalies: prev.anomalies.map((a, i) =>
          i === draggingState.idx ? markEdited({ ...a, bbox: draggingState.bbox }) : a
        )
      }));
      setDraggingState(null);
    }
    if (resizingState) {
      setAnomalyData(prev => ({
        ...prev,
        anomalies: prev.anomalies.map((a, i) =>
          i === resizingState.idx ? markEdited({ ...a, bbox: resizingState.bbox }) : a
        )
      }));
      setResizingState(null);
    }
    setIsDragging(false);
    setDraggedAnomaly(null);
    setIsResizing(false);
    setResizedAnomaly(null);
    setResizeHandle(null);
  };

  const uploader = (actorName && actorName.trim()) || inspectedBy;

  const handleChange = (event) => {
    setweather(event.target.value);
  };

  // Fetch images / maintenance
  React.useEffect(() => {
    const fetchImages = async () => {
      if (!transformerId || !inspectionID) return;

      setLoading(true);
      try {
        const baselineResponse = await imagesAPI.getBaseline(transformerId);
        if (baselineResponse.data) {
          const baselineImg = baselineResponse.data;
          setSelectedbaselineFile({
            file: null,
            tag: "BASELINE",
            weather: baselineImg.weatherCondition,
            url: baselineImg.url,
          });
          setBaselineImageUrl(baselineImg.url);
          setBaselineUpdatedAt(new Date(baselineImg.uploadedAt));
          setweather(baselineImg.weatherCondition);
        }

        const maintenanceResponse = await imagesAPI.getMaintenanceByInspection(transformerId, inspectionID);
        if (maintenanceResponse.data && maintenanceResponse.data.length > 0) {
          const thermalImg = maintenanceResponse.data[0];
          setSelectedthermalFile({
            id: thermalImg.id,
            tag: "MAINTENANCE",
            url: thermalImg.url,
          });
          setThermalImageUrl(thermalImg.url);

          if (thermalImg.analysis) {
            try {
              const parsed = JSON.parse(thermalImg.analysis);
              setAnalysisResult(parsed);
              console.log("Fetched and parsed saved analysis:", parsed);
            } catch (err) {
              console.error("Error parsing saved analysis JSON:", err);
            }
          }

          try {
            const annotationsResponse = await annotationsAPI.get(thermalImg.id);
            if (annotationsResponse.data && annotationsResponse.data.annotationsJson) {
              const userAnnotations = JSON.parse(annotationsResponse.data.annotationsJson);
              setAnalysisResult(userAnnotations);
              console.log("Fetched and parsed user annotations:", userAnnotations);
            }
          } catch (err) {
            console.error("Error fetching user annotations:", err);
          }

          try {
            const mrResp = await maintenanceAPI.getByTransformerAndInspection(transformerId, inspectionID);
            if (mrResp.data && Array.isArray(mrResp.data) && mrResp.data.length > 0) {
              const rec = mrResp.data[mrResp.data.length - 1];
              try {
                const parsed = typeof rec.recordJson === 'string'
                  ? JSON.parse(rec.recordJson)
                  : rec.recordJson;
                setSavedMaintenanceRecord(parsed);
                console.log('Loaded maintenance record from server:', parsed);
              } catch (e) {
                console.warn('Failed to parse maintenance recordJson', e);
              }
            }
          } catch (err) {
            console.error('Error fetching maintenance records:', err);
          }
        }
      } catch (error) {
        console.error("Error fetching existing images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [transformerId, inspectionID]);

  // Handle file selection for baseline
  const handlebaselineFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!weather) {
      alert("Please select weather condition before uploading baseline image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", "BASELINE");
      formData.append("weatherCondition", weather.toUpperCase());
      formData.append("uploader", uploader);
      formData.append("inspectionId", inspectionID);

      const response = await imagesAPI.upload(transformerId, formData);
      const uploadedImg = response.data;

      setSelectedbaselineFile({
        file: null,
        tag: "BASELINE",
        weather: uploadedImg.weatherCondition,
        url: uploadedImg.url,
      });
      setBaselineImageUrl(uploadedImg.url);
      setBaselineUpdatedAt(new Date(uploadedImg.uploadedAt));
      console.log("Baseline uploaded successfully or already existed:", uploadedImg);
    } catch (error) {
      console.error("Error in baseline upload:", error);
      if (error.response) {
        console.error("Backend error response:", error.response.data);
        console.error("Status:", error.response.status);
      }
      alert(`Failed to upload baseline: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle file selection for thermal
  const handlethermalFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setAnalysisResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("imageType", "MAINTENANCE");
      if (weather) {
        formData.append("weatherCondition", weather.toUpperCase());
      }
      formData.append("uploader", uploader);
      formData.append("inspectionId", inspectionID);

      const response = await imagesAPI.upload(transformerId, formData);
      const uploadedImg = response.data;

      setSelectedthermalFile({
        id: uploadedImg.id,
        tag: "MAINTENANCE",
        url: uploadedImg.url,
      });
      setThermalImageUrl(uploadedImg.url);
      console.log("Thermal image uploaded successfully:", uploadedImg);

      if (uploadedImg.analysis) {
        try {
          const parsed = JSON.parse(uploadedImg.analysis);
          console.log("Dataset:", parsed);
          setAnalysisResult(parsed);
        } catch (err) {
          console.error("Error parsing analysis JSON:", err);
          setAnalysisResult(uploadedImg.analysis);
        }
      }

      setThermalUploaded(true);
      setProgress(0);

      let value = 0;
      const interval = setInterval(() => {
        value += 100 / (3000 / 30);
        setProgress(Math.min(value, 100));
      }, 30);

      setTimeout(() => {
        clearInterval(interval);
        setShowComparison(true);
      }, 3000);
    } catch (error) {
      console.error("Error in thermal image upload:", error);
      if (error.response) {
        console.error("Backend error response:", error.response.data);
        console.error("Status:", error.response.status);
      }
      alert(`Failed to upload thermal image: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBaseline = async () => {
    if (!transformerId) return;
    setLoading(true);
    try {
      await imagesAPI.deleteBaseline(transformerId);
      setSelectedbaselineFile(null);
      setBaselineImageUrl(null);
      setBaselineUpdatedAt(null);
      setweather("");
      console.log("Baseline image deleted successfully");
    } catch (error) {
      console.error("Error deleting baseline image:", error);
      alert(`Failed to delete baseline image: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Maintenance record dialog open helpers
  const handleOpenAddInspection = () => {
    setMaintenanceMode('add');
    setMaintenanceInitialData(null);
    if (actorName && actorName.trim()) setInspectedBy(actorName);
    setOpenMaintenanceDialog(true);
  };

  const handleOpenEditInspection = () => {
    if (!inspectionID) return;
    setMaintenanceMode('edit');
    setMaintenanceInitialData({
      inspectionID,
      inspectionDate,
      inspectionNumber,
      transformerNo,
      poleno,
      branch,
      transformerId,
      ...(savedMaintenanceRecord || {}),
    });
    setOpenMaintenanceDialog(true);
  };

  const handleCloseMaintenance = () => {
    setOpenMaintenanceDialog(false);
    setMaintenanceInitialData(null);
  };

  const handleSaveMaintenance = async (data) => {
    setSavedMaintenanceRecord(data ? { ...(data || {}) } : null);

    setOpenMaintenanceDialog(false);
    setMaintenanceInitialData(null);

    if (!inspectionID || !transformerId) {
      console.warn('Missing inspectionID or transformerId; saved locally only');
      try {
        localStorage.setItem(
          `maintenance_draft_${inspectionID || 'unknown'}`,
          JSON.stringify(data || {})
        );
      } catch (err) {
        console.warn('Could not write maintenance draft to localStorage', err);
      }
      return;
    }

    try {
      const payload = data || {};
      const resp = await maintenanceAPI.saveForInspection(
        inspectionID,
        transformerId,
        currentUserId,
        payload
      );
      console.log('Saved maintenance record to server:', resp.data);
      if (resp.data) {
        let parsedRecord = null;
        try {
          parsedRecord = typeof resp.data.recordJson === 'string'
            ? JSON.parse(resp.data.recordJson)
            : resp.data.recordJson;
        } catch (e) {
          console.warn('Could not parse recordJson from server response', e);
        }
        setSavedMaintenanceRecord(parsedRecord || resp.data);
      }
      try { localStorage.removeItem(`maintenance_draft_${inspectionID}`); } catch (e) {}
    } catch (err) {
      console.error('Failed to save maintenance record to server:', err);
      alert('Failed to save maintenance record to server; saved locally.');
      try {
        localStorage.setItem(
          `maintenance_draft_${inspectionID}`,
          JSON.stringify(data || {})
        );
      } catch (e) {
        console.warn('Could not persist maintenance draft locally', e);
      }
    }
  };

  // ================= RENDER =================
  return (
    <Box sx={{ p: 3, bgcolor: "#f4f5fb", minHeight: "100vh" }}>
      {/* Heading */}
      <Box
        sx={{
          mb: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#111827" }}>
          Transformer
        </Typography>
        {/* you can add a small chip with inspection number here if you like */}
      </Box>

      {/* Inspection card */}
      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          p: 2.5,
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#111827", mb: 0.5 }}
          >
            {inspectionNumber}
          </Typography>
          <Typography variant="body2" sx={{ color: "#4b5563" }}>
            {inspectionDate}
          </Typography>
        </Box>

        {/* RIGHT SIDE BASELINE PANEL — restored original layout */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            minWidth: 260,
          }}
        >
          {/* Last updated text */}
          <p
            style={{
              fontSize: "12px",
              color: "#070708ff",
              marginBottom: 6,
            }}
          >
            {baselineUpdatedAt
              ? `Last updated: ${baselineUpdatedAt.toLocaleString()}`
              : "Select Weather to Upload Baseline"}
          </p>

          {/* Weather dropdown (only when no baseline uploaded) */}
          {!selectedbaselineFile && (
            <FormControl fullWidth size="small" sx={{ mb: 1 }}>
              <InputLabel id="weather-select-label">Weather</InputLabel>
              <Select
                labelId="weather-select-label"
                id="weather-select"
                value={weather}
                label="Weather"
                onChange={handleChange}
                disabled={!!selectedbaselineFile}
              >
                <MenuItem value="SUNNY">Sunny</MenuItem>
                <MenuItem value="CLOUDY">Cloudy</MenuItem>
                <MenuItem value="RAINY">Rain</MenuItem>
              </Select>
            </FormControl>
          )}

          {/* Hidden file input */}
          <input
            accept="image/*"
            id="uploadbaseline-button-file"
            type="file"
            style={{ display: "none" }}
            onChange={handlebaselineFileChange}
            disabled={!weather || !!selectedbaselineFile || loading}
          />

          {/* Baseline button (restored style) */}
          <label htmlFor="uploadbaseline-button-file">
            <Button
              variant="contained"
              size="small"
              component="span"
              disabled={!weather || !!selectedbaselineFile || loading}
              sx={{
                mt: 1,
                backgroundColor: "#e0e0e0",
                color: "#555",
                boxShadow: "none",
                borderRadius: 1,
                fontWeight: 600,
                px: 3,
                textTransform: "uppercase",
                "&:hover": { backgroundColor: "#d5d5d5", boxShadow: "none" },
              }}
            >
              BASELINE IMAGE
            </Button>
          </label>

          {/* Preview + delete icon */}
          {baselineImageUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginTop: "10px",
                gap: "8px",
              }}
            >
              <img
                src={`http://localhost:8080${baselineImageUrl}`}
                alt="Baseline"
                style={{ width: "100px", borderRadius: "8px" }}
              />
              <IconButton
                aria-label="delete"
                color="error"
                onClick={handleDeleteBaseline}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          )}
        </div>
      </Paper>

      {/* Buttons aligned to the right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          width: "100%",
          mb: 0.5,
        }}
      >
        {actorRole === "engineer" ? (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<EditIcon />}
            onClick={handleOpenEditInspection}
            disabled={!inspectionID}
            sx={{
              borderRadius: 999,
              textTransform: "none",
              px: 3,
              boxShadow: "0px 4px 12px rgba(79,70,229,0.25)",
            }}
          >
            ADD/Edit Maintenance Record
          </Button>
        ) : (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button variant="contained" size="small" disabled>
              ADD/Edit Maintenance Record
            </Button>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280" }}
            >
              Visible to engineers only
            </Typography>
          </Box>
        )}
      </Box>

      <Typography
        variant="caption"
        sx={{ mt: 0, color: "#9ca3af", textAlign: "right", display: "block" }}
      >
        Accessible for authorised users only
      </Typography>

      {/* Transformer details */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          mt: 2,
        }}
      >
        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            minWidth: 160,
            borderRadius: 2,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            Transformer No
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {transformerNo}
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            minWidth: 160,
            borderRadius: 2,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            Pole No
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {poleno}
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            minWidth: 160,
            borderRadius: 2,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            Branch
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {branch}
          </Typography>
        </Paper>

        <Paper
          elevation={1}
          sx={{
            p: 1.5,
            minWidth: 160,
            borderRadius: 2,
            bgcolor: "#f9fafb",
          }}
        >
          <Typography variant="caption" sx={{ color: "#4b5563" }}>
            Inspected By
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
            {inspectedBy}
          </Typography>
        </Paper>
      </Box>

      {/* Thermal Image card */}
      <Paper
        elevation={2}
        sx={{
          mt: 3,
          p: 3,
          borderRadius: 3,
          boxShadow: "0px 2px 10px rgba(15,23,42,0.06)",
          bgcolor: "#f9fafb",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1.5, color: "#111827" }}
        >
          Thermal Image
        </Typography>

        {/* When no thermal image selected */}
        {!selectedthermalFile && !loading && (
          <>
            <Typography
              variant="caption"
              sx={{ color: "#6b7280", mb: 1 }}
            >
              Select Thermal Image
            </Typography>

            <input
              accept="image/*"
              id="uploadthermal-button-file"
              type="file"
              style={{ display: "none" }}
              onChange={handlethermalFileChange}
              disabled={!selectedbaselineFile || loading}
            />
            <label htmlFor="uploadthermal-button-file">
              <Button
                variant="contained"
                size="small"
                component="span"
                disabled={!selectedbaselineFile || loading}
                sx={{ borderRadius: 2, textTransform: "none", boxShadow: "none" }}
              >
                Thermal Image
              </Button>
            </label>
          </>
        )}

        {/* Loading state */}
        {loading && (
          <Typography
            variant="body2"
            sx={{ fontWeight: 600, color: "orange", mt: 1 }}
          >
            Uploading Image...
          </Typography>
        )}

        {/* Processing bar */}
        {selectedthermalFile && !anomalyData.status && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, color: "orange", mb: 1 }}
            >
              Processing Thermal Image...
            </Typography>
            <Box
              sx={{
                width: "100%",
                height: 10,
                bgcolor: "#e0e0e0",
                borderRadius: 5,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${progress}%`,
                  bgcolor: "#3f51b5",
                  transition: "width 0.2s",
                }}
              />
            </Box>
          </Box>
        )}

        {/* Baseline & thermal side by side */}
        {!loading && baselineImageUrl && thermalImageUrl && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              alignItems: "start",
              mt: 3,
            }}
          >
            {/* Baseline */}
            <Box sx={{ textAlign: "center" }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                Baseline
              </Typography>
              <img
                src={`http://localhost:8080${baselineImageUrl}`}
                alt="Baseline"
                style={{
                  width: "100%",
                  maxWidth: 700,
                  height: "auto",
                  borderRadius: 12,
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </Box>

            {/* Maintenance + overlay */}
            <Box
              sx={{
                textAlign: "center",
                position: "relative",
                display: "inline-block",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, mb: 1 }}
              >
                Maintenance
              </Typography>

              <img
                ref={mainImgRef}
                src={`http://localhost:8080${thermalImageUrl}`}
                alt="Thermal"
                style={{
                  width: "100%",
                  maxWidth: 700,
                  height: "auto",
                  borderRadius: 12,
                  cursor: isAdding
                    ? "crosshair"
                    : isDragging
                    ? "grabbing"
                    : "default",
                  userSelect: "none",
                }}
                onLoad={updateMainDims}
                onClick={handleImageClick}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                draggable={false}
              />

              {/* Overlay (unchanged logic) */}
              {anomalyData?.status &&
                anomalyData.anomalies
                  .filter((a) => !a.isDeleted)
                  .map((a, idx) => {
                    const currentA =
                      draggingState && draggingState.idx === idx
                        ? { ...a, bbox: draggingState.bbox }
                        : resizingState && resizingState.idx === idx
                        ? { ...a, bbox: resizingState.bbox }
                        : a;

                    const {
                      naturalWidth,
                      naturalHeight,
                      renderedWidth,
                      renderedHeight,
                    } = mainImgDims;
                    if (
                      !naturalWidth ||
                      !naturalHeight ||
                      !renderedWidth ||
                      !renderedHeight
                    )
                      return null;

                    const { x, y, width: bw, height: bh } = currentA.bbox;
                    const sx = renderedWidth / naturalWidth;
                    const sy = renderedHeight / naturalHeight;

                    const offsetX = 0;
                    const offsetY = 43;

                    const left = x * sx + offsetX;
                    const top = y * sy + offsetY;
                    const w = bw * sx;
                    const h = bh * sy;

                    const isFaulty = (currentA.severity || "")
                      .toLowerCase()
                      .startsWith("faulty");
                    const color = isFaulty ? "red" : "gold";
                    const isSelected = selectedAnomaly === idx;

                    return (
                      <React.Fragment key={idx}>
                        <div
                          style={{
                            position: "absolute",
                            left,
                            top,
                            width: w,
                            height: h,
                            border: `2px solid ${color}`,
                            borderRadius: 4,
                            boxSizing: "border-box",
                            cursor: isEditMode ? "move" : "default",
                            backgroundColor: isSelected
                              ? "rgba(0,0,0,0.1)"
                              : "transparent",
                          }}
                          onClick={() =>
                            isEditMode &&
                            setSelectedAnomaly(isSelected ? null : idx)
                          }
                          onMouseDown={(e) => {
                            if (!isEditMode) return;
                            e.stopPropagation();
                            setIsDragging(true);
                            setDraggedAnomaly(idx);
                            setDragStart({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            if (!isEditMode) return;
                            if (isDragging && draggedAnomaly === idx)
                              handleMouseMove(e);
                          }}
                          onMouseUp={handleMouseUp}
                        />

                        {isEditMode && (
                          <div
                            style={{
                              position: "absolute",
                              left: left + w - 10,
                              top: top + h - 10,
                              width: 20,
                              height: 20,
                              background: isSelected
                                ? "rgba(0,0,255,0.8)"
                                : "rgba(0,0,255,0.5)",
                              cursor: "se-resize",
                              borderRadius: 2,
                              border: "1px solid blue",
                            }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setSelectedAnomaly(idx);
                              setIsResizing(true);
                              setResizedAnomaly(idx);
                              setResizeHandle("se");
                              setDragStart({ x: e.clientX, y: e.clientY });
                            }}
                            onMouseMove={(e) => {
                              if (!isEditMode) return;
                              if (isResizing && resizedAnomaly === idx)
                                handleMouseMove(e);
                            }}
                            onMouseUp={handleMouseUp}
                          />
                        )}

                        <div
                          style={{
                            position: "absolute",
                            left,
                            top: Math.max(0, top - 20),
                            background: color,
                            color: isFaulty ? "#fff" : "#000",
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 700,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            cursor: isEditMode ? "pointer" : "default",
                          }}
                          onClick={() =>
                            isEditMode &&
                            setSelectedAnomaly(isSelected ? null : idx)
                          }
                        >
                          #{idx + 1} ({(currentA.confidence ?? 0).toFixed(2)})
                        </div>

                        {isEditMode && isSelected && (
                          <>
                            <div
                              style={{
                                position: "absolute",
                                left: left + w + 5,
                                top,
                                background: "white",
                                border: "1px solid #ccc",
                                borderRadius: 4,
                                padding: "2px 4px",
                                fontSize: 10,
                                cursor: "pointer",
                              }}
                              onClick={() => handleSeverityChange(idx)}
                            >
                              {currentA.severity}
                            </div>

                            <TextField
                              label="Label"
                              value={currentA.label}
                              onChange={(e) =>
                                handleLabelChange(idx, e.target.value)
                              }
                              size="small"
                              sx={{
                                position: "absolute",
                                left: left + w + 5,
                                top: top + 20,
                                "& .MuiInputBase-root": {
                                  backgroundColor: color,
                                },
                                "& .MuiInputBase-input": {
                                  color: isFaulty ? "#fff" : "#000",
                                },
                                "& .MuiInputLabel-root": {
                                  color: isFaulty ? "#fff" : "#000",
                                },
                                "& .MuiInputLabel-root.Mui-focused": {
                                  color: isFaulty ? "#fff" : "#000",
                                },
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: color,
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: color,
                                },
                                "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: color,
                                  },
                              }}
                            />

                            <IconButton
                              style={{
                                position: "absolute",
                                left: left + w - 20,
                                top: top - 20,
                                background: "white",
                                padding: 2,
                              }}
                              size="small"
                              onClick={() => handleDeleteAnomaly(idx)}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}

              {/* Action buttons under Maintenance image */}
              <Box
                sx={{
                  mt: 1.5,
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                }}
              >
                <Tooltip title="Toggle edit mode">
                  <IconButton
                    aria-label="edit"
                    color={isEditMode ? "secondary" : "default"}
                    onClick={handleEditToggle}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>

                {isEditMode && (
                  <Tooltip title="Add new anomaly box">
                    <IconButton
                      aria-label="add"
                      color={isAdding ? "secondary" : "default"}
                      onClick={handleAddToggle}
                    >
                      <AddIcon />
                    </IconButton>
                  </Tooltip>
                )}

                <Tooltip title="Save annotations">
                  <span>
                    <IconButton
                      aria-label="save"
                      color="primary"
                      onClick={handleSaveAnnotations}
                      disabled={
                        !selectedthermalFile ||
                        !anomalyData.anomalies ||
                        anomalyData.anomalies.length === 0
                      }
                    >
                      <SaveIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Delete maintenance image">
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={async () => {
                      if (!selectedthermalFile || !transformerId) return;
                      try {
                        const imgId =
                          selectedthermalFile.id ||
                          selectedthermalFile.imageId;
                        if (imgId)
                          await imagesAPI.deleteImage(transformerId, imgId);
                        setSelectedthermalFile(null);
                        setThermalImageUrl(null);
                        setAnomalyData({
                          image: "",
                          status: "",
                          anomalies: [],
                        });
                        console.log(
                          "Thermal image deleted",
                          transformerId,
                          "ID",
                          imgId
                        );
                      } catch (error) {
                        console.error("Delete error:", error);
                        alert("Failed to delete image");
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Open zoom view">
                  <IconButton
                    aria-label="zoom"
                    color="primary"
                    onClick={handleOpenZoom}
                  >
                    <ZoomInIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Errors Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1.5 }}
        >
          Errors
        </Typography>

        {anomalyData?.anomalies && anomalyData.anomalies.length > 0 ? (
          anomalyData.anomalies
            .filter((a) => !(a.isUserAdded && a.isDeleted))
            .map((anomaly, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  bgcolor: "#ffffff",
                  borderRadius: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
                }}
              >
                {anomaly.edited && (
                  <>
                    <Box
                      sx={{
                        mb: 0.5,
                        p: "6px 8px",
                        borderRadius: 1.5,
                        bgcolor: "#fff7e6",
                        border: "1px solid #f0ad4e",
                        color: "#8a6d3b",
                        fontSize: 12,
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <strong>User Edited Anomoly</strong>
                    </Box>
                    <Typography
                      variant="caption"
                      sx={{ display: "block", mb: 1, color: "#4b5563" }}
                    >
                      Edited at{" "}
                      {anomaly.editedAt
                        ? new Date(anomaly.editedAt).toLocaleString()
                        : "-"}
                      {anomaly.editedBy ? ` • by ${anomaly.editedBy}` : ""}
                    </Typography>
                  </>
                )}

                <Typography
                  variant="body2"
                  sx={{ mb: 0.5 }}
                >
                  <strong>Fault:</strong> {anomaly.label}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Severity:</strong> {anomaly.severity}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Confidence:</strong>{" "}
                  {anomaly.confidence.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  <strong>Coordinates:</strong> x: {anomaly.bbox.x}, y:{" "}
                  {anomaly.bbox.y}
                </Typography>

                {anomaly.isDeleted && !anomaly.isUserAdded && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.5, color: "#c62828", fontWeight: 600 }}
                  >
                    This anomaly was deleted by user.
                  </Typography>
                )}

                {anomaly.edited &&
                  (reasonEditing[idx] ? (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ flex: 1 }}>
                        <TextField
                          label="Reason for edit"
                          variant="outlined"
                          fullWidth
                          size="small"
                          value={anomaly.editReason || ""}
                          onChange={(e) =>
                            handleEditReasonChange(idx, e.target.value)
                          }
                        />
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          handleEditReasonSave(idx);
                          setReasonEditing((prev) => ({
                            ...prev,
                            [idx]: false,
                          }));
                        }}
                      >
                        Save
                      </Button>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        mt: 1,
                        display: "flex",
                        gap: 1,
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{
                          flex: 1,
                          fontSize: 14,
                          color: "#111827",
                        }}
                      >
                        {anomaly.editReason && anomaly.editReason.trim() ? (
                          anomaly.editReason
                        ) : (
                          <span style={{ color: "#6b7280" }}>
                            (no reason provided)
                          </span>
                        )}
                      </Box>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() =>
                          setReasonEditing((prev) => ({
                            ...prev,
                            [idx]: true,
                          }))
                        }
                      >
                        Edit
                      </Button>
                    </Box>
                  ))}

                {anomaly.editReasonSavedAt && (
                  <Typography
                    variant="caption"
                    sx={{ mt: 0.5, display: "block", color: "#4b5563" }}
                  >
                    Reason saved at{" "}
                    {new Date(
                      anomaly.editReasonSavedAt
                    ).toLocaleString()}
                  </Typography>
                )}
              </Box>
            ))
        ) : (
          <Typography variant="body2" sx={{ color: "#666" }}>
            No errors found.
          </Typography>
        )}
      </Paper>

      {/* Comments Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, mb: 1.5 }}
        >
          Comments
        </Typography>

        {savedComment && !isEditing ? (
          <Box>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {savedComment}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={handleEditComment}>
                Edit
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleClearComment}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        ) : (
          <Box>
            <TextField
              label="Add a comment"
              variant="outlined"
              fullWidth
              size="small"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              sx={{ mb: 1 }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveComment}
                disabled={!comment.trim()}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={handleClearComment}
              >
                Clear
              </Button>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Sensitivity Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5 }}>
          Sensitivity
        </Typography>

        <Box
          sx={{
            mb: 1.5,
            p: 1.5,
            bgcolor: "#ffffff",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          }}
        >
          <Typography variant="body2" sx={{ mb: 2 }}>
            Sensitivity adjustment
          </Typography>

          {/* Center slider + semi-right label */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Centered Slider */}
            <input
              type="range"
              min={1}
              max={100}
              value={tempthreshold}
              onChange={(e) => setTempthreshold(Number(e.target.value))}
              style={{ width: 260 }}
            />

            {/* Move label further right */}
            <Typography
              variant="body2"
              sx={{
                position: "absolute",
                right: "15%",     // ← Move this to adjust how far right you want
              }}
            >
              Selected Sensitivity: {tempthreshold}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Feedback Log Section */}
      <Paper
        elevation={1}
        sx={{
          p: 3,
          mt: 3,
          borderRadius: 3,
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            Feedback Log
          </Typography>
          <Button
            variant="contained"
            size="small"
            onClick={handleExportFeedbackLog}
            disabled={
              !anomalyData?.anomalies || anomalyData.anomalies.length === 0
            }
            sx={{
              borderRadius: 999,
              textTransform: "none",
              boxShadow: "none",
            }}
          >
            Export to CSV
          </Button>
        </Box>

        <Box
          sx={{
            p: 1.5,
            bgcolor: "#ffffff",
            borderRadius: 2,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
            This log captures all model predictions and user edits for the
            current thermal image.
          </Typography>
          <Box sx={{ fontSize: 12, color: "#888" }}>
            <p>
              <strong>Thermal Image ID:</strong>{" "}
              {selectedthermalFile?.id || "N/A"}
            </p>
            <p>
              <strong>Total Anomalies:</strong>{" "}
              {anomalyData?.anomalies?.length || 0}
            </p>
            <p>
              <strong>Model Detected:</strong>{" "}
              {anomalyData?.anomalies?.filter((a) => !a.isUserAdded).length ||
                0}
            </p>
            <p>
              <strong>User Added:</strong>{" "}
              {anomalyData?.anomalies?.filter((a) => a.isUserAdded).length ||
                0}
            </p>
            <p>
              <strong>User Edited:</strong>{" "}
              {anomalyData?.anomalies?.filter((a) => a.edited).length || 0}
            </p>
            <p>
              <strong>Deleted:</strong>{" "}
              {anomalyData?.anomalies?.filter((a) => a.isDeleted).length || 0}
            </p>
          </Box>
        </Box>
      </Paper>

      {/* Zoom dialog (unchanged, just kept styling) */}
      <Dialog
        open={openZoom}
        onClose={handleCloseZoom}
        maxWidth="lg"
        PaperProps={{
          style: {
            backgroundColor: "black",
            position: "absolute",
            right: 0,
            top: "50%",
            transform: "translateY(-50%)",
            overflow: "hidden",
            padding: 0,
            margin: 0,
          },
        }}
      >
        <DialogContent
          style={{
            padding: 0,
            backgroundColor: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
          }}
        >
          <TransformWrapper
            centerOnInit
            minScale={0.5}
            limitToBounds={false}
            wheel={{ step: 0.2 }}
          >
            {(utils) => (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    zIndex: 2,
                  }}
                >
                  <button
                    style={{
                      backgroundColor: "#1976d2",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "18px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => utils.zoomIn()}
                  >
                    +
                  </button>
                  <button
                    style={{
                      backgroundColor: "#1976d2",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "18px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => utils.zoomOut()}
                  >
                    −
                  </button>
                  <button
                    style={{
                      backgroundColor: "#1976d2",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      fontSize: "16px",
                      width: "32px",
                      height: "32px",
                      cursor: "pointer",
                    }}
                    onClick={() => utils.resetTransform()}
                  >
                    ⟳
                  </button>
                </div>

                <TransformComponent>
                  <div
                    style={{
                      position: "relative",
                      display: "inline-block",
                    }}
                  >
                    <img
                      src={`http://localhost:8080${thermalImageUrl}`}
                      alt="Zoomed Thermal"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        borderRadius: "8px",
                      }}
                      ref={imgRef}
                      onLoad={updateDims}
                    />

                    {anomalyData?.status &&
                      anomalyData.anomalies
                        .filter((a) => !a.isDeleted)
                        .map((a, idx) => {
                          const currentA =
                            draggingState && draggingState.idx === idx
                              ? { ...a, bbox: draggingState.bbox }
                              : resizingState && resizingState.idx === idx
                              ? { ...a, bbox: resizingState.bbox }
                              : a;
                          const {
                            naturalWidth,
                            naturalHeight,
                            renderedWidth,
                            renderedHeight,
                          } = imgDims;
                          if (
                            !naturalWidth ||
                            !naturalHeight ||
                            !renderedWidth ||
                            !renderedHeight
                          )
                            return null;

                          const { x, y, width: bw, height: bh } =
                            currentA.bbox;
                          const sx = renderedWidth / naturalWidth;
                          const sy = renderedHeight / naturalHeight;

                          const left = x * sx;
                          const top = y * sy;
                          const w = bw * sx;
                          const h = bh * sy;

                          const isFaulty = (currentA.severity || "")
                            .toLowerCase()
                            .startsWith("faulty");
                          const color = isFaulty ? "red" : "gold";

                          return (
                            <React.Fragment key={idx}>
                              <div
                                style={{
                                  position: "absolute",
                                  left,
                                  top,
                                  width: w,
                                  height: h,
                                  border: `2px solid ${color}`,
                                  borderRadius: 4,
                                  pointerEvents: "none",
                                  boxSizing: "border-box",
                                }}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  left,
                                  top: Math.max(0, top - 20),
                                  background: color,
                                  color: isFaulty ? "#fff" : "#000",
                                  fontSize: 11,
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  pointerEvents: "none",
                                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                                }}
                              >
                                #{idx + 1} (
                                {(currentA.confidence ?? 0).toFixed(2)})
                              </div>
                            </React.Fragment>
                          );
                        })}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </DialogContent>

        <Box sx={{ textAlign: "center", py: 1.5, bgcolor: "#000" }}>
          <Button
            onClick={handleCloseZoom}
            variant="contained"
            color="error"
            size="small"
          >
            CLOSE
          </Button>
        </Box>
      </Dialog>

      {/* Maintenance Record Dialog */}
      <Dialog
        open={openMaintenanceDialog}
        onClose={handleCloseMaintenance}
        fullWidth
        maxWidth="sm"
      >
        <DialogContent dividers>
          <MaintenanceRecord
            initialData={maintenanceInitialData}
            onSave={handleSaveMaintenance}
            onCancel={handleCloseMaintenance}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default Transformer;
