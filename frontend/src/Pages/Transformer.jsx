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
const { useState } = React;
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { imagesAPI, annotationsAPI, maintenanceAPI } from '../services/api'; // Ensure this path is correct
import MaintenanceRecord from '../components/MaintenanceRecord.jsx';

function Transformer() {
    const location = useLocation();
    const state = location.state || {};
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
        const val = state.inspectedBy || localStorage.getItem('inspectedBy') || "H1210";
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

    // Save to localStorage when state changes
    React.useEffect(() => {
        localStorage.setItem('transformerNo', transformerNo);
    }, [transformerNo]);

    React.useEffect(() => {
        localStorage.setItem('poleNo', poleno);
    }, [poleno]);

    React.useEffect(() => {
        localStorage.setItem('region', branch);
    }, [branch]);

    React.useEffect(() => {
        localStorage.setItem('inspectedBy', inspectedBy);
    }, [inspectedBy]);

    React.useEffect(() => {
        localStorage.setItem('inspectionID', inspectionID);
    }, [inspectionID]);

    React.useEffect(() => {
        localStorage.setItem('inspectionDate', inspectionDate);
    }, [inspectionDate]);

    React.useEffect(() => {
        localStorage.setItem('transformerId', transformerId);
    }, [transformerId]);

    React.useEffect(() => {
        localStorage.setItem('inspectionNumber', inspectionNumber);
    }, [inspectionNumber]);
    const [thermalUploaded, setThermalUploaded] = React.useState(false);
    const [showComparison, setShowComparison] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [tempthreshold, setTempthreshold] = React.useState(50); // default value

    // Maintenance record dialog state
    const [openMaintenanceDialog, setOpenMaintenanceDialog] = React.useState(false);
    const [maintenanceMode, setMaintenanceMode] = React.useState('add'); // 'add' | 'edit'
    const [maintenanceInitialData, setMaintenanceInitialData] = React.useState(null);
    // store the last-saved maintenance record so Edit can pre-fill the form
    const [savedMaintenanceRecord, setSavedMaintenanceRecord] = React.useState(null);

  const [comment, setComment] = React.useState(""); // current input
    const [savedComment, setSavedComment] = React.useState(""); // stored comment
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
  const [draggingState, setDraggingState] = React.useState(null); // {idx, bbox}
  const [resizingState, setResizingState] = React.useState(null); // {idx, bbox}
  const [openZoom, setOpenZoom] = React.useState(false);
  const [reasonEditing, setReasonEditing] = React.useState({}); // per-anomaly edit toggle for reason

    const handleOpenZoom = () => setOpenZoom(true);
    const handleCloseZoom = () => setOpenZoom(false);


    //     // Call this when the model finishes and gives a response
    // const handleModelResponse = (response) => {
    //     // Replace old anomalies with the new response
    //     setAnomalyData({
    //     image: response.image || "",
    //     status: response.status || "",
    //     anomalies: response.anomalies || [],
    //     });
    // };
        // const testWithDummyResponse = () => {
        //     const dummyResponse = {
        //     image: "T1_faulty_022.jpg",
        //     status: "Anomalies",
        //     anomalies: [
        //         {
        //         label: "Point Overload (Faulty)",
        //         category: "point_overload",
        //         severity: "Faulty",
        //         confidence: 0.8776691854000092,
        //         bbox: { x: 281, y: 267, width: 90, height: 127 },
        //         },
        //         {
        //         label: "Point Overload (Potentially Faulty)",
        //         category: "point_overload",
        //         severity: "Potentially Faulty",
        //         confidence: 0.9155299961566925,
        //         bbox: { x: 437, y: 276, width: 139, height: 115 },
        //         },
        //     ],
        //     };

        //     setAnomalyData(dummyResponse);
        // };
        // const clearResponse = () => {
        // setAnomalyData({ image: "", status: "", anomalies: [] });
        // };

        // Whenever analysisResult changes, update anomalyData
    React.useEffect(() => {
    if (analysisResult) {
        setAnomalyData(prev => ({
          image: analysisResult.image || "",
          status: analysisResult.status || "",
          anomalies: (analysisResult.anomalies || []).map((a) => ({
            ...a,
            isUserAdded: a.isUserAdded ?? false,
            isDeleted: a.isDeleted ?? false,
          })),
        }));
    }
    }, [analysisResult]);

        // at top of Transformer() (with your other state)
    const imgRef = React.useRef(null);
    const [imgDims, setImgDims] = React.useState({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
    });

    // keep overlay in sync on load/resize
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

  // Global mouse up to handle drag release even outside the image
    React.useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (draggingState) {
        setAnomalyData(prev => ({
          ...prev,
          anomalies: prev.anomalies.map((a, i) => i === draggingState.idx ? markEdited({ ...a, bbox: draggingState.bbox }) : a)
        }));
                setDraggingState(null);
            }
            if (resizingState) {
        setAnomalyData(prev => ({
          ...prev,
          anomalies: prev.anomalies.map((a, i) => i === resizingState.idx ? markEdited({ ...a, bbox: resizingState.bbox }) : a)
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

  // Global mouse move to keep dragging/resizing responsive even when cursor leaves the image
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
        if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return { x: 0, y: 0, width: 0, height: 0 };
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
        if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return { x: 0, y: 0, width: 0, height: 0 };
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

  const currentUserId = inspectedBy || "UNKNOWN";

  const handleSaveAnnotations = async () => {
    if (!selectedthermalFile || !selectedthermalFile.id) return;
    const annotationsJson = JSON.stringify(anomalyData);
    try {
      await annotationsAPI.save(selectedthermalFile.id, currentUserId, annotationsJson);
      alert("Annotations saved successfully!");
      // Exit edit mode and clear any selected/adding state so the UI returns to view mode
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
      // If the edit is a box/user-change, set confidence to 1
      ...(setConfidenceToOne ? { confidence: 1 } : {}),
      // preserve explicit flags if missing
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
            bbox: convertRenderedToNatural(x, y, 50, 50), // default size
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
    // Soft-delete: keep it in list but mark deleted and edited
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a,i)=> i===idx ? { ...markEdited(a, { setConfidenceToOne: false }), isDeleted:true } : a)
    }));
  };

  const handleSeverityChange = (idx) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) => i === idx ? markEdited({
        ...a,
        severity: a.severity === "Faulty" ? "Potentially Faulty" : a.severity === "Potentially Faulty" ? "Normal" : "Faulty"
      }) : a),
    }));
  };

  const handleLabelChange = (idx, newLabel) => {
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a, i) => i === idx ? markEdited({ ...a, label: newLabel }) : a),
    }));
  };

  const handleEditReasonChange = (idx, reason) => {
    // Do not alter editedAt/edited flag when changing reason text
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a,i)=> i===idx ? { ...a, editReason: reason } : a)
    }));
  };

  const handleEditReasonSave = (idx) => {
    // Save reason timestamp without changing the main editedAt (box edit time)
    setAnomalyData(prev => ({
      ...prev,
      anomalies: prev.anomalies.map((a,i)=> i===idx ? { ...a, editReasonSavedAt: new Date().toISOString() } : a)
    }));
  };

    // Export feedback log to CSV
  const handleExportFeedbackLog = () => {
    if (!anomalyData || !anomalyData.anomalies || anomalyData.anomalies.length === 0) {
      alert('No anomalies to export');
      return;
    }

    // CSV Headers
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

    // Build CSV rows
    const rows = anomalyData.anomalies.map((anomaly, idx) => {
      const imageId = selectedthermalFile?.id || anomalyData.thermalImageId || 'N/A';
      const isUserAdded = anomaly.isUserAdded || false;
      const isEdited = anomaly.edited || false;
      const isDeleted = anomaly.isDeleted || false;
      const isFinalAccepted = !isDeleted; // Final accepted = not deleted
      
      // For model-predicted columns: if user-added, show 'N/A', otherwise show current values
      const modelLabel = isUserAdded ? 'N/A' : (anomaly.label || 'Unknown');
      const modelSeverity = isUserAdded ? 'N/A' : (anomaly.severity || 'Unknown');
      const modelConfidence = isUserAdded ? 'N/A' : (anomaly.confidence ?? 0);
      const modelBboxX = isUserAdded ? 'N/A' : (anomaly.bbox?.x ?? 0);
      const modelBboxY = isUserAdded ? 'N/A' : (anomaly.bbox?.y ?? 0);
      const modelBboxWidth = isUserAdded ? 'N/A' : (anomaly.bbox?.width ?? 0);
      const modelBboxHeight = isUserAdded ? 'N/A' : (anomaly.bbox?.height ?? 0);

      // Current values (after any user edits)
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
        idx + 1, // 1-based anomaly index
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

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
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
        return !(bbox1.x + bbox1.width <= bbox2.x ||
                 bbox2.x + bbox2.width <= bbox1.x ||
                 bbox1.y + bbox1.height <= bbox2.y ||
                 bbox2.y + bbox2.height <= bbox1.y);
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
        anomalies: prev.anomalies.map((a, i) => i === draggingState.idx ? markEdited({ ...a, bbox: draggingState.bbox }) : a)
      }));
            setDraggingState(null);
        }
        if (resizingState) {
      setAnomalyData(prev => ({
        ...prev,
        anomalies: prev.anomalies.map((a, i) => i === resizingState.idx ? markEdited({ ...a, bbox: resizingState.bbox }) : a)
      }));
            setResizingState(null);
        }
        setIsDragging(false);
        setDraggedAnomaly(null);
        setIsResizing(false);
        setResizedAnomaly(null);
        setResizeHandle(null);
    };

    // uploader is always the inspector
    const uploader = inspectedBy;

    const handleChange = (event) => {
        setweather(event.target.value);
    };

    // --- NEW: Fetch existing images on component mount ---
    React.useEffect(() => {
        const fetchImages = async () => {
            if (!transformerId || !inspectionID) return;

            setLoading(true);
            try {
                // Fetch baseline image
                const baselineResponse = await imagesAPI.getBaseline(transformerId);
                if (baselineResponse.data) {
                    const baselineImg = baselineResponse.data;
                    setSelectedbaselineFile({
                        file: null, // No actual file object needed, just metadata
                        tag: "BASELINE",
                        weather: baselineImg.weatherCondition,
                        url: baselineImg.url,
                    });
                    setBaselineImageUrl(baselineImg.url);
                    setBaselineUpdatedAt(new Date(baselineImg.uploadedAt));
                    setweather(baselineImg.weatherCondition); // Set weather from existing baseline
                }

                // Fetch maintenance images for the current inspection
                const maintenanceResponse = await imagesAPI.getMaintenanceByInspection(transformerId, inspectionID);
                if (maintenanceResponse.data && maintenanceResponse.data.length > 0) {
                    const thermalImg = maintenanceResponse.data[0]; // Assuming one maintenance image per inspection for simplicity
                    setSelectedthermalFile({
                        id: thermalImg.id,
                        tag: "MAINTENANCE",
                        url: thermalImg.url,
                    });
                    setThermalImageUrl(thermalImg.url);
                    // First, set from analysis if available
                    if (thermalImg.analysis) {
                        try {
                        const parsed = JSON.parse(thermalImg.analysis);
                        setAnalysisResult(parsed);
                        console.log("Fetched and parsed saved analysis:", parsed);
                        } catch (err) {
                        console.error("Error parsing saved analysis JSON:", err);
                        }
                    }
                    // Then, fetch and override with user annotations if available
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
                    // Fetch maintenance records for this transformer+inspection and populate UI state
                    try {
                      const mrResp = await maintenanceAPI.getByTransformerAndInspection(transformerId, inspectionID);
                      if (mrResp.data && Array.isArray(mrResp.data) && mrResp.data.length > 0) {
                        // take the most recent record (last)
                        const rec = mrResp.data[mrResp.data.length - 1];
                        try {
                          const parsed = typeof rec.recordJson === 'string' ? JSON.parse(rec.recordJson) : rec.recordJson;
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
    }, [transformerId, inspectionID]); // Re-run when transformerId or inspectionID changes

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
                file: null, // No actual file object needed after upload
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

    // Handle file selection for thermal (maintenance)
    const handlethermalFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setLoading(true);
        setAnalysisResult(null); // clear old result
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("imageType", "MAINTENANCE");
            // Weather condition is optional for maintenance, but can be sent if available
            if (weather) {
                formData.append("weatherCondition", weather.toUpperCase());
            }
            formData.append("uploader", uploader);
            formData.append("inspectionId", inspectionID);

            const response = await imagesAPI.upload(transformerId, formData);
            const uploadedImg = response.data;

            setSelectedthermalFile({
                id: uploadedImg.id,          // ✅ use uploadedImg from backend response
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
            value += 100 / (3000 / 30); // fill in 3s
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
     // Function to delete the baseline image
    const handleDeleteBaseline = async () => {
        if (!transformerId) return;
        setLoading(true);
        try {
            await imagesAPI.deleteBaseline(transformerId); // Call the delete API
            setSelectedbaselineFile(null); // Clear the state
            setBaselineImageUrl(null); // Clear the URL
            setBaselineUpdatedAt(null); // Clear the updated date
            setweather(""); // Reset weather if baseline is deleted
            console.log("Baseline image deleted successfully");
        } catch (error) {
            console.error("Error deleting baseline image:", error);
            alert(`Failed to delete baseline image: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
          // Open Add / Edit Maintenance (Inspection) dialog
          const handleOpenAddInspection = () => {
            setMaintenanceMode('add');
            setMaintenanceInitialData(null);
            setOpenMaintenanceDialog(true);
          };

          const handleOpenEditInspection = () => {
            // Prefill with current inspection info if available
            if (!inspectionID) {
              // nothing to edit
              return;
            }
            setMaintenanceMode('edit');
            setMaintenanceInitialData({
              inspectionID,
              inspectionDate,
              inspectionNumber,
              transformerNo,
              poleno,
              branch,
              transformerId,
              // include previously saved maintenance values (inspector, readings, remarks etc.)
              ...(savedMaintenanceRecord || {}),
            });
            setOpenMaintenanceDialog(true);
          };

          const handleCloseMaintenance = () => {
            setOpenMaintenanceDialog(false);
            setMaintenanceInitialData(null);
          };

          const handleSaveMaintenance = async (data) => {
            // Persist locally for immediate UI feedback
            setSavedMaintenanceRecord(data ? { ...(data || {}) } : null);

            setOpenMaintenanceDialog(false);
            setMaintenanceInitialData(null);

            // If we have the necessary IDs, try to persist to backend
            if (!inspectionID || !transformerId) {
              console.warn('Missing inspectionID or transformerId; saved locally only');
              try {
                localStorage.setItem(`maintenance_draft_${inspectionID || 'unknown'}`, JSON.stringify(data || {}));
              } catch (err) {
                console.warn('Could not write maintenance draft to localStorage', err);
              }
              return;
            }

            try {
              const payload = data || {};
              const resp = await maintenanceAPI.saveForInspection(inspectionID, transformerId, inspectedBy, payload);
              console.log('Saved maintenance record to server:', resp.data);
              if (resp.data) {
                // Backend returns a minimal map with recordJson as string; parse it so the UI can consume nested shape
                let parsedRecord = null;
                try {
                  parsedRecord = typeof resp.data.recordJson === 'string' ? JSON.parse(resp.data.recordJson) : resp.data.recordJson;
                } catch (e) {
                  console.warn('Could not parse recordJson from server response', e);
                }
                // prefer the parsed nested object, but keep fallback to resp.data
                setSavedMaintenanceRecord(parsedRecord || resp.data);
              }
              try { localStorage.removeItem(`maintenance_draft_${inspectionID}`); } catch (e) {}
            } catch (err) {
              console.error('Failed to save maintenance record to server:', err);
              alert('Failed to save maintenance record to server; saved locally.');
              try {
                localStorage.setItem(`maintenance_draft_${inspectionID}`, JSON.stringify(data || {}));
              } catch (e) {
                console.warn('Could not persist maintenance draft locally', e);
              }
            }
          };
    return (
        <div style={{ padding: "20px", background: "#f9fafb", minHeight: "100vh" }}>
            {/* Heading */}
            <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" , color: "#000000ff",textAlign: "left"}}>
                Transformer
            </h2>

            {/* Inspection card */}
            <div
                style={{
                    background: "white",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "20px",
                }}
            >
                <div>
                    <p style={{ fontSize: "18px", fontWeight: "600", color: "#000000ff"  }}>{inspectionNumber}</p>
                    <p style={{ fontSize: "14px", color: "#000000ff" }}>
                        {inspectionDate}
                    </p>
                </div>
                <div>
                    <p style={{ fontSize: "12px", color: "#070708ff" }}>
                    {baselineUpdatedAt
                        ? `Last updated: ${baselineUpdatedAt.toLocaleString()}`
                        : "Select Weather to Upload Baseline "}
                    </p>
                    {/* Weather selection for baseline */}
                    {!selectedbaselineFile && ( // Only show weather dropdown if no baseline is selected/uploaded
                        <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                            <InputLabel id="weather-select-label">Weather</InputLabel>
                            <Select
                                labelId="weather-select-label"
                                id="weather-select"
                                value={weather}
                                label="Weather"
                                onChange={handleChange}
                                disabled={!!selectedbaselineFile} // Disable if baseline already exists
                            >
                                <MenuItem value="SUNNY">Sunny</MenuItem>
                                <MenuItem value="CLOUDY">Cloudy</MenuItem>
                                <MenuItem value="RAINY">Rain</MenuItem>
                            </Select>
                        </FormControl>
                    )}

                    {/* Hidden file input for baseline */}
                    <input
                        accept="image/*"
                        id="uploadbaseline-button-file"
                        type="file"
                        style={{ display: "none" }}
                        onChange={handlebaselineFileChange}
                        disabled={!weather || !!selectedbaselineFile || loading} // Disable if no weather, baseline exists, or loading
                    />

                    {/* Upload button for baseline */}
                    <label htmlFor="uploadbaseline-button-file">
                        <Button
                            variant="contained"
                            size="small"
                            component="span"
                            disabled={!weather || !!selectedbaselineFile || loading}
                        >
                            Baseline Image
                        </Button>
                    </label>

                    {/* <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <Button variant="contained" size="small" onClick={handleOpenAddInspection} startIcon={<AddIcon />}>Add Maintenance Record</Button>
                        <Button variant="outlined" size="small" onClick={handleOpenEditInspection} disabled={!inspectionID} startIcon={<EditIcon />}>Edit</Button>
                    </div> */}

                    {/* Show preview + delete button if baseline is selected/uploaded */}
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
                                src={`http://localhost:8080${baselineImageUrl}`} // Use the URL from the backend
                                alt="Baseline"
                                style={{ width: "100px", borderRadius: "8px" }}
                            />
                              <IconButton
                                aria-label="delete"
                                color="error"
                                onClick={handleDeleteBaseline} // Call delete function
                            >
                                <DeleteIcon />
                            </IconButton>
                            {/* Optionally add a delete button for baseline if you implement delete functionality */}
                            {/* <IconButton
                                aria-label="delete"
                                color="error"
                                onClick={() => {
                                    setSelectedbaselineFile(null);
                                    setBaselineImageUrl(null);
                                    setBaselineUpdatedAt(null);
                                    setweather(""); // Reset weather if baseline is deleted
                                }}
                            >
                                <DeleteIcon />
                            </IconButton> */}

                        </div>
                    )}
                </div>
            </div>
            {/* Buttons aligned to the right */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 2,
                width: "100%",
                marginBottom: 2,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                {/* <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddInspection}
                  disabled={Boolean(savedMaintenanceRecord)}
                >
                  Add Maintenance Record
                </Button> */}
                
              </div>

              <Button
                variant="contained"
                color="secondary"
                startIcon={<EditIcon />}
                onClick={handleOpenEditInspection}
                disabled={!inspectionID}
              >
                ADD/Edit Maintenance Record
              </Button>
              
            </Box>
             {/* 🔽 text now appears below the box */}
<p style={{ marginTop: 0, fontSize: 12, color: "#6b7280", textAlign: "right" }}>
  Accessible for authorised users only
</p>
            {/* Transformer details */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                <div
                    style={{
                        padding: "8px 16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <p style={{ fontSize: "12px", color: "#040404ff" }}>Transformer No</p>
                    <p style={{ fontWeight: "600" , color: "#0a0a0aff"}}>{transformerNo}</p>
                </div>

                <div
                    style={{
                        padding: "8px 16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        boxShadow: "0 1px 4px rgba(16, 15, 15, 0.1)",
                    }}
                >
                    <p style={{ fontSize: "12px", color: "#0b0b0cff" }}>Pole No</p>
                    <p style={{ fontWeight: "600", color: "#0b0b0cff" }}>{poleno}</p>
                </div>

                <div
                    style={{
                        padding: "8px 16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <p style={{ fontSize: "12px", color: "#060707ff" }}>Branch</p>
                    <p style={{ fontWeight: "600" , color: "#060707ff"}}>{branch}</p>
                </div>

                <div
                    style={{
                        padding: "8px 16px",
                        background: "#f3f4f6",
                        borderRadius: "8px",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    }}
                >
                    <p style={{ fontSize: "12px", color: "#080808ff" }}>Inspected By</p>
                    <p style={{ fontWeight: "600" , color: "#080808ff"}}>{inspectedBy}</p>
                </div>
            </div>
            <div
                style={{
                    padding: "8px 16px",
                    background: "#f3f4f6",
                    borderRadius: "8px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
                    marginTop: "20px", // Added margin for separation
                }}
            >
                <p style={{ fontSize: "16px", color: "#080808ff" }}>Thermal Image</p>

                {/* Show weather + upload only if no thermal file selected */}
                {!selectedthermalFile && !loading && (
                    <>
                        {/* Weather selection for thermal image (optional, can be removed if not needed for maintenance) */}
                        <p
                            style={{
                                fontSize: "11px",
                                fontWeight: "400",
                                color: "#080808ff",
                                marginBottom: "8px",
                            }}
                        >
                            Select Thermal Image
                        </p>
                        
                        {/* <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                            <InputLabel id="weather-select-label">Weather</InputLabel>
                            <Select
                                labelId="weather-select-label"
                                id="weather-select"
                                value={weather}
                                label="Weather"
                                onChange={handleChange}
                            >
                                <MenuItem value="SUNNY">Sunny</MenuItem>
                                <MenuItem value="CLOUDY">Cloudy</MenuItem>
                                <MenuItem value="RAINY">Rain</MenuItem>
                            </Select>
                        </FormControl> */}

                        {/* Upload button for thermal */}
                        <input
                            accept="image/*"
                            id="uploadthermal-button-file"
                            type="file"
                            style={{ display: "none" }}
                            onChange={handlethermalFileChange}
                            disabled={!selectedbaselineFile || loading} // Thermal requires baseline to be present
                        />
                        <label htmlFor="uploadthermal-button-file">
                            <Button variant="contained" size="small" component="span" disabled={!selectedbaselineFile || loading}>
                                Thermal Image
                            </Button>
                        </label>
                    </>
                )}

                {/* Loading state */}
                {loading && (
                    <p style={{ fontSize: "14px", fontWeight: "600", color: "orange" }}>
                        Uploading Image...
                    </p>
                )}
                {/* Show only processing bar while anomalyData.status is empty */}
                        {selectedthermalFile && !anomalyData.status && (
                            <Box sx={{ width: '100%', mt: 2 }}>
                            <p style={{ fontSize: "14px", fontWeight: "600", color: "orange" }}>
                                Processing Thermal Image...
                            </p>
                            <Box sx={{ width: '100%', height: 10, backgroundColor: '#e0e0e0', borderRadius: 5, overflow: 'hidden' }}>
                                <Box
                                sx={{
                                    height: '100%',
                                    width: `${progress}%`,
                                    backgroundColor: '#3f51b5',
                                    transition: 'width 0.2s',
                                }}
                                />
                            </Box>
                            </Box>
                        )}

                        {/* Show baseline + thermal images side by side */}
            {!loading && baselineImageUrl && thermalImageUrl && (
            <div
                style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 24,
                alignItems: "start",
                marginTop: 20,
                }}
            >
                {/* Left: Baseline (no overlay) */}
                <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Baseline</p>
                <img
                    src={`http://localhost:8080${baselineImageUrl}`}
                    alt="Baseline"
                    style={{
                    width: "100%",
                    maxWidth: 700,   // keep both sides visually similar
                    height: "auto",
                    borderRadius: 12,
                    display: "block",
                    margin: "0 auto",
                    }}
                />
                </div>

                {/* Right: Maintenance (with overlay) */}
                <div style={{ textAlign: "center", position: "relative", display: "inline-block" }}>
                <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Maintenance</p>

                {/* Responsive image; ref + onLoad to capture dims */}
                <img
                  ref={mainImgRef}
                  src={`http://localhost:8080${thermalImageUrl}`}
                  alt="Thermal"
                  style={{ width: "100%", maxWidth: 700, height: "auto", borderRadius: 12, cursor: isAdding ? "crosshair" : isDragging ? "grabbing" : "default", userSelect: "none" }}
                  onLoad={updateMainDims}
                  onClick={handleImageClick}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  draggable={false}
                />


                {/* Overlay (scaled) */}
                {anomalyData?.status && anomalyData.anomalies.filter(a=>!a.isDeleted).map((a, idx) => {
                    const currentA = (draggingState && draggingState.idx === idx) ? { ...a, bbox: draggingState.bbox } :
                                     (resizingState && resizingState.idx === idx) ? { ...a, bbox: resizingState.bbox } : a;
                    const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = mainImgDims;
                    if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return null;

                    const { x, y, width: bw, height: bh } = currentA.bbox;

                    // scale factors from original → rendered
                    const sx = renderedWidth / naturalWidth;
                    const sy = renderedHeight / naturalHeight;

                    const offsetX = 0; // move 10px to the right
                    const offsetY = 43; // move 5px up

                    const left = x * sx + offsetX;
                    const top = y * sy + offsetY;
                    const w = bw * sx;
                    const h = bh * sy;

                    const isFaulty = (currentA.severity || "").toLowerCase().startsWith("faulty");
                    const color = isFaulty ? "red" : "gold";
                    const isSelected = selectedAnomaly === idx;

                    return (
                    <React.Fragment key={idx}>
                        {/* box */}
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
                            backgroundColor: isSelected ? "rgba(0,0,0,0.1)" : "transparent",
                        }}
                        onClick={() => isEditMode && setSelectedAnomaly(isSelected ? null : idx)}
                        onMouseDown={(e) => {
                            if (!isEditMode) return;
                            e.stopPropagation();
                            setIsDragging(true);
                            setDraggedAnomaly(idx);
                            setDragStart({ x: e.clientX, y: e.clientY });
                        }}
            onMouseMove={(e) => {
              if (!isEditMode) return;
              if (isDragging && draggedAnomaly === idx) handleMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
                        />

                        {/* Resize handle */}
                        {isEditMode && (
              <div
                            style={{
                                position: "absolute",
                                left: left + w - 10,
                                top: top + h - 10,
                                width: 20,
                                height: 20,
                                background: isSelected ? "rgba(0,0,255,0.8)" : "rgba(0,0,255,0.5)",
                                cursor: "se-resize",
                                borderRadius: 2,
                                border: "1px solid blue",
                            }}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setSelectedAnomaly(idx);
                                setIsResizing(true);
                                setResizedAnomaly(idx);
                                setResizeHandle('se');
                                setDragStart({ x: e.clientX, y: e.clientY });
                            }}
              onMouseMove={(e) => {
                if (!isEditMode) return;
                if (isResizing && resizedAnomaly === idx) handleMouseMove(e);
              }}
              onMouseUp={handleMouseUp}
                            />
                        )}

                        {/* badge (index + confidence) */}
                        <div
                        style={{
                            position: "absolute",
                            left,
                            top: Math.max(0, top - 20), // don't go above the image container
                            background: color,
                            color: isFaulty ? "#fff" : "#000",
                            fontSize: 11,
                            padding: "2px 6px",
                            borderRadius: 4,
                            fontWeight: 700,
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            cursor: isEditMode ? "pointer" : "default",
                        }}
                        onClick={() => isEditMode && setSelectedAnomaly(isSelected ? null : idx)}
                        >
                        #{idx + 1} ({(currentA.confidence ?? 0).toFixed(2)})
                        </div>

                        {/* Edit controls for selected anomaly */}
                        {isEditMode && isSelected && (
                        <>
                            {/* Severity toggle */}
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

                            {/* Label input - match background color with anomaly box */}
                            <TextField
                                label="Label"
                                value={currentA.label}
                                onChange={(e) => handleLabelChange(idx, e.target.value)}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  left: left + w + 5,
                                  top: top + 20,
                                  // Background of the input matches the box color
                                  '& .MuiInputBase-root': {
                                    backgroundColor: color,
                                  },
                                  // Input text color for readability
                                  '& .MuiInputBase-input': {
                                    color: isFaulty ? '#fff' : '#000',
                                  },
                                  // Label colors (normal + focused)
                                  '& .MuiInputLabel-root': {
                                    color: isFaulty ? '#fff' : '#000',
                                  },
                                  '& .MuiInputLabel-root.Mui-focused': {
                                    color: isFaulty ? '#fff' : '#000',
                                  },
                                  // Outline colors (default/hover/focused)
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: color,
                                  },
                                  '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: color,
                                  },
                                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: color,
                                  },
                                }}
                            />

                            {/* Delete button */}
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

                {/* Action buttons */}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 10 }}>
                    <IconButton
                    aria-label="edit"
                    color={isEditMode ? "secondary" : "default"}
                    onClick={handleEditToggle}
                    >
                    <EditIcon />
                    </IconButton>

                    {isEditMode && (
                    <IconButton
                        aria-label="add"
                        color={isAdding ? "secondary" : "default"}
                        onClick={handleAddToggle}
                        >
                        <AddIcon />
                        </IconButton>
                    )}

                    <IconButton
                    aria-label="save"
                    color="primary"
                    onClick={handleSaveAnnotations}
                    disabled={!selectedthermalFile || !anomalyData.anomalies || anomalyData.anomalies.length === 0}
                    >
                    <SaveIcon />
                    </IconButton>

                    <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={async () => {
                        if (!selectedthermalFile || !transformerId) return;
                        try {
                        const imgId = selectedthermalFile.id || selectedthermalFile.imageId;
                        if (imgId) await imagesAPI.deleteImage(transformerId, imgId);
                        setSelectedthermalFile(null);
                        setThermalImageUrl(null);
                        setAnomalyData({ image: "", status: "", anomalies: [] });
                        console.log("Thermal image deleted", transformerId, "ID", imgId);
                        } catch (error) {
                        console.error("Delete error:", error);
                        alert("Failed to delete image");
                        }
                    }}
                    >
                    <DeleteIcon />
                    </IconButton>

                    <IconButton aria-label="zoom" color="primary" onClick={handleOpenZoom}>
                    <ZoomInIcon />
                    </IconButton>
                </div>
                </div>
            </div>
            )}

            </div> 
{/* === Errors Section === */}
<div
  style={{
    padding: "16px",
    background: "#f3f4f6",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    marginTop: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
    Errors
  </h3>

  {anomalyData?.anomalies && anomalyData.anomalies.length > 0 ? (
    anomalyData.anomalies
      // Hide rows for user-added anomalies that the user deleted
      .filter(a => !(a.isUserAdded && a.isDeleted))
      .map((anomaly, idx) => (
      <div
        key={idx}
        style={{
          marginBottom: "12px",
          padding: "12px",
          background: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Edited banner and meta */}
        {anomaly.edited && (
          <>
            <div style={{
              marginBottom: 6,
              padding: "6px 8px",
              borderRadius: 6,
              background: "#fff7e6",
              border: "1px solid #f0ad4e",
              color: "#8a6d3b",
              fontSize: 12,
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center'
            }}>
              <span><strong>User Edited Anomoly</strong></span>
            </div>
            <p style={{ marginTop: 0, marginBottom: 8, fontSize: 12, color: '#4b5563' }}>
              Edited at {anomaly.editedAt ? new Date(anomaly.editedAt).toLocaleString() : '-'}
              {anomaly.editedBy ? ` • by ${anomaly.editedBy}` : ''}
            </p>
          </>
        )}

        <p style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Fault:</strong> {anomaly.label}
        </p>
        
        <p style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Severity:</strong> {anomaly.severity}
        </p>
        <p style={{ fontSize: "14px", marginBottom: "4px" }}>
          <strong>Confidence:</strong> {anomaly.confidence.toFixed(2)}
        </p>
        <p style={{ fontSize: "14px" }}>
          <strong>Coordinates:</strong> x: {anomaly.bbox.x}, y: {anomaly.bbox.y}
        </p>

        {/* Deleted notice: only show if it was model-detected (not user-added) */}
        {anomaly.isDeleted && !anomaly.isUserAdded && (
          <p style={{ fontSize: 12, color: '#c62828', fontWeight: 600 }}>
            This anomaly was deleted by user.
          </p>
        )}

        {/* Edit reason UI (only for edited anomalies) */}
        {anomaly.edited && (
          reasonEditing[idx] ? (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <TextField
                  label="Reason for edit"
                  variant="outlined"
                  fullWidth
                  size="small"
                  value={anomaly.editReason || ''}
                  onChange={(e)=>handleEditReasonChange(idx, e.target.value)}
                />
              </div>
              <Button
                variant="contained"
                size="small"
                onClick={()=>{ handleEditReasonSave(idx); setReasonEditing(prev=>({ ...prev, [idx]: false })); }}
              >
                Save
              </Button>
            </div>
          ) : (
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, fontSize: 14, color: '#111827' }}>
                {anomaly.editReason && anomaly.editReason.trim() ? (
                  anomaly.editReason
                ) : (
                  <span style={{ color: '#6b7280' }}>(no reason provided)</span>
                )}
              </div>
              <Button
                variant="outlined"
                size="small"
                onClick={()=> setReasonEditing(prev=>({ ...prev, [idx]: true }))}
              >
                Edit
              </Button>
            </div>
          )
        )}
        {anomaly.editReasonSavedAt && (
          <p style={{ marginTop: 6, fontSize: 12, color: '#4b5563' }}>
            Reason saved at {new Date(anomaly.editReasonSavedAt).toLocaleString()}
          </p>
        )}
      </div>
    ))
  ) : (
    <p style={{ fontSize: "14px", color: "#666" }}>No errors found.</p>
  )}

  <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
    {/* <button onClick={testWithDummyResponse}>Load Dummy Errors</button>
    <button onClick={clearResponse}>Clear</button> */}
  </div>
</div>


 {/* === Comments Section === */}
<div
  style={{
    padding: "16px",
    background: "#f3f4f6",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    marginTop: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
    Comments
  </h3>

  {savedComment && !isEditing ? (
    <div>
      <p style={{ fontSize: "14px", marginBottom: "8px" }}>{savedComment}</p>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" size="small" onClick={handleEditComment}>
          Edit
        </Button>
        <Button variant="outlined" size="small" color="error" onClick={handleClearComment}>
          Clear
        </Button>
      </Stack>
    </div>
  ) : (
    <div>
      <TextField
        label="Add a comment"
        variant="outlined"
        fullWidth
        size="small"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        sx={{ marginBottom: "8px" }}
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
        <Button variant="outlined" size="small" color="error" onClick={handleClearComment}>
          Clear
        </Button>
      </Stack>
    </div>
  )}
</div>
{/* === Rules Section === */}
<div
  style={{
    padding: "16px",
    background: "#f3f4f6",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    marginTop: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "12px" }}>
    Sensitivity
  </h3>

  {/* Example rule item */}
  <div
  style={{
    marginBottom: "12px",
    padding: "12px",
    background: "white",
    borderRadius: "8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  }}
>
  <p style={{ fontSize: "14px", marginBottom: "4px" }}>
    <strong></strong>Sensitivity adjustment
  </p>

  {/* Slider for threshold selection */}
<input
  type="range"
  min={1}
  max={100}
  value={tempthreshold}
  onChange={(e) => setTempthreshold(Number(e.target.value))}
  style={{
    width: "200px",
    padding: "4px 0",
    margin: "8px 0",
  }}
/>
<p>Selected Sensitivity: {tempthreshold}</p>
</div>
</div>
{/* === Feedback Log Section === */}
<div
  style={{
    padding: "16px",
    background: "#f3f4f6",
    borderRadius: "12px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    marginTop: "20px",
  }}
>
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
    <h3 style={{ fontSize: "16px", fontWeight: "600", margin: 0 }}>
      Feedback Log
    </h3>
    <Button
      variant="contained"
      size="small"
      onClick={handleExportFeedbackLog}
      disabled={!anomalyData?.anomalies || anomalyData.anomalies.length === 0}
    >
      Export to CSV
    </Button>
  </div>

  <div
    style={{
      padding: "12px",
      background: "white",
      borderRadius: "8px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    }}
  >
    <p style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
      This log captures all model predictions and user edits for the current thermal image.
    </p>
    <div style={{ fontSize: "12px", color: "#888" }}>
      <p><strong>Thermal Image ID:</strong> {selectedthermalFile?.id || 'N/A'}</p>
      <p><strong>Total Anomalies:</strong> {anomalyData?.anomalies?.length || 0}</p>
      <p><strong>Model Detected:</strong> {anomalyData?.anomalies?.filter(a => !a.isUserAdded).length || 0}</p>
      <p><strong>User Added:</strong> {anomalyData?.anomalies?.filter(a => a.isUserAdded).length || 0}</p>
      <p><strong>User Edited:</strong> {anomalyData?.anomalies?.filter(a => a.edited).length || 0}</p>
      <p><strong>Deleted:</strong> {anomalyData?.anomalies?.filter(a => a.isDeleted).length || 0}</p>
    </div>
  </div>
</div>

<Dialog
  open={openZoom}
  onClose={handleCloseZoom}
  maxWidth="lg"
  PaperProps={{
    style: {
      backgroundColor: "black",
      position: "absolute",      // make it absolute
      right: 0,                   // align to the left
      top: "50%",                // vertical center
      transform: "translateY(-50%)", // center vertically
      overflow: "hidden",
      padding: 0,
      margin: 0,                 // remove default margin
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
          {/* Zoom Controls */}
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

          {/* Zoomable Image + overlay */}
          <TransformComponent>
            <div style={{ position: "relative", display: "inline-block" }}>
              <img
                src={`http://localhost:8080${thermalImageUrl}`}
                alt="Zoomed Thermal"
                style={{
                  display: "block",
                  width: "100%",
                  height: "auto",
                  borderRadius: "8px",
                }}
                ref={imgRef} // optional, if you want dims
                onLoad={updateDims} // optional, if you want to recalc overlay
              />

              {/* Overlay inside the zoom */}
              {anomalyData?.status && anomalyData.anomalies.filter(a=>!a.isDeleted).map((a, idx) => {
                const currentA = (draggingState && draggingState.idx === idx) ? { ...a, bbox: draggingState.bbox } :
                                 (resizingState && resizingState.idx === idx) ? { ...a, bbox: resizingState.bbox } : a;
                const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = imgDims;
                if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return null;

                const { x, y, width: bw, height: bh } = currentA.bbox;
                const sx = renderedWidth / naturalWidth;
                const sy = renderedHeight / naturalHeight;
                
                const left = x * sx;
                const top = y * sy;
                const w = bw * sx;
                const h = bh * sy;

                const isFaulty = (currentA.severity || "").toLowerCase().startsWith("faulty");
                const color = isFaulty ? "red" : "gold";

                return (
                  <React.Fragment key={idx}>
                    {/* Bounding box */}
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

                    {/* Badge */}
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
                      #{idx + 1} ({(currentA.confidence ?? 0).toFixed(2)})
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

  {/* Close Button */}
  <div style={{ textAlign: "center", padding: "10px" }}>
    <Button
      onClick={handleCloseZoom}
      variant="contained"
      color="error"
      size="small"
    >
      CLOSE
    </Button>
  </div>
</Dialog>

{/* Maintenance Record Dialog (Add / Edit) */}
<Dialog open={openMaintenanceDialog} onClose={handleCloseMaintenance} fullWidth maxWidth="sm">
  <DialogContent dividers>
    <MaintenanceRecord initialData={maintenanceInitialData} onSave={handleSaveMaintenance} onCancel={handleCloseMaintenance} />
  </DialogContent>
</Dialog>




  
        </div>
    );
}

export default Transformer;

