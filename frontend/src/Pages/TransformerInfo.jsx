//TransformerInfo.jsx


import { useState, useEffect } from 'react'
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Menu, MenuItem, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar, Alert, CircularProgress
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { transformersAPI } from '../services/api';

function MainPage() {
  const [view, setView] = useState('transformers') // 'transformers' or 'inspections'
  const [regionFilter, setRegionFilter] = useState('All Regions')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [regionAnchorEl, setRegionAnchorEl] = useState(null)
  const [typeAnchorEl, setTypeAnchorEl] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  // API integration states
  const [transformersData, setTransformersData] = useState([])
  const [newTransformer, setNewTransformer] = useState({transformerNo: '',region: '',type: '',poleNo: '', capacityKVA: '',locationDetails: ''})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  const inspectionsData = []
  
  // Fetch transformers on component mount
  useEffect(() => {
    fetchTransformers()
  }, [])

  const fetchTransformers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await transformersAPI.list()
      setTransformersData(response.data)
    } catch (err) {
      setError('Failed to fetch transformers')
      setSnackbar({ open: true, message: 'Failed to fetch transformers', severity: 'error' })
      console.error('Error fetching transformers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNewTransformer = async () => {
    try {
      const response = await transformersAPI.create(newTransformer)
      setTransformersData([...transformersData, response.data])
      setNewTransformer({ transformerNo: '', region: '', type: '', poleNo: '' })
      setOpenPopup(false)
      setSnackbar({ open: true, message: 'Transformer created successfully', severity: 'success' })
    } catch (err) {
      setError('Failed to create transformer')
      setSnackbar({ open: true, message: 'Failed to create transformer', severity: 'error' })
      console.error('Error creating transformer:', err)
    }
  }
  const filteredData = transformersData.filter(item => {
    return (regionFilter === 'All Regions' || item.region === regionFilter) &&
           (typeFilter === 'All Types' || item.type === typeFilter)
  })
  const regions = ['All Regions', ...Array.from(new Set(transformersData.map(t => t.region)))];
  const types = ['All Types', ...Array.from(new Set(transformersData.map(t => t.type)))]; 
  const [editingTransformer, setEditingTransformer] = useState(null);
   
  // Handle View (you can open a dialog or console.log for now)
const handleView = (transformer) => {
  alert(`Viewing Transformer: ${transformer.transformerNo}`);
}

// Handle Edit (open popup with pre-filled data)
const handleEdit = (transformer) => {
  setEditingTransformer(transformer);
  setNewTransformer(transformer); // pre-fill form
  setOpenPopup(true);
}

// Handle Update transformer
const handleUpdateTransformer = async () => {
  try {
    const response = await transformersAPI.update(editingTransformer.id, newTransformer)
    setTransformersData(transformersData.map(t => 
      t.id === editingTransformer.id ? response.data : t
    ));
    setEditingTransformer(null);
    setNewTransformer({ transformerNo: '', region: '', type: '', poleNo: '', capacityKVA: '',locationDetails: '' });
    setOpenPopup(false);
    setSnackbar({ open: true, message: 'Transformer updated successfully', severity: 'success' })
  } catch (err) {
    setError('Failed to update transformer')
    setSnackbar({ open: true, message: 'Failed to update transformer', severity: 'error' })
    console.error('Error updating transformer:', err)
  }
}

// Handle Delete (remove record)
const handleDelete = async (id) => {
  try {
    await transformersAPI.delete(id)
    setTransformersData(transformersData.filter(t => t.id !== id));
    setSnackbar({ open: true, message: 'Transformer deleted successfully', severity: 'success' })
  } catch (err) {
    setError('Failed to delete transformer')
    setSnackbar({ open: true, message: 'Failed to delete transformer', severity: 'error' })
    console.error('Error deleting transformer:', err)
  }
}
const navigate = useNavigate();   
const handleViewDetails = (transformer) => {
  navigate(`/transformer/${transformer.id}`, { state: transformer });
}  

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ display: 'flex' }}>
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

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />

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
            {/* Loading state */}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {/* Error state */}
            {error && !loading && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            {/* New Button Above Filter */}
            {view === 'transformers' && !loading && (
            <Box sx={{ mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => setOpenPopup(true)}
            >
              New Transformer
            </Button>

            {/* Popup Dialog */}
          <Dialog open={openPopup} onClose={() => setOpenPopup(false)}>
            <DialogTitle>Add New Transformer</DialogTitle>
            <DialogContent>
              <TextField 
            label="Transformer No." fullWidth margin="dense" 
            value={newTransformer.transformerNo}
            onChange={e=>setNewTransformer({...newTransformer, transformerNo:e.target.value})}
          />

          <TextField 
            label="Region" fullWidth margin="dense"
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
            label="Pole No" fullWidth margin="dense"
            value={newTransformer.poleNo}
            onChange={e=>setNewTransformer({...newTransformer, poleNo:e.target.value})}
          />
          <TextField 
            label="Capacity" fullWidth margin="dense"
            value={newTransformer.capacityKVA}
            onChange={e=>setNewTransformer({...newTransformer, capacityKVA:e.target.value})}
          />
          <TextField 
            label="Location" fullWidth margin="dense"
            value={newTransformer.locationDetails}
            onChange={e=>setNewTransformer({...newTransformer, locationDetails:e.target.value})}
          />

            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
            setOpenPopup(false);
            setEditingTransformer(null);}}>Cancel</Button>
              <Button 
            variant="contained" 
            color="primary" 
            onClick={() => {
              if (editingTransformer) {
                handleUpdateTransformer();
              } else {
                handleSaveNewTransformer();
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingTransformer ? 'Update' : 'Save')}
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
<TableContainer component={Paper}>
  <Table sx={{ minWidth: 650 }} aria-label="transformers table">
  <TableHead>
    <TableRow>
      <TableCell>Region</TableCell>
      <TableCell>Type</TableCell>
      <TableCell>Transformer No.</TableCell>
      <TableCell>Pole No</TableCell>
      <TableCell align="right">Action</TableCell>
    </TableRow>
</TableHead>
<TableBody>
  {filteredData.length === 0 ? (
  <TableRow>
    <TableCell colSpan={5} align="center">
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
          </>
          ) : (
          /* Inspections View Placeholder */
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Inspections View
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Inspection data will be displayed here.
              </Typography>
            </Paper>
          )}
      </Box>

    </Box>
  )
}

export default MainPage



