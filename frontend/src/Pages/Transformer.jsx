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
import { useContext } from "react";

import { imagesAPI } from '../services/api'; // Ensure this path is correct
import { ActorContext } from '../context/AuthContext';

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
    const { actor } = useContext(ActorContext);
    // uploader is always the inspector
    const uploader = actor;// inspectedBy;

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
                        file: null,
                        tag: "MAINTENANCE",
                        url: thermalImg.url,
                    });
                    setThermalImageUrl(thermalImg.url);
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
                file: null, // No actual file object needed after upload
                tag: "MAINTENANCE",
                url: uploadedImg.url,
            });
            setThermalImageUrl(uploadedImg.url);
            console.log("Thermal image uploaded successfully:", uploadedImg);
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

                        {/* Show baseline + thermal images side by side */}
                        {!loading && thermalImageUrl && baselineImageUrl && (
                            <div
                style={{
                    display: "flex",
                    gap: "32px",            // more spacing between images
                    marginTop: "20px",
                    justifyContent: "center", // center horizontally
                    alignItems: "center",     // align vertically
                }}
                >
                {baselineImageUrl && (
                    <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                        Baseline
                    </p>
                    <img
                        src={`http://localhost:8080${baselineImageUrl}`}
                        alt="Baseline"
                        style={{ width: "400px",height:"300px", borderRadius: "12px" }}  // larger image
                    />
                    </div>
                )}
                {thermalImageUrl && (
                    <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "8px" }}>
                        Thermal
                    </p>
                    <img
                        src={`http://localhost:8080${thermalImageUrl}`}
                        alt="Thermal"
                        style={{ width: "400px",height:"300px", borderRadius: "12px" }}  // larger image
                    />
                    <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => {
                        setSelectedthermalFile(null);
                        setThermalImageUrl(null);
                        }}
                        sx={{ marginTop: "8px" }}
                    >
                        <DeleteIcon />
                    </IconButton>
                    </div>
  )}
</div>

            )}
            </div>   
        </div>
    );
}

export default Transformer;



// import * as React from 'react';
// import { useLocation } from "react-router-dom";
// import Button from '@mui/material/Button';
// import Box from '@mui/material/Box';
// import InputLabel from '@mui/material/InputLabel';
// import MenuItem from '@mui/material/MenuItem';
// import FormControl from '@mui/material/FormControl';
// import Select from '@mui/material/Select';
// import IconButton from "@mui/material/IconButton";
// import DeleteIcon from "@mui/icons-material/Delete";

// import { imagesAPI } from '../services/api';

// function Transformer() {
//     const location = useLocation();
//     const state = location.state || {};
//     const [selectedbaselineFile, setSelectedbaselineFile] = React.useState(null);
//     const [selectedthermalFile, setSelectedthermalFile] = React.useState(null);
//     const [weather, setweather] = React.useState("");
//     const [loading, setLoading] = React.useState(false);
//     const [baselineUpdatedAt, setBaselineUpdatedAt] = React.useState(null);
    
//     // Initialize state only from passed data
//     const [transformerNo, setTransformerNo] = React.useState(state.transformerNo || "");
//     const [poleno, setPoleno] = React.useState(state.poleNo || "");
//     const [branch, setBranch] = React.useState(state.region || "");
//     const [inspectedBy, setInspectedBy] = React.useState(state.inspectedBy || "H1210");
//     const [inspectionID, setInspectionID] = React.useState(state.inspectionID || "");
//     const [inspectionDate, setInspectionDate] = React.useState(state.inspectionDate || "");
//     const [transformerId, setTransformerId] = React.useState(state.transformerId || "");

//     // uploader is always the inspector
//     const uploader = inspectedBy; 
//     const handleChange = (event) => {
//         setweather(event.target.value);
//     };

//     // Handle file selection
//     const handlebaselineFileChange = async (event) => {
//         const file = event.target.files[0];
//         if (!file) return;

//         try {
//             // Step 1: Check if baseline already exists in backend
//             const response = await imagesAPI.list(transformerId);
//             const images = response.data;
//             const existingBaseline = images.find((img) => img.imageType === "BASELINE");

//             if (existingBaseline) {
//                 // If backend already has baseline, just use that (skip upload)
//                 setSelectedbaselineFile({
//                     file: null,
//                     tag: "BASELINE",
//                     weather: existingBaseline.weatherCondition,
//                     url: existingBaseline.url,
//                 });
//                 setBaselineUpdatedAt(new Date(existingBaseline.uploadedAt));
//                 setweather(existingBaseline.weatherCondition);
//                 console.log("Baseline already exists in backend, skipping upload.");
//                 return;
//             }

