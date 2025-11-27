//TransformerDetails.jsx  
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
import { inspectionsAPI, maintenanceAPI } from "../services/api";
import VeiwRecord from './VeiwRecord';

function TransformerDetails() {
  const location = useLocation();
  const transformer = location.state; // data passed from navigate
  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise editing
  const [open, setOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('inspections'); // 'inspections' | 'records'
  const [openRecordsDialog, setOpenRecordsDialog] = useState(false);
  const [selectedInspectionForRecords, setSelectedInspectionForRecords] = useState(null);
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

  const formatDate = (arr) => {
    if (!arr) return "-";
    // if array like [y, m, d]
    if (Array.isArray(arr)) {
      const [y, m, d] = arr;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    // if ISO string or YYYY-MM-DD string
    if (typeof arr === 'string') {
      return arr.split('T')[0];
    }
    return "-";
  };

  const formatTime = (arr) => {
    if (!arr) return "-";
    if (Array.isArray(arr)) {
      const [h, min, s = 0] = arr;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    if (typeof arr === 'string') {
      // assume HH:mm:ss or ISO timestamp
      const t = arr.split('T').length > 1 ? arr.split('T')[1] : arr;
      return t.split('.')[0];
    }
    return "-";
  };

  const formatFromISO = (iso) => {
    if (!iso) return { date: '-', time: '-' };
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return { date: String(iso).split('T')[0] || '-', time: String(iso).split('T')[1] || '-' };
      const date = d.toISOString().split('T')[0];
      const time = d.toTimeString().split(' ')[0];
      return { date, time };
    } catch (e) {
      return { date: String(iso).split('T')[0] || '-', time: String(iso).split('T')[1] || '-' };
    }
  };

  // fetch latest maintenance record for a given inspection and merge into inspectionData
  const fetchAndMergeMaintenance = async (inspection) => {
    if (!inspection || !inspection.id || !id) return;
    try {
      const resp = await maintenanceAPI.getByTransformerAndInspection(id, inspection.id);
      if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
        const rec = resp.data[resp.data.length - 1];
        let parsedRec = null;
        try {
          parsedRec = typeof rec.recordJson === 'string' ? JSON.parse(rec.recordJson) : (rec.recordJson || rec);
        } catch (e) {
          parsedRec = rec;
        }

        // try common timestamp fields
        const ts = parsedRec?.timestamp || parsedRec?.date || parsedRec?.savedAt || rec?.updatedAt || rec?.createdAt || parsedRec?.updatedAt;
        if (ts) {
          const { date, time } = formatFromISO(ts);
          setInspectionData(prev => prev.map(it => it.id === inspection.id ? { ...it, maintenanceDate: date, maintenanceTime: time } : it));
        }
      }
    } catch (e) {
      // ignore silently — won't block opening dialog
      console.warn('Failed to fetch maintenance for inspection', inspection.id, e);
    }
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

      {/* View toggles: Veiw Records / Veiw Inspections */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2, mb: 2 }}>
        <Button
          variant={viewMode === 'inspections' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => setViewMode('inspections')}
        >
          Veiw Inspections
        </Button>
        <Button
          variant={viewMode === 'records' ? 'contained' : 'outlined'}
          color="primary"
          onClick={() => setViewMode('records')}
        >
          View Records
        </Button>

      </Box>

      {/* (Records dialog removed) */}

      {/* Section heading: either Inspections or Records */}
      {viewMode === 'inspections' ? (
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">Transformer Inspections</Typography>
          <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
            Add Inspection
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: "flex", justifyContent: "flex-start", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">Inspection Records</Typography>
        </Box>
      )}

      {/* Inspection Table (shown when viewMode === 'inspections') */}
      {viewMode === 'inspections' && (
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
                    <TableCell sx={{ width: 200 }}>
                      {formatDate(item.inspectedDate)} {formatTime(item.inspectionTime)}
                    </TableCell>                    
                    <TableCell sx={{ width: 200 }}>
                      {item.maintenanceDate || item.maintenanceTime
                        ? `${formatDate(item.maintenanceDate)} ${formatTime(item.maintenanceTime)}`
                        : "-"}    </TableCell>                
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
      )}

      {/* Records Table (shown when viewMode === 'records') */}
      {viewMode === 'records' && (
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
                    <TableCell sx={{ width: 200 }}>
                                          {formatDate(item.inspectedDate)} {formatTime(item.inspectionTime)}
                                        </TableCell>                          
                    <TableCell sx={{ width: 200 }}>
                      {item.maintenanceDate || item.maintenanceTime
                        ? `${formatDate(item.maintenanceDate)} ${formatTime(item.maintenanceTime)}`
                        : "-"}
                    </TableCell>
                    <TableCell sx={{ width: 200 }}>{item.status}</TableCell>
                    <TableCell sx={{ width: 200, display: "flex", justifyContent: "flex-end" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={async () => {
                          await fetchAndMergeMaintenance(item);
                          setSelectedInspectionForRecords(item);
                          setOpenRecordsDialog(true);
                        }}
                      >
                        veiw record
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Typography variant="body2" color="textSecondary">
              No records available.
            </Typography>
          )}
        </Paper>
      )}

      {/* Dialog to show a single record's details using VeiwRecord component */}
      <Dialog
        open={openRecordsDialog}
        onClose={() => setOpenRecordsDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { width: '100%', maxWidth: 1200, height: '100vh' } }}
      >
        <DialogContent dividers sx={{ height: 'calc(100% - 64px)', overflow: 'auto' }}>
          <VeiwRecord transformer={transformer} inspection={selectedInspectionForRecords} onClose={() => setOpenRecordsDialog(false)} />
        </DialogContent>
      </Dialog>

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
