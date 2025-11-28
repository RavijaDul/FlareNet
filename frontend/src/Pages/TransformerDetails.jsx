// TransformerDetails.jsx
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  Pagination,
  PaginationItem,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CloseIcon from "@mui/icons-material/Close";

import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { inspectionsAPI, maintenanceAPI } from "../services/api";
import VeiwRecord from "./VeiwRecord";

function TransformerDetails() {
  const location = useLocation();
  const transformer = location.state; // data passed from navigate
  const navigate = useNavigate();

  const [editingId, setEditingId] = useState(null); // null = adding new, otherwise editing
  const [open, setOpen] = useState(false);
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(false); // kept as-is though unused
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("inspections"); // 'inspections' | 'records'
  const [openRecordsDialog, setOpenRecordsDialog] = useState(false);
  const [selectedInspectionForRecords, setSelectedInspectionForRecords] =
    useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ⭐ favorites for inspections
  const [favoriteIds, setFavoriteIds] = useState([]);
  const toggleFavorite = (id) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  // Pagination state
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

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

  // Fetch inspections when component mounts
  useEffect(() => {
    const fetchInspections = async () => {
      if (!id) return;

      setInspectionsLoading(true);
      try {
        const response = await inspectionsAPI.getByTransformer(id);
        setInspectionData(response.data);
      } catch (err) {
        console.error("Error fetching inspections:", err);
        setSnackbar({
          open: true,
          message: "Failed to fetch inspections",
          severity: "error",
        });
      } finally {
        setInspectionsLoading(false);
      }
    };

    fetchInspections();
  }, [id]);

  // Pagination derived values
  const totalPages = Math.max(
    1,
    Math.ceil(inspectionData.length / ITEMS_PER_PAGE)
  );
  const paginatedData = inspectionData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Clamp currentPage if data size changes
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async () => {
    const payload = {
      branch: formData.branch,
      transformerId: transformer.id,
      inspectedDate: formData.date.format("YYYY-MM-DD"),
      inspectionTime: formData.time.format("HH:mm:ss"),
      maintenanceDate: null,
    };

    try {
      let res;
      if (editingId !== null) {
        res = await inspectionsAPI.update(editingId, payload);
        setInspectionData(
          inspectionData.map((item) =>
            item.id === editingId ? res.data : item
          )
        );
      } else {
        res = await inspectionsAPI.create(payload);
        setInspectionData([...inspectionData, res.data]);
      }

      setSnackbar({
        open: true,
        message: "Inspection saved!",
        severity: "success",
      });
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to save inspection",
        severity: "error",
      });
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
    if (Array.isArray(arr)) {
      const [y, m, d] = arr;
      return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    }
    if (typeof arr === "string") {
      return arr.split("T")[0];
    }
    return "-";
  };

  const formatTime = (arr) => {
    if (!arr) return "-";
    if (Array.isArray(arr)) {
      const [h, min, s = 0] = arr;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(
        2,
        "0"
      )}:${String(s).padStart(2, "0")}`;
    }
    if (typeof arr === "string") {
      const t = arr.split("T").length > 1 ? arr.split("T")[1] : arr;
      return t.split(".")[0];
    }
    return "-";
  };

  const formatFromISO = (iso) => {
    if (!iso) return { date: "-", time: "-" };
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime()))
        return {
          date: String(iso).split("T")[0] || "-",
          time: String(iso).split("T")[1] || "-",
        };
      const date = d.toISOString().split("T")[0];
      const time = d.toTimeString().split(" ")[0];
      return { date, time };
    } catch (e) {
      return {
        date: String(iso).split("T")[0] || "-",
        time: String(iso).split("T")[1] || "-",
      };
    }
  };

  // fetch latest maintenance record for a given inspection and merge into inspectionData
  const fetchAndMergeMaintenance = async (inspection) => {
    if (!inspection || !inspection.id || !id) return;
    try {
      const resp = await maintenanceAPI.getByTransformerAndInspection(
        id,
        inspection.id
      );
      if (resp?.data && Array.isArray(resp.data) && resp.data.length > 0) {
        const rec = resp.data[resp.data.length - 1];
        let parsedRec = null;
        try {
          parsedRec =
            typeof rec.recordJson === "string"
              ? JSON.parse(rec.recordJson)
              : rec.recordJson || rec;
        } catch (e) {
          parsedRec = rec;
        }

        const ts =
          parsedRec?.timestamp ||
          parsedRec?.date ||
          parsedRec?.savedAt ||
          rec?.updatedAt ||
          rec?.createdAt ||
          parsedRec?.updatedAt;
        if (ts) {
          const { date, time } = formatFromISO(ts);
          setInspectionData((prev) =>
            prev.map((it) =>
              it.id === inspection.id
                ? { ...it, maintenanceDate: date, maintenanceTime: time }
                : it
            )
          );
        }
      }
    } catch (e) {
      console.warn(
        "Failed to fetch maintenance for inspection",
        inspection.id,
        e
      );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Top header – no bell/profile, same style as other pages */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-start",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", fontSize: "1.8rem" }}
        >
          Transformer Details
        </Typography>
      </Box>

      {/* Transformer Details Card */}
      <Paper
        sx={{
          p: 3,
          display: "flex",
          flexWrap: "wrap",
          gap: 4,
          mb: 3,
          borderRadius: 2,
          boxShadow: "0px 2px 10px rgba(0,0,0,0.08)",
        }}
      >
        <Box sx={{ minWidth: 160 }}>
          <Typography variant="caption" color="textSecondary">
            Transformer No
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {transformerNo}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 160 }}>
          <Typography variant="caption" color="textSecondary">
            Pole No
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {poleNo}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 160 }}>
          <Typography variant="caption" color="textSecondary">
            Region
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {region}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 160 }}>
          <Typography variant="caption" color="textSecondary">
            Type
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip
              label={type}
              color={type === "Bulk" ? "primary" : "secondary"}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ minWidth: 160 }}>
          <Typography variant="caption" color="textSecondary">
            Capacity (KVA)
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {transformer.capacityKVA || "-"}
          </Typography>
        </Box>

        <Box sx={{ minWidth: 200 }}>
          <Typography variant="caption" color="textSecondary">
            Location
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {transformer.locationDetails || "-"}
          </Typography>
        </Box>
      </Paper>

      {/* Toggle buttons: View Inspections / View Records */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button
          variant={viewMode === "inspections" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setViewMode("inspections")}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          View Inspections
        </Button>
        <Button
          variant={viewMode === "records" ? "contained" : "outlined"}
          color="primary"
          onClick={() => setViewMode("records")}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          View Records
        </Button>
      </Box>

      {/* Section heading / toolbar for Inspections vs Records */}
      {viewMode === "inspections" ? (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#3f51b5",
                color: "#fff",
                borderRadius: 1,
                fontSize: "1rem",
                cursor: "pointer",
              }}
              onClick={() => navigate(-1)}
            >
              ◄
            </Box>
            {/* Same size as "Transformer Details" */}
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, fontSize: "1.8rem" }}
            >
              Transformer Inspections
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={() => setOpen(true)}
            sx={{
              backgroundColor: "#3f51b5",
              textTransform: "none",
              boxShadow: "none",
              borderRadius: 1,
            }}
          >
            Add Inspection
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            mb: 2,
            display: "flex",
            gap: 2,
            alignItems: "center",
            justifyContent: "flex-start",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "#3f51b5",
                color: "#fff",
                borderRadius: 1,
                fontSize: "1rem",
                cursor: "pointer",
              }}
              onClick={() => navigate(-1)}
            >
              ◄
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, fontSize: "1.8rem" }}
            >
              Inspection Records
            </Typography>
          </Box>
        </Box>
      )}

      {/* Inspection Table (shown when viewMode === 'inspections') */}
      {viewMode === "inspections" && (
        <>
          <Paper sx={{ p: 2, mb: 4 }}>
            {inspectionsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : inspectionData.length ? (
              <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    {/* ⭐ Star column */}
                    <TableCell align="center" sx={{ width: "5%" }} />
                    <TableCell
                      sx={{ fontWeight: 700, width: "15%" }}
                      align="center"
                    >
                      Inspection Number
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: "20%" }}
                      align="center"
                    >
                      Inspection Date
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: "20%" }}
                      align="center"
                    >
                      Maintenance Date
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: "20%" }}
                      align="center"
                    >
                      Status
                    </TableCell>
                    {/* Actions header centered, like in the Transformers table */}
                    <TableCell
                      sx={{ fontWeight: 700, width: "20%" }}
                      align="center"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedData.map((item) => {
                    const isFavorite = favoriteIds.includes(item.id);

                    return (
                      <TableRow key={item.id}>
                        {/* ⭐ star button */}
                        <TableCell align="center">
                          <IconButton
                            onClick={() => toggleFavorite(item.id)}
                            sx={{
                              p: 0.5,
                              color: isFavorite ? "#2f2a8b" : "#ffffff",
                              "& svg": {
                                stroke: !isFavorite ? "#9e9e9e" : "transparent",
                                strokeWidth: !isFavorite ? 1.2 : 0,
                              },
                            }}
                          >
                            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ width: "15%" }} align="center">
                          {item.inspectionNumber}
                        </TableCell>
                        <TableCell sx={{ width: "20%" }} align="center">
                          {formatDate(item.inspectedDate)}{" "}
                          {formatTime(item.inspectionTime)}
                        </TableCell>
                        <TableCell sx={{ width: "20%" }} align="center">
                          {item.maintenanceDate || item.maintenanceTime
                            ? `${formatDate(
                                item.maintenanceDate
                              )} ${formatTime(item.maintenanceTime)}`
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ width: "20%" }} align="center">
                          {item.status}
                        </TableCell>

                        {/* Buttons right-aligned inside the 20% Actions column */}
                        <TableCell sx={{ width: "20%" }} align="right">
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 1,
                            }}
                          >
                            {/* View */}
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() =>
                                navigate("/transformer", {
                                  state: {
                                    transformerNo,
                                    poleNo,
                                    region,
                                    transformerId: id,
                                    inspectionID: item.id,
                                    inspectionDate: item.inspectedDate,
                                    inspectionTime: item.inspectionTime,
                                    inspectionNumber: item.inspectionNumber,
                                  },
                                })
                              }
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                boxShadow: "none",
                                backgroundColor: "#283593",
                                "&:hover": { backgroundColor: "#1A237E" },
                              }}
                            >
                              View
                            </Button>

                            {/* Edit */}
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => {
                                setEditingId(item.id);
                                setFormData({
                                  branch: item.branch,
                                  transformerNo,
                                  date: dayjs(item.inspectedDate),
                                  time: dayjs(
                                    item.inspectionTime,
                                    "HH:mm:ss"
                                  ),
                                });
                                setOpen(true);
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                boxShadow: "none",
                                backgroundColor: "#336fb9",
                                "&:hover": { backgroundColor: "#336fb9" },
                              }}
                            >
                              Edit
                            </Button>

                            {/* Delete */}
                            <Button
                              variant="contained"
                              size="small"
                              color="error"
                              onClick={async () => {
                                try {
                                  await inspectionsAPI.delete(item.id);
                                  setInspectionData(
                                    inspectionData.filter(
                                      (i) => i.id !== item.id
                                    )
                                  );
                                  setSnackbar({
                                    open: true,
                                    message:
                                      "Inspection deleted successfully",
                                    severity: "success",
                                  });
                                } catch (err) {
                                  setSnackbar({
                                    open: true,
                                    message:
                                      "Failed to delete inspection",
                                    severity: "error",
                                  });
                                }
                              }}
                              sx={{
                                borderRadius: 2,
                                textTransform: "none",
                                fontWeight: 600,
                                px: 3,
                                boxShadow: "none",
                                backgroundColor: "#e53935",
                                "&:hover": { backgroundColor: "#c62828" },
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No inspections available. Click &quot;Add Inspection&quot; to
                create one.
              </Typography>
            )}
          </Paper>

          {/* Pagination for inspections */}
          {!inspectionsLoading && inspectionData.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                mb: 2,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                siblingCount={1}
                boundaryCount={1}
                renderItem={(item) => (
                  <PaginationItem
                    {...item}
                    sx={{
                      mx: 0.5,
                      height: 32,
                      minWidth:
                        item.type === "previous" || item.type === "next"
                          ? 40
                          : 32,
                      borderRadius:
                        item.type === "previous" || item.type === "next"
                          ? "999px"
                          : "10px",
                      fontSize: "0.875rem",
                      boxShadow:
                        item.type === "previous" || item.type === "next"
                          ? "0px 4px 10px rgba(0,0,0,0.18)"
                          : "none",
                      bgcolor:
                        item.type === "previous" || item.type === "next"
                          ? "#2f2a8b"
                          : item.selected
                          ? "#ffffff"
                          : "#f4f4f9",
                      color:
                        item.type === "previous" || item.type === "next"
                          ? "#ffffff"
                          : item.selected
                          ? "#2f2a8b"
                          : "#777",
                      "&:hover": {
                        bgcolor:
                          item.type === "previous" || item.type === "next"
                            ? "#241f72"
                            : "#e8e8f0",
                      },
                      border: "none",
                    }}
                  />
                )}
              />
            </Box>
          )}
        </>
      )}

      {/* Records Table (shown when viewMode === 'records') */}
      {viewMode === "records" && (
        <>
          <Paper sx={{ p: 2, mb: 4 }}>
            {inspectionsLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                <CircularProgress />
              </Box>
            ) : inspectionData.length ? (
              <Table sx={{ tableLayout: "fixed" }}>
                <TableHead>
                  <TableRow>
                    {/* ⭐ Star column */}
                    <TableCell align="center" sx={{ width: "5%" }} />
                    <TableCell align="center" sx={{ fontWeight: 700, width: "15%" }}>
                      Inspection Number
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: "25%" }}>
                      Inspection Date
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: "20%" }}>
                      Maintenance Date
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, width: "20%" }}>
                      Status
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 700, width: "15%" }}
                      align="center"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedData.map((item) => {
                    const isFavorite = favoriteIds.includes(item.id);

                    return (
                      <TableRow key={item.id}>
                        {/* ⭐ Star cell */}
                        <TableCell align="center">
                          <IconButton
                            onClick={() => toggleFavorite(item.id)}
                            sx={{
                              p: 0.5,
                              color: isFavorite ? "#2f2a8b" : "#ffffff",
                              "& svg": {
                                stroke: !isFavorite ? "#9e9e9e" : "transparent",
                                strokeWidth: !isFavorite ? 1.2 : 0,
                              },
                            }}
                          >
                            {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                          </IconButton>
                        </TableCell>

                        <TableCell sx={{ width: "15%" }} align="center">
                          {item.inspectionNumber}
                        </TableCell>
                        <TableCell sx={{ width: "25%" }} align="center">
                          {formatDate(item.inspectedDate)}{" "}
                          {formatTime(item.inspectionTime)}
                        </TableCell>
                        <TableCell sx={{ width: "25%" }} align="center">
                          {item.maintenanceDate || item.maintenanceTime
                            ? `${formatDate(item.maintenanceDate)} ${formatTime(
                                item.maintenanceTime
                              )}`
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ width: "20%" }} align="center">
                          {item.status}
                        </TableCell>
                        <TableCell sx={{ width: "15%" }} align="center">
                          <Button
                            variant="contained"
                            size="small"
                            onClick={async () => {
                              await fetchAndMergeMaintenance(item);
                              setSelectedInspectionForRecords(item);
                              setOpenRecordsDialog(true);
                            }}
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontWeight: 600,
                              px: 3,
                              boxShadow: "none",
                              backgroundColor: "#283593",
                              "&:hover": { backgroundColor: "#1A237E" },
                            }}
                          >
                            View Record
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>

              </Table>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available.
              </Typography>
            )}
          </Paper>

          {/* Pagination for records view (same data/pages) */}
          {!inspectionsLoading && inspectionData.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mt: 2,
                mb: 2,
              }}
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                siblingCount={1}
                boundaryCount={1}
                renderItem={(item) => (
                  <PaginationItem
                    {...item}
                    sx={{
                      mx: 0.5,
                      height: 32,
                      minWidth:
                        item.type === "previous" || item.type === "next"
                          ? 40
                          : 32,
                      borderRadius:
                        item.type === "previous" || item.type === "next"
                          ? "999px"
                          : "10px",
                      fontSize: "0.875rem",
                      boxShadow:
                        item.type === "previous" || item.type === "next"
                          ? "0px 4px 10px rgba(0,0,0,0.18)"
                          : "none",
                      bgcolor:
                        item.type === "previous" || item.type === "next"
                          ? "#2f2a8b"
                          : item.selected
                          ? "#ffffff"
                          : "#f4f4f9",
                      color:
                        item.type === "previous" || item.type === "next"
                          ? "#ffffff"
                          : item.selected
                          ? "#2f2a8b"
                          : "#777",
                      "&:hover": {
                        bgcolor:
                          item.type === "previous" || item.type === "next"
                            ? "#241f72"
                            : "#e8e8f0",
                      },
                      border: "none",
                    }}
                  />
                )}
              />
            </Box>
          )}
        </>
      )}

      {/* Dialog to show a single record's details using VeiwRecord component */}
      <Dialog
        open={openRecordsDialog}
        onClose={() => setOpenRecordsDialog(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            width: "100%",
            maxWidth: 1200,
            maxHeight: "90vh",
            borderRadius: 3,
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(15,23,42,0.32)",
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2,
            background:
              "linear-gradient(90deg, #1e3a8a 0%, #312e81 45%, #7c3aed 100%)",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 1.4, opacity: 0.9 }}
            >
              Inspection Record
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
              {transformer.transformerNo}{" "}
              {selectedInspectionForRecords?.inspectionNumber
                ? `· ${selectedInspectionForRecords.inspectionNumber}`
                : ""}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={() => setOpenRecordsDialog(false)}
            sx={{
              color: "white",
              "&:hover": {
                backgroundColor: "rgba(15,23,42,0.35)",
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent
          dividers
          sx={{
            p: 3,
            backgroundColor: "#f9fafb",
            overflowY: "auto",
          }}
        >
          <VeiwRecord
            transformer={transformer}
            inspection={selectedInspectionForRecords}
            onClose={() => setOpenRecordsDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Add Inspection Dialog (logic unchanged) */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 0,
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            m: 0,
            px: 3,
            py: 2.5,
            borderBottom: "1px solid #e0e0e0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            New Inspection
          </Typography>
          <IconButton
            size="small"
            onClick={() => setOpen(false)}
            sx={{ color: "#757575" }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        {/* Content */}
        <DialogContent
          dividers
          sx={{
            px: 3,
            py: 3,
            maxHeight: "70vh",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Branch"
              value={formData.branch}
              onChange={(e) => handleChange("branch", e.target.value)}
              fullWidth
              variant="outlined"
            />

            <TextField
              label="Transformer No"
              value={formData.transformerNo}
              onChange={(e) => handleChange("transformerNo", e.target.value)}
              fullWidth
              variant="outlined"
            />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Inspection"
                value={formData.date}
                onChange={(newDate) => handleChange("date", newDate)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                  },
                }}
              />

              <TimePicker
                label="Time"
                value={formData.time}
                onChange={(newTime) => handleChange("time", newTime)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>

        {/* Footer */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: "1px solid #e0e0e0",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: "none",
              color: "#555",
              fontWeight: 600,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 4,
              borderRadius: 2,
              boxShadow: "none",
              backgroundColor: "#3f51b5",
              "&:hover": { backgroundColor: "#303f9f" },
            }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default TransformerDetails;
