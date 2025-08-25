import { useState, useEffect } from 'react'
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Menu, MenuItem, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Alert, CircularProgress
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { transformerAPI, inspectionAPI } from '../services/api';

function NewPage() {
  const [view, setView] = useState('transformers') // 'transformers' or 'inspections'
  const [regionFilter, setRegionFilter] = useState('All Regions')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [regionAnchorEl, setRegionAnchorEl] = useState(null)
  const [typeAnchorEl, setTypeAnchorEl] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [inspectionsLoading, setInspectionsLoading] = useState(false)

  // Example options, can be fetched dynamically
   
  const [openPopup, setOpenPopup] = useState(false);
  const handleRegionClick = (event) => setRegionAnchorEl(event.currentTarget)
  const handleTypeClick = (event) => setTypeAnchorEl(event.currentTarget)
  const handleRegionClose = (region) => {
    setRegionAnchorEl(null)
    if (region) setRegionFilter(region)
  }
  const handleTypeClose = (type) => {
    setTypeAnchorEl(null)
    if (type) setTypeFilter(type)
  }
  const resetFilters = () => {
    setRegionFilter('All Regions')
    setTypeFilter('All Types')
  }

  // State for transformers data from backend
  const [transformersData, setTransformersData] = useState([])
  const [newTransformer, setNewTransformer] = useState({
    transformerNo: '',
    region: '',
    type: '',
    poleNo: '',
    capacityKVA: null
  })
  const [inspectionsData, setInspectionsData] = useState([])

  // Load transformers from backend
  const loadTransformers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await transformerAPI.getAll()
      setTransformersData(data)
    } catch (err) {
      setError('Failed to load transformers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTransformers()
  }, [])

  // Handle edit transformer from details page
  useEffect(() => {
    const location = window.location
    if (location.state?.editTransformer) {
      const transformer = location.state.editTransformer
      setEditingTransformer(transformer)
      setNewTransformer({
        transformerNo: transformer.transformerNo || '',
        region: transformer.region || '',
        type: transformer.type || '',
        poleNo: transformer.poleNo || '',
        capacityKVA: transformer.capacityKVA || null
      })
      setOpenPopup(true)
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title)
    }
  }, [])

  const handleSaveNewTransformer = async () => {
    try {
      if (editingTransformer) {
        // Update existing transformer
        await transformerAPI.update(editingTransformer.id, newTransformer)
      } else {
        // Create new transformer
        await transformerAPI.create(newTransformer)
      }
      
             // Reset form and reload data
       setNewTransformer({ 
         transformerNo: '', 
         region: '', 
         type: '', 
         poleNo: '', 
         capacityKVA: null 
       })
      setEditingTransformer(null)
      setOpenPopup(false)
      loadTransformers() // Reload the list
    } catch (err) {
      setError('Failed to save transformer: ' + err.message)
    }
  }

  const filteredData = transformersData.filter(item => {
    return (regionFilter === 'All Regions' || item.region === regionFilter) &&
           (typeFilter === 'All Types' || item.type === typeFilter)
  })
  const regions = ['All Regions', ...Array.from(new Set(transformersData.map(t => t.region)))];
  const types = ['All Types', ...Array.from(new Set(transformersData.map(t => t.type)))]; 
  const [editingTransformer, setEditingTransformer] = useState(null);
  const [selectedTransformer, setSelectedTransformer] = useState(null);
  const [inspectionPopup, setInspectionPopup] = useState(false);
  const [newInspection, setNewInspection] = useState({
    inspectionNumber: '',
    inspectedDate: '',
    maintenanceDate: '',
    status: 'PENDING',
    transformerId: null
  });
  const [editingInspection, setEditingInspection] = useState(null);
   
  // Handle View (you can open a dialog or console.log for now)
const handleView = (transformer) => {
  alert(`Viewing Transformer: ${transformer.transformerNo}`);
}

 // Handle Edit (open popup with pre-filled data)
 const handleEdit = (transformer) => {
   setEditingTransformer(transformer);
   setNewTransformer({
     transformerNo: transformer.transformerNo || '',
     region: transformer.region || '',
     type: transformer.type || '',
     poleNo: transformer.poleNo || '',
     capacityKVA: transformer.capacityKVA || null
   }); // pre-fill form
   setOpenPopup(true);
 }

// Handle Delete (remove record)
const handleDelete = async (id) => {
  if (window.confirm('Are you sure you want to delete this transformer?')) {
    try {
      await transformerAPI.delete(id)
      loadTransformers() // Reload the list
    } catch (err) {
      setError('Failed to delete transformer: ' + err.message)
    }
  }
}

const navigate = useNavigate();   
const handleViewDetails = (transformer) => {
  navigate(`/transformer/${transformer.id}`, { state: transformer });
}

// Load inspections for selected transformer
const loadInspections = async (transformerId) => {
  try {
    setInspectionsLoading(true);
    const data = await inspectionAPI.getByTransformerId(transformerId);
    setInspectionsData(data);
  } catch (err) {
    setError('Failed to load inspections: ' + err.message);
  } finally {
    setInspectionsLoading(false);
  }
};

// Handle transformer selection for inspections
const handleTransformerSelect = (transformer) => {
  setSelectedTransformer(transformer);
  loadInspections(transformer.id);
};

// Handle save inspection
const handleSaveInspection = async () => {
  try {
    if (editingInspection) {
      await inspectionAPI.update(editingInspection.id, newInspection);
    } else {
      await inspectionAPI.create(newInspection);
    }
    
    setNewInspection({
      inspectionNumber: '',
      inspectedDate: '',
      maintenanceDate: '',
      status: 'PENDING',
      transformerId: selectedTransformer.id
    });
    setEditingInspection(null);
    setInspectionPopup(false);
    loadInspections(selectedTransformer.id);
  } catch (err) {
    setError('Failed to save inspection: ' + err.message);
  }
};

// Handle edit inspection
  const handleEditInspection = (inspection) => {
    setEditingInspection(inspection);
    setNewInspection({
      inspectionNumber: inspection.inspectionNumber || '',
      inspectedDate: inspection.inspectedDate || '',
      maintenanceDate: inspection.maintenanceDate || '',
      status: inspection.status || 'PENDING',
      transformerId: inspection.transformerId
    });
    setInspectionPopup(true);
  };

