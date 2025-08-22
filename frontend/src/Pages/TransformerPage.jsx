import * as React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import IconButton from "@mui/material/IconButton";
import DeleteIcon from "@mui/icons-material/Delete";
function NewPage() {
    const [selectedbaselineFile, setSelectedbaselineFile] = React.useState(null);
    const [selectedthermalFile, setSelectedthermalFile] = React.useState(null);
    const [weather, setweather] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [baselineUpdatedAt, setBaselineUpdatedAt] = React.useState(null);
    
    //variables
    const transformerNo = "AZ-8370";
    const poleno = "EN-122-A"
    const Branch="Nugegoda"
    const InspectedBy="A-110"
    const InspectionID="000123589"
    const inspectiondate="Mon(21), May, 2023 12.55pm"

    const handleChange = (event) => {
    setweather(event.target.value);
    };
  // Handle file selection
  const handlebaselineFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedbaselineFile(file);
      setBaselineUpdatedAt(new Date()); // store current time
      console.log("Selectedbaseline file:", file);
      // here you can also call API to upload the file
    }
  };
    const handlethermalFileChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    setSelectedthermalFile(file);
    console.log("Selectedthermal file:", file);

    // Start loading
    setLoading(true);

    // Simulate upload delay (5 seconds)
    setTimeout(() => {
      setLoading(false);
    }, 5000);
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
          <p style={{ fontSize: "18px", fontWeight: "600", color: "#000000ff"  }}>{InspectionID}</p>
          <p style={{ fontSize: "14px", color: "#000000ff" }}>
            {inspectiondate}
          </p>
        </div>
        <div>
          <p style={{ fontSize: "12px", color: "#070708ff" }}>
           {baselineUpdatedAt
              ? `Last updated: ${baselineUpdatedAt.toLocaleString()}`
             : "No baseline uploaded yet"}
            </p>
          {/* Hidden file input */}
<input
  accept="image/*"
  id="uploadbaseline-button-file"
  type="file"
  style={{ display: "none" }}
  onChange={handlebaselineFileChange}
  disabled={!!selectedbaselineFile}
/>

{/* Upload button */}
<label htmlFor="uploadbaseline-button-file">
  <Button
    variant="contained"
    size="small"
    component="span"
    disabled={!!selectedbaselineFile}
  >
    Baseline Image
  </Button>
</label>

{/* Show preview + delete button if baseline is selected */}
{selectedbaselineFile && (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      marginTop: "10px",
      gap: "8px",
    }}
  >
    <img
      src={URL.createObjectURL(selectedbaselineFile)}
      alt="Baseline"
      style={{ width: "100px", borderRadius: "8px" }}
    />
    <IconButton
      aria-label="delete"
      color="error"
      onClick={() => setSelectedbaselineFile(null)}
    >
      <DeleteIcon />
    </IconButton>
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
          <p style={{ fontWeight: "600" , color: "#060707ff"}}>{Branch}</p>
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
          <p style={{ fontWeight: "600" , color: "#080808ff"}}>{InspectedBy}</p>
        </div>
      </div>
     <div
  style={{
    padding: "8px 16px",
    background: "#f3f4f6",
    borderRadius: "8px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  }}
>
  <p style={{ fontSize: "16px", color: "#080808ff" }}>Thermal Image</p>

  {/* Show weather + upload only if no thermal file selected */}
  {!selectedthermalFile && !loading && (
    <>
      <p
        style={{
          fontSize: "11px",
          fontWeight: "400",
          color: "#080808ff",
          marginBottom: "8px",
        }}
      >
        Select the Weather
      </p>

      <FormControl fullWidth size="small">
        <InputLabel id="weather-select-label">Weather</InputLabel>
        <Select
          labelId="weather-select-label"
          id="weather-select"
          value={weather}
          label="Weather"
          onChange={handleChange}
        >
          <MenuItem value="Sunny">Sunny</MenuItem>
          <MenuItem value="Cloudy">Cloudy</MenuItem>
          <MenuItem value="Rainy">Rainy</MenuItem>
          <MenuItem value="Windy">Windy</MenuItem>
        </Select>
      </FormControl>

      {/* Upload button */}
      <input
        accept="image/*"
        id="uploadthermal-button-file"
        type="file"
        style={{ display: "none" }}
        onChange={handlethermalFileChange}
      />
      <label htmlFor="uploadthermal-button-file">
        <Button variant="contained" size="small" component="span">
          Thermal Image
        </Button>
      </label>
    </>
  )}

  {/* Loading state */}
  {loading && (
    <p style={{ fontSize: "14px", fontWeight: "600", color: "orange" }}>
      Uploading Thermal Image...
    </p>
  )}

  {/* Show baseline + thermal images side by side */}
  {!loading && selectedthermalFile && selectedbaselineFile && (
    <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "600" }}>Baseline</p>
        <img
          src={URL.createObjectURL(selectedbaselineFile)}
          alt="Baseline"
          style={{ width: "150px", borderRadius: "8px" }}
        />
      </div>
      <div>
        <p style={{ fontSize: "12px", fontWeight: "600" }}>Thermal</p>
        <img
          src={URL.createObjectURL(selectedthermalFile)}
          alt="Thermal"
          style={{ width: "150px", borderRadius: "8px" }}
        />
      </div>
    </div>
  )}
</div>   
    </div>
  );
}

export default NewPage