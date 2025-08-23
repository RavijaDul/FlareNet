import { useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

function TransformerDetails() {
  const location = useLocation();
  const transformer = location.state; // data passed from navigate
  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise editing
  const [open, setOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([
    { id: 10000, transformerNo: "AZ-6950", date: "", time: "" },
  ]);
  
  const [formData, setFormData] = useState({
    branch: "",
    transformerNo: transformer?.transformerNo || "",
    date: dayjs(),
    time: dayjs(),
  });

  if (!transformer) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6">No transformer data available</Typography>
      </Paper>
    );
  }

  const { transformerNo, poleNo, region, type } = transformer;
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
  const newEntry = {
    id: editingId !== null
      ? editingId // keep the same ID if editing
      : inspectionData.length
        ? inspectionData[inspectionData.length - 1].id + 1
        : 10000,
    transformerNo: formData.transformerNo,
    branch: formData.branch,
    dateTime: formData.date.format("ddd(DD), MMM, YYYY") + " " + formData.time.format("hh.mmA"),
  };

  if (editingId !== null) {
    // update existing row
    setInspectionData(
      inspectionData.map((item) => (item.id === editingId ? newEntry : item))
    );
  } else {
    // add new row
    setInspectionData([...inspectionData, newEntry]);
  }

  setOpen(false);
  setEditingId(null); // reset editing
  setFormData({
    branch: "",
    transformerNo: transformer?.transformerNo || "",
    date: dayjs(),
    time: dayjs(),
  });
};


  return (
    <Box sx={{ p: 3 }}>
      {/* Transformer Details Section */}
      <Typography variant="h5" gutterBottom>
        Transformer Details
      </Typography>

      <Paper sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 2, mb: 4 }}>
        <Box sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="textSecondary">
            Transformer No
          </Typography>
          <Typography variant="subtitle1">{transformerNo}</Typography>
        </Box>

        <Box sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="textSecondary">
            Pole No
          </Typography>
          <Typography variant="subtitle1">{poleNo}</Typography>
        </Box>

        <Box sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="textSecondary">
            Region
          </Typography>
          <Typography variant="subtitle1">{region}</Typography>
        </Box>

        <Box sx={{ minWidth: 150 }}>
          <Typography variant="caption" color="textSecondary">
            Type
          </Typography>
          <Chip
            label={type}
            color={type === "Bulk" ? "primary" : "secondary"}
            size="small"
          />
        </Box>
      </Paper>

      {/* Transformer Inspection Section */}
      <Box
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}
      >
        <Typography variant="h5">Transformer Inspections</Typography>
        <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
          Add Inspection
        </Button>
      </Box>

      {/* Inspection Table */}
      <Paper sx={{ p: 2, mb: 4 }}>
        {inspectionData.length ? (
          <Table>
            <TableHead>
  <TableRow>
    <TableCell sx={{ width: 50 }}>ID</TableCell>
    <TableCell sx={{ width: 200 }}>Inspection Date </TableCell>
    <TableCell sx={{ width: 200 }}>Maintenance Date</TableCell>
    <TableCell sx={{ width: 200, align: "right" }}>Actions</TableCell> {/* Last column */}
  </TableRow>
</TableHead>
<TableBody>
  {inspectionData.map((item) => (
    <TableRow key={item.id}>
      <TableCell sx={{ width: 50 }}>{item.id}</TableCell>
      <TableCell sx={{ width: 200 }}>{item.dateTime}</TableCell>
      <TableCell sx={{ width: 200 }}>Sat(23), Aug, 2025 09.56PM</TableCell>
      <TableCell sx={{ width: 200, display: "flex", justifyContent: "flex-end", gap: 1 }}>
  <Button
  variant="outlined"
  size="small"
  color="primary"
  onClick={() =>
    navigate("/transformer", {
      state: {
        transformerNo: transformerNo, // from current page
        poleNo: poleNo,
        region: region,
        inspectionID: item.id, // or whatever your inspection ID is
        inspectionDate: item.dateTime,
      },
    })
  }
>
  View
</Button>
  <Button
  variant="outlined"
  size="small"
  color="warning"
  onClick={() => {
    setEditingId(item.id); // mark the row to edit
    setFormData({
      branch: item.branch,
      transformerNo: item.transformerNo,
      date: dayjs(item.dateTime.split(" ")[0]), // extract date
      time: dayjs(item.dateTime.split(" ")[1], "hh.mmA"), // extract time
    });
    setOpen(true);
  }}
>
  Edit
</Button>
  <Button
    variant="outlined"
    size="small"
    color="error"
    onClick={() => {
      setInspectionData(inspectionData.filter((i) => i.id !== item.id));
    }}
  >
    Delete
  </Button>
</TableCell>
    </TableRow>
  ))}
</TableBody>
          </Table>
        ) : (
          <Typography variant="body2" color="textSecondary">
            No inspections available. Click "Add Inspection" to create one.
          </Typography>
        )}
      </Paper>

      {/* Add Inspection Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Inspection</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Branch"
              value={formData.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              fullWidth
            />
            <TextField
              label="Transformer No"
              value={formData.transformerNo}
              onChange={(e) => handleChange("transformerNo", e.target.value)}
              fullWidth
            />

            {/* Date & Time Pickers */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Inspection"
                value={formData.date}
                onChange={(newDate) => handleChange("date", newDate)}
              />
              <TimePicker
                label="Time"
                value={formData.time}
                onChange={(newTime) => handleChange("time", newTime)}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TransformerDetails;