//             //  Step 2: If no baseline, upload new one
//             setSelectedbaselineFile({ file, tag: "BASELINE", weather });
//             setBaselineUpdatedAt(new Date());
//             console.log("Selected baseline file:", file, "Tag: BASELINE", "Weather:", weather);

//             const formData = new FormData();
//             formData.append("file", file);
//             formData.append("imageType", "BASELINE");
//             formData.append("weatherCondition", weather.toUpperCase());
//             formData.append("uploader", uploader);
//             formData.append("inspectionId", inspectionID); // Add this line

//             await imagesAPI.upload(transformerId, formData);
//             console.log("Baseline uploaded successfully");
//         } catch (error) {
//             console.error("Error in baseline handling:", error);
//             if (error.response) {
//                 console.error("Backend error response:", error.response.data);
//                 console.error("Status:", error.response.status);
//             }
//         }
//     };

//     const handlethermalFileChange = async (event) => {
//         const file = event.target.files[0];
//         if (!file) return;

//         try {
//             const formData = new FormData();
//             formData.append("file", file);
//             formData.append("imageType", "MAINTENANCE");
//             formData.append("weatherCondition", weather.toUpperCase());
//             formData.append("uploader", uploader);
//             formData.append("inspectionId", inspectionID); // Add this line

//             setLoading(true);
//             await imagesAPI.upload(transformerId, formData);
//             console.log("Thermal image uploaded successfully");
//             setSelectedthermalFile({ file, tag: "MAINTENANCE" });
//         } catch (error) {
//             console.error("Error in thermal image upload:", error);
//             if (error.response) {
//                 console.error("Backend error response:",error.response.data);
//                 console.error("Status:", error.response.status);
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ padding: "20px", background: "#f9fafb", minHeight: "100vh" }}>
//             {/* Heading */}
//             <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "20px" , color: "#000000ff",textAlign: "left"}}>
//                 Transformer
//             </h2>

//             {/* Inspection card */}
//             <div
//                 style={{
//                     background: "white",
//                     borderRadius: "12px",
//                     boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
//                     padding: "16px",
//                     display: "flex",
//                     justifyContent: "space-between",
//                     alignItems: "center",
//                     marginBottom: "20px",
//                 }}
//             >
//                 <div>
//                     <p style={{ fontSize: "18px", fontWeight: "600", color: "#000000ff"  }}>{inspectionID}</p>
//                     <p style={{ fontSize: "14px", color: "#000000ff" }}>
//                         {inspectionDate}
//                     </p>
//                 </div>
//                 <div>
//                     <p style={{ fontSize: "12px", color: "#070708ff" }}>
//                     {baselineUpdatedAt
//                         ? `Last updated: ${baselineUpdatedAt.toLocaleString()}`
//                         : "No baseline uploaded yet"}
//                     </p>
//                     {/* Hidden file input */}
//                     <input
//                         accept="image/*"
//                         id="uploadbaseline-button-file"
//                         type="file"
//                         style={{ display: "none" }}
//                         onChange={handlebaselineFileChange}
//                         disabled={!weather || !!selectedbaselineFile}
//                     />

//                     {/* Upload button */}
//                     <label htmlFor="uploadbaseline-button-file">
//                         <Button
//                             variant="contained"
//                             size="small"
//                             component="span"
//                             disabled={!weather || !!selectedbaselineFile}
//                         >
//                             Baseline Image
//                         </Button>
//                     </label>

//                     {/* Show preview + delete button if baseline is selected */}
//                     {selectedbaselineFile && (
//                         <div
//                             style={{
//                                 display: "flex",
//                                 alignItems: "center",
//                                 marginTop: "10px",
//                                 gap: "8px",
//                             }}
//                         >
//                             <img
//                                 src={URL.createObjectURL(selectedbaselineFile.file)}
//                                 alt="Baseline"
//                                 style={{ width: "100px", borderRadius: "8px" }}
//                             />
//                             <IconButton
//                                 aria-label="delete"
//                                 color="error"
//                                 onClick={() => setSelectedbaselineFile(null)}
//                             >
//                                 <DeleteIcon />
//                             </IconButton>
//                         </div>
//                     )}
//                 </div>
//             </div>

//             {/* Transformer details */}
//             <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
//                 <div
//                     style={{
//                         padding: "8px 16px",
//                         background: "#f3f4f6",
//                         borderRadius: "8px",
//                         boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
//                     }}
//                 >
//                     <p style={{ fontSize: "12px", color: "#040404ff" }}>Transformer No</p>
//                     <p style={{ fontWeight: "600" , color: "#0a0a0aff"}}>{transformerNo}</p>
//                 </div>

//                 <div
//                     style={{
//                         padding: "8px 16px",
//                         background: "#f3f4f6",
//                         borderRadius: "8px",
//                         boxShadow: "0 1px 4px rgba(16, 15, 15, 0.1)",
//                     }}
//                 >
//                     <p style={{ fontSize: "极2px", color: "#0b0b0cff" }}>Pole No</p>
//                     <p style={{ fontWeight: "600", color: "#0b0b0cff" }}>{poleno}</p>
//                 </div>

//                 <div
//                     style={{
//                         padding: "8px 16px",
//                         background: "#f3f4f6",
//                         borderRadius: "8px",
//                         boxShadow: "0 14px rgba(0,0,0,0.1)",
//                     }}
//                 >
//                     <p style={{ fontSize: "12px", color: "#060707ff" }}>Branch</p>
//                     <p style={{ fontWeight: "600" , color: "#060707ff"}}>{branch}</p>
//                 </div>

//                 <div
//                     style={{
//                         padding: "8px 16px",
//                         background: "#f3f4f6",
//                         borderRadius: "8px",
//                         boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
//                     }}
//                 >
//                     <p style={{ fontSize: "12px", color: "#080808ff" }}>Inspected By</p>
//                     <p style={{ fontWeight: "600" , color: "#080808ff"}}>{inspectedBy}</p>
//                 </div>
//             </div>
//             <div
//                 style={{
//                     padding: "8px 16px",
//                     background: "#f3f4f6",
//                     borderRadius: "8px",
//                     boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
//                 }}
//             >
//                 <p style={{ fontSize: "16px", color: "#080808ff" }}>Thermal Image</p>

//                 {/* Show weather + upload only if no thermal file selected */}
//                 {!selectedthermalFile && !loading && (
//                     <>
//                         <p
//                             style={{
//                                 fontSize: "11px",
//                                 fontWeight: "400",
//                                 color: "#080808ff",
//                                 marginBottom: "8px",
//                             }}
//                         >
//                             Select the Weather
//                         </p>

//                         <FormControl fullWidth size="small">
//                             <InputLabel id="weather-select-label">Weather</InputLabel>
//                             <Select
//                                 labelId="weather-select-label"
//                                 id="weather-select"
//                                 value={weather}
//                                 label="Weather"
//                                 onChange={handleChange}
//                             >
//                                 <MenuItem value="SUNNY">Sunny</MenuItem>
//                                 <MenuItem value="CLOUDY">Cloudy</MenuItem>
//                                 <MenuItem value="RAINY">Rain</MenuItem>
//                             </Select>
//                         </FormControl>

//                         {/* Upload button */}
//                         <input
//                             accept="image/*"
//                             id="uploadthermal-button-file"
//                             type="file"
//                             style={{ display: "none" }}
//                             onChange={handlethermalFileChange}
//                             disabled={!(weather && selectedbaselineFile)}
//                         />
//                         <label htmlFor="uploadthermal-button-file">
//                             <Button variant="contained" size="small" component="span" disabled={!(weather && selectedbaselineFile)}>
//                                 Thermal Image
//                             </Button>
//                         </label>
//                     </>
//                 )}

//                 {/* Loading state */}
//                 {loading && (
//                     <p style={{ fontSize: "14px", fontWeight: "600", color: "orange" }}>
//                         Uploading Thermal Image...
//                     </p>
//                 )}

//                 {/* Show baseline + thermal images side by side */}
//                 {!loading && selectedthermalFile && selectedbaselineFile && (
//                     <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
//                         <div>
//                             <p style={{ fontSize: "12px", fontWeight: "600" }}>Baseline</p>
//                             <img
//                                 src={URL.createObjectURL(selectedbaselineFile.file)}
//                                 alt="Baseline"
//                                 style={{ width: "150px", borderRadius: "8px" }}
//                             />
//                         </div>
//                         <div>
//                             <p style={{ fontSize: "12px", fontWeight: "600"}}>Thermal</p>
//                             <img
//                                 src={URL.createObjectURL(selectedthermalFile.file)}
//                                 alt="Thermal"
//                                 style={{ width: "150px", borderRadius: "8px" }}
//                             />
//                         </div>
//                     </div>
//                 )}
//             </div>   
//         </div>
//     );
// }

// export default Transformer;