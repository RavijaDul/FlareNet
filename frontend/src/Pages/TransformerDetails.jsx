import { useState, useEffect } from "react";
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
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import { LocalizationProvider, DatePicker, TimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { inspectionsAPI } from "../services/api";

function TransformerDetails() {
  const location = useLocation();
  const transformer = location.state; // data passed from navigate
  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise editing
  const [open, setOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
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

  const { transformerNo, poleNo, region, type, id } = transformer;
  const navigate = useNavigate();

  // Fetch inspections when component mounts
  useEffect(() => {
    const fetchInspections = async () => {
      if (!id) return;
      
      setInspectionsLoading(true);
      try {
        const response = await inspectionsAPI.getByTransformer(id);
        setInspectionData(response.data);
      } catch (err) {
        console.error('Error fetching inspections:', err);
        setSnackbar({ open: true, message: 'Failed to fetch inspections', severity: 'error' });
      } finally {
        setInspectionsLoading(false);
      }
    };

    fetchInspections();
  }, [id]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // const handleSubmit = () => {
  //   const newEntry = {
  //     id: editingId !== null
  //       ? editingId // keep the same ID if editing
  //       : inspectionData.length
  //         ? inspectionData[inspectionData.length - 1].id + 1
  //         : 10000,
  //     transformerNo: formData.transformerNo,
  //     branch: formData.branch,
  //     dateTime: formData.date.format("ddd(DD), MMM, YYYY") + " " + formData.time.format("hh.mmA"),
  //     inspectionDate: formData.date.format("YYYY-MM-DD"),
  //     inspectionTime: formData.time.format("HH:mm:ss"),
  //     status: "PENDING"
  //   };

  //   if (editingId !== null) {
  //     // update existing row
  //     setInspectionData(
  //       inspectionData.map((item) => (item.id === editingId ? newEntry : item))
  //     );
  //   } else {
  //     // add new row
  //     setInspectionData([...inspectionData, newEntry]);
  //   }

  //   setOpen(false);
  //   setEditingId(null); // reset editing
  //   setFormData({
  //     branch: "",
  //     transformerNo: transformer?.transformerNo || "",
  //     date: dayjs(),
  //     time: dayjs(),
  //   });
  // };
    const handleSubmit = async () => {
      const payload = {
      branch: formData.branch,
      transformerId: transformer.id, 
      inspectedDate: formData.date.format("YYYY-MM-DD"),  // <-- rename
      inspectionTime: formData.time.format("HH:mm:ss"),
      maintenanceDate: null, // optional

      };

      try {
        let res;
        if (editingId !== null) {
          res = await inspectionsAPI.update(editingId, payload);
          setInspectionData(
            inspectionData.map((item) => (item.id === editingId ? res.data : item))
          );
        } else {
          res = await inspectionsAPI.create(payload);
          setInspectionData([...inspectionData, res.data]);
        }

        setSnackbar({ open: true, message: "Inspection saved!", severity: "success" });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to save inspection", severity: "error" });
      }

      setOpen(false);
      setEditingId(null);
      setFormData({
        branch: "",
        transformerNo: transformer?.transformerNo || "",
        date: dayjs(),
        time: dayjs(),
      });
    };
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };


  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
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
         {/* New field for Capacity KVA */}
        <Box sx={{ minWidth: 150 }}>
        <Typography variant="caption" color="textSecondary">
          Capacity (KVA)
        </Typography>
        <Typography variant="subtitle1">{transformer.capacityKVA || "-"}</Typography>
        </Box>
        <Box sx={{ minWidth: 150 }}>
        <Typography variant="caption" color="textSecondary">
          Location
        </Typography>
        <Typography variant="subtitle1">{transformer.locationDetails || "-"}</Typography>
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
        {inspectionsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : inspectionData.length ? (
          <Table>
            <TableHead>
          <TableRow>
            <TableCell sx={{ width: 50 }}>Inspection Number</TableCell>
            <TableCell sx={{ width: 200 }}>Inspection Date</TableCell>
            <TableCell sx={{ width: 200 }}>Maintenence Date</TableCell>
            <TableCell sx={{ width: 200 }}>Status</TableCell>
            <TableCell sx={{ width: 200, align: "right" }}>Actions</TableCell> 
          </TableRow>
        </TableHead>
        <TableBody>
          {inspectionData.map((item) => (
            <TableRow key={item.id}>
              <TableCell sx={{ width: 50 }}>{item.inspectionNumber}</TableCell>
              <TableCell sx={{ width: 200 }}>{item.inspectedDate} {item.inspectionTime}</TableCell>
              <TableCell sx={{ width: 200 }}>{item.inspectedDate} {item.inspectionTime}</TableCell>
              <TableCell sx={{ width: 200 }}>{item.status}</TableCell>
              <TableCell sx={{ width: 200, display: "flex", justifyContent: "flex-end", gap: 1 }}>
          <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() =>
            navigate("/transformer", {
              state: {
                transformerNo: transformerNo,
                poleNo: poleNo,
                region: region,
                transformerId: id, // Pass transformer ID instead of inspection ID
                inspectionID: item.id,
                inspectionDate: item.inspectedDate,
                inspectionTime: item.inspectionTime,
                inspectionNumber: item.inspectionNumber,
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
              transformerNo: transformerNo,
              date: dayjs(item.inspectedDate),
              time: dayjs(item.inspectionTime, "HH:mm:ss"),
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
            onClick={async () => {
              try {
                await inspectionsAPI.delete(item.id);
                setInspectionData(inspectionData.filter((i) => i.id !== item.id));
                setSnackbar({ open: true, message: 'Inspection deleted successfully', severity: 'success' });
              } catch (err) {
                setSnackbar({ open: true, message: 'Failed to delete inspection', severity: 'error' });
              }
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