// Handle delete inspection
const handleDeleteInspection = async (id) => {
  if (window.confirm('Are you sure you want to delete this inspection?')) {
    try {
      await inspectionAPI.delete(id);
      loadInspections(selectedTransformer.id);
    } catch (err) {
      setError('Failed to delete inspection: ' + err.message);
    }
  }
};  

  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Transformers Management
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 } }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Transformers
          </Typography>
          <Box sx={{ pl: 2 }}>
            {/* No transformers to display */}
          </Box>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* View Toggle Buttons */}
        <Box sx={{ mb: 2 }}>
          <Button 
            variant={view === 'transformers' ? 'contained' : 'outlined'} 
            onClick={() => setView('transformers')}
            sx={{ mr: 1 }}
          >
            Transformers
          </Button>
          <Button 
            variant={view === 'inspections' ? 'contained' : 'outlined'} 
            onClick={() => setView('inspections')}
          >
            Inspections
          </Button>
        </Box>

        {view === 'transformers' ? (
          <>
            {/* New Button Above Filter */}
     {view === 'transformers' && (
     <Box sx={{ mb: 2 }}>
    <Button 
      variant="contained" 
      color="primary"
             onClick={() => {
         setEditingTransformer(null)
         setNewTransformer({
           transformerNo: '',
           region: '',
           type: '',
           poleNo: '',
           capacityKVA: null
         })
         setOpenPopup(true)
       }}
    >
      New Transformer
    </Button>

    {/* Popup Dialog */}
<Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="sm" fullWidth>
  <DialogTitle>{editingTransformer ? 'Edit Transformer' : 'Add New Transformer'}</DialogTitle>
  <DialogContent>
    <TextField 
  label="Transformer No." 
  fullWidth 
  margin="dense" 
  required
  value={newTransformer.transformerNo}
  onChange={e=>setNewTransformer({...newTransformer, transformerNo:e.target.value})}
/>

<TextField 
  label="Region" 
  fullWidth 
  margin="dense"
  value={newTransformer.region}
  onChange={e=>setNewTransformer({...newTransformer, region:e.target.value})}
/>

<FormControl fullWidth margin="dense">
  <InputLabel>Type</InputLabel>
  <Select
    value={newTransformer.type}
    onChange={e=>setNewTransformer({...newTransformer, type:e.target.value})}
  >
    <MenuItem value="Bulk">Bulk</MenuItem>
    <MenuItem value="Distribution">Distribution</MenuItem>
  </Select>
</FormControl>

<TextField 
  label="Pole No" 
  fullWidth 
  margin="dense"
  value={newTransformer.poleNo}
  onChange={e=>setNewTransformer({...newTransformer, poleNo:e.target.value})}
/>



<TextField 
  label="Capacity (KVA)" 
  fullWidth 
  margin="dense"
  type="number"
  value={newTransformer.capacityKVA || ''}
  onChange={e=>setNewTransformer({...newTransformer, capacityKVA: e.target.value ? parseFloat(e.target.value) : null})}
/>

  </DialogContent>
  <DialogActions>
         <Button onClick={() => {
   setOpenPopup(false);
   setEditingTransformer(null);
   setNewTransformer({
     transformerNo: '',
     region: '',
     type: '',
     poleNo: '',
     capacityKVA: null
   });
 }}>Cancel</Button>
    <Button 
  variant="contained" 
  color="primary" 
  onClick={handleSaveNewTransformer}
  disabled={!newTransformer.transformerNo.trim()}
>
  {editingTransformer ? 'Update' : 'Save'}
</Button>

  </DialogActions>
</Dialog>

  </Box>
)}

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FilterListIcon />
                <Typography variant="h6">Filters</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={handleRegionClick} sx={{ minWidth: 150 }}>
                  {regionFilter}
                </Button>
                <Menu anchorEl={regionAnchorEl} open={Boolean(regionAnchorEl)} onClose={() => handleRegionClose(null)}>
                  {regions.map(region => (
                    <MenuItem key={region} onClick={() => handleRegionClose(region)} selected={regionFilter === region}>
                      {region}
                    </MenuItem>
                  ))}
                </Menu>

                <Button variant="outlined" onClick={handleTypeClick} sx={{ minWidth: 150 }}>
                  {typeFilter}
                </Button>
                <Menu anchorEl={typeAnchorEl} open={Boolean(typeAnchorEl)} onClose={() => handleTypeClose(null)}>
                  {types.map(type => (
                    <MenuItem key={type} onClick={() => handleTypeClose(type)} selected={typeFilter === type}>
                      {type}
                    </MenuItem>
                  ))}
                </Menu>

                <Button variant="outlined" color="secondary" onClick={resetFilters}>
                  Reset filters
                </Button>
              </Box>
            </Paper>

            {/* Data Table */}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper}>
                <Table sx={{ minWidth: 650 }} aria-label="transformers table">
                  <TableHead>
    <TableRow>
      <TableCell>Region</TableCell>
      <TableCell>Type</TableCell>
      <TableCell>Transformer No.</TableCell>
      <TableCell>Pole No</TableCell>
      <TableCell>Capacity (KVA)</TableCell>
      <TableCell align="right">Action</TableCell>
    </TableRow>
  </TableHead>
  <TableBody>
    {filteredData.length === 0 ? (
    <TableRow>
      <TableCell colSpan={6} align="center">
        No transformers available
      </TableCell>
    </TableRow>
  ) : (
    filteredData.map((row) => (
      <TableRow key={row.id}>
        <TableCell>{row.region}</TableCell>
        <TableCell>
          <Chip 
            label={row.type} 
            color={row.type === 'Bulk' ? 'primary' : 'secondary'} 
            size="small" 
          />
        </TableCell>
        <TableCell>{row.transformerNo}</TableCell>
        <TableCell>{row.poleNo}</TableCell>
        <TableCell>{row.capacityKVA || '-'}</TableCell>
        <TableCell align="right">
    <Button 
  variant="outlined" 
  size="small" 
  onClick={() => handleViewDetails(row)}
  sx={{ mr: 1 }}
>
  View
</Button>
    <Button 
      variant="outlined" 
      color="primary" 
      size="small" 
      onClick={() => handleEdit(row)}
      sx={{ mr: 1 }}
    >
      Edit
    </Button>
    <Button 
      variant="outlined" 
      color="error" 
      size="small" 
      onClick={() => handleDelete(row.id)}
    >
      Delete
    </Button>
  </TableCell>
      </TableRow>
    ))
  )}
  </TableBody>

                </Table>
              </TableContainer>
            )}
          </>
        ) : (
          /* Inspections View */
          <>
            {!selectedTransformer ? (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6" gutterBottom>
                  Select a Transformer
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2 }}>
                  Choose a transformer from the list below to view and manage its inspections.
                </Typography>
                <TableContainer component={Paper}>
                  <Table sx={{ minWidth: 650 }} aria-label="transformers table">
                    <TableHead>
                      <TableRow>
                        <TableCell>Transformer No.</TableCell>
                        <TableCell>Region</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell align="right">Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {transformersData.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.transformerNo}</TableCell>
                          <TableCell>{row.region}</TableCell>
                          <TableCell>
                            <Chip 
                              label={row.type} 
                              color={row.type === 'Bulk' ? 'primary' : 'secondary'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              variant="outlined" 
                              size="small"
                              onClick={() => handleTransformerSelect(row)}
                            >
                              Select
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ) : (
              <>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Inspections for {selectedTransformer.transformerNo}
                  </Typography>
                  <Box>
                    <Button 
                      variant="outlined" 
                      onClick={() => setSelectedTransformer(null)}
                      sx={{ mr: 1 }}
                    >
                      Back to List
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => {
                        setEditingInspection(null);
                                                 setNewInspection({
                           inspectionNumber: '',
                           inspectedDate: '',
                           maintenanceDate: '',
                           status: 'PENDING',
                           transformerId: selectedTransformer.id
                         });
                        setInspectionPopup(true);
                      }}
                    >
                      New Inspection
                    </Button>
                  </Box>
                </Box>

                {inspectionsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <TableContainer component={Paper}>
                    <Table sx={{ minWidth: 650 }} aria-label="inspections table">
                      <TableHead>
                        <TableRow>
                          <TableCell>Inspection Number</TableCell>
                          <TableCell>Inspected Date</TableCell>
                          <TableCell>Maintenance Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {inspectionsData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No inspections available for this transformer
                            </TableCell>
                          </TableRow>
                        ) : (
                          inspectionsData.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.inspectionNumber}</TableCell>
                              <TableCell>
                                {new Date(row.inspectedDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                {row.maintenanceDate 
                                  ? new Date(row.maintenanceDate).toLocaleDateString() 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={row.status} 
                                  color={
                                    row.status === 'COMPLETED' ? 'success' :
                                    row.status === 'PENDING' ? 'warning' :
                                    row.status === 'IN_PROGRESS' ? 'info' :
                                    row.status === 'FAILED' ? 'error' : 'default'
                                  } 
                                  size="small" 
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Button 
                                  variant="outlined" 
                                  color="primary" 
                                  size="small" 
                                  onClick={() => handleEditInspection(row)}
                                  sx={{ mr: 1 }}
                                >
                                  Edit
                                </Button>
                                <Button 
                                  variant="outlined" 
                                  color="error" 
                                  size="small" 
                                  onClick={() => handleDeleteInspection(row.id)}
                                >
                                  Delete
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Inspection Form Dialog */}
                <Dialog open={inspectionPopup} onClose={() => setInspectionPopup(false)} maxWidth="sm" fullWidth>
                  <DialogTitle>
                    {editingInspection ? 'Edit Inspection' : 'Add New Inspection'}
                  </DialogTitle>
                  <DialogContent>
                    <TextField 
                      label="Inspection Number" 
                      fullWidth 
                      margin="dense" 
                      required
                      value={newInspection.inspectionNumber}
                      onChange={e => setNewInspection({...newInspection, inspectionNumber: e.target.value})}
                    />

                    <TextField 
                      label="Inspected Date" 
                      fullWidth 
                      margin="dense"
                      type="date"
                      required
                      value={newInspection.inspectedDate}
                      onChange={e => setNewInspection({...newInspection, inspectedDate: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />

                    <TextField 
                      label="Maintenance Date" 
                      fullWidth 
                      margin="dense"
                      type="date"
                      value={newInspection.maintenanceDate}
                      onChange={e => setNewInspection({...newInspection, maintenanceDate: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />

                    <FormControl fullWidth margin="dense">
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={newInspection.status}
                        onChange={e => setNewInspection({...newInspection, status: e.target.value})}
                      >
                        <MenuItem value="PENDING">Pending</MenuItem>
                        <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
                        <MenuItem value="COMPLETED">Completed</MenuItem>
                        <MenuItem value="FAILED">Failed</MenuItem>
                        <MenuItem value="CANCELLED">Cancelled</MenuItem>
                      </Select>
                    </FormControl>

                    
                  </DialogContent>
                  <DialogActions>
                                         <Button onClick={() => {
                       setInspectionPopup(false);
                       setEditingInspection(null);
                       setNewInspection({
                         inspectionNumber: '',
                         inspectedDate: '',
                         maintenanceDate: '',
                         status: 'PENDING',
                         transformerId: selectedTransformer?.id
                       });
                     }}>
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleSaveInspection}
                      disabled={!newInspection.inspectionNumber.trim() || !newInspection.inspectedDate}
                    >
                      {editingInspection ? 'Update' : 'Save'}
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}
          </>
        )}
      </Box>
    </Box>
  )
}

export default NewPage
