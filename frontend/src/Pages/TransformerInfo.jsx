import { useState } from 'react'
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Menu, MenuItem, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FilterListIcon from '@mui/icons-material/FilterList'
import { FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
function NewPage() {
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

  // Empty arrays instead of dummy data
  const [transformersData, setTransformersData] = useState([{ id: 1, transformerNo: "AZ-6950", region: "Nugegodo", type: "Bulk" }])
  const [newTransformer, setNewTransformer] = useState({transformerNo: '',region: '',type: '',poleNo: ''})
  const inspectionsData = []
  const handleSaveNewTransformer = () => {
  const newId = transformersData.length > 0 
    ? Math.max(...transformersData.map(t => t.id)) + 1 
    : 1

  setTransformersData([
    ...transformersData,
    { id: newId, ...newTransformer }])

  setNewTransformer({ transformerNo: '', region: '', type: '', poleNo: '' })
  setOpenPopup(false)
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

// Handle Delete (remove record)
const handleDelete = (id) => {
  setTransformersData(transformersData.filter(t => t.id !== id));
}
const navigate = useNavigate();   
const handleViewDetails = (transformer) => {
  navigate(`/transformer/${transformer.id}`, { state: transformer });
}  

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
      // Update existing
      setTransformersData(transformersData.map(t => 
        t.id === editingTransformer.id ? { ...editingTransformer, ...newTransformer } : t
      ));
      setEditingTransformer(null);
    } else {
      // Add new
      handleSaveNewTransformer();
    }
    setNewTransformer({ transformerNo: '', region: '', type: '', poleNo: '' });
    setOpenPopup(false);
  }}
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
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} aria-label="transformers table">
                <TableHead>
  <TableRow>
    <TableCell>Region</TableCell>
    <TableCell>Type</TableCell>
    <TableCell>Transformer No.</TableCell>
    <TableCell>Pole No</TableCell> {/* Add this */}
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

export default NewPage
