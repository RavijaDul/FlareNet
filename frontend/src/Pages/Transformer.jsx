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
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { imagesAPI } from '../services/api'; // Ensure this path is correct

function Transformer() {
    const location = useLocation();
    const state = location.state || {};
    const [selectedbaselineFile, setSelectedbaselineFile] = React.useState(null);
    const [selectedthermalFile, setSelectedthermalFile] = React.useState(null);
    const [weather, setweather] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [baselineUpdatedAt, setBaselineUpdatedAt] = React.useState(null);
    const [baselineImageUrl, setBaselineImageUrl] = React.useState(null); // New state for baseline image URL
    const [thermalImageUrl, setThermalImageUrl] = React.useState(null); // New state for thermal image URL

    // Initialize state only from passed data
    const [transformerNo, setTransformerNo] = React.useState(state.transformerNo || "");
    const [poleno, setPoleno] = React.useState(state.poleNo || "");
    const [branch, setBranch] = React.useState(state.region || "");
    const [inspectedBy, setInspectedBy] = React.useState(state.inspectedBy || "H1210");
    const [inspectionID, setInspectionID] = React.useState(state.inspectionID || "");
    const [inspectionDate, setInspectionDate] = React.useState(state.inspectionDate || "");
    const [transformerId, setTransformerId] = React.useState(state.transformerId || "");
    const [inspectionNumber, setInspectionNumber] = React.useState(state.inspectionNumber || "");
    const [thermalUploaded, setThermalUploaded] = React.useState(false);
    const [showComparison, setShowComparison] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [tempthreshold, setTempthreshold] = React.useState(50); // default value

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

     const [openZoom, setOpenZoom] = React.useState(false);

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
        setAnomalyData({
        image: analysisResult.image || "",
        status: analysisResult.status || "",
        anomalies: analysisResult.anomalies || [],
        });
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
                    if (thermalImg.analysis) {
                        try {
                        const parsed = JSON.parse(thermalImg.analysis);
                        setAnalysisResult(parsed);
                        console.log("Fetched and parsed saved analysis:", parsed);
                        } catch (err) {
                        console.error("Error parsing saved analysis JSON:", err);
                        }
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
                    ref={imgRef}
                    src={`http://localhost:8080${thermalImageUrl}`}
                    alt="Thermal"
                    style={{
                    width: "100%",
                    maxWidth: 700,   // same visual width as baseline
                    height: "auto",
                    borderRadius: 12,
                    display: "block",
                    }}
                    onLoad={updateDims}
                />

                {/* Overlay (scaled) */}
                {anomalyData?.status && anomalyData?.anomalies?.map((a, idx) => {
                    const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = imgDims;
                    if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return null;

                    const { x, y, width: bw, height: bh } = a.bbox;

                    // scale factors from original → rendered
                    const sx = renderedWidth / naturalWidth;
                    const sy = renderedHeight / naturalHeight;

                    const offsetX = 0; // move 10px to the right
                    const offsetY = 43; // move 5px up

                    const left = x * sx + offsetX;
                    const top = y * sy + offsetY;
                    const w = bw * sx;
                    const h = bh * sy;

                    const isFaulty = (a.severity || "").toLowerCase().startsWith("faulty");
                    const color = isFaulty ? "red" : "gold";

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
                            pointerEvents: "none",
                            boxSizing: "border-box",
                        }}
                        />

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
                            pointerEvents: "none",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                        }}
                        >
                        #{idx + 1} ({(a.confidence ?? 0).toFixed(2)})
                        </div>
                    </React.Fragment>
                    );
                })}

                {/* Action buttons */}
                <div style={{ marginTop: 10, display: "flex", justifyContent: "center", gap: 10 }}>
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
    anomalyData.anomalies.map((anomaly, idx) => (
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
    Rules
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
    <strong>Rule 1:</strong> Temperature Difference Of Baseline and Maintenance Images
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
<p>Selected Threshold: {tempthreshold}</p>
</div>
</div>


<Dialog
  open={openZoom}
  onClose={handleCloseZoom}
  maxWidth="lg"
  PaperProps={{
    style: {
      backgroundColor: "black",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      padding: 0,
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
              {anomalyData?.status &&
                anomalyData?.anomalies?.map((a, idx) => {
                  const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = imgDims;
                  if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return null;

                  const { x, y, width: bw, height: bh } = a.bbox;
                  const sx = renderedWidth / naturalWidth;
                  const sy = renderedHeight / naturalHeight;

                  const left = x * sx;
                  const top = y * sy;
                  const w = bw * sx;
                  const h = bh * sy;

                  const isFaulty = (a.severity || "").toLowerCase().startsWith("faulty");
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
                        #{idx + 1} ({(a.confidence ?? 0).toFixed(2)})
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




  
        </div>
    );
}

export default Transformer;

