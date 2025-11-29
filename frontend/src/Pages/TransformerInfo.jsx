// TransformerInfo.jsx
import { useState, useEffect } from 'react'
import { 
  Box, Drawer, AppBar, Toolbar, Typography, Button, Table, 
  TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Menu, MenuItem, Chip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar, Alert, CircularProgress,
  Pagination, PaginationItem
} from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import FilterListIcon from '@mui/icons-material/FilterList'
import NotificationsIcon from '@mui/icons-material/Notifications'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import StarIcon from '@mui/icons-material/Star'
import StarBorderIcon from '@mui/icons-material/StarBorder'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { FormControl, InputLabel, Select } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { transformersAPI, inspectionsAPI } from '../services/api';
import { useTheme } from '@mui/material/styles'
import useMediaQuery from '@mui/material/useMediaQuery'

function MainPage() {
  const [view, setView] = useState('transformers') // 'transformers' or 'inspections'
  const [regionFilter, setRegionFilter] = useState('All Regions')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [regionAnchorEl, setRegionAnchorEl] = useState(null)
  const [typeAnchorEl, setTypeAnchorEl] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [inspectionPage, setInspectionPage] = useState(1);   // ← NEW: inspections pagination page

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
    setCurrentPage(1)
  }

  // API integration states
  const [transformersData, setTransformersData] = useState([])
  const [newTransformer, setNewTransformer] = useState({
    transformerNo: '',
    region: '',
    type: '',
    poleNo: '',
    capacityKVA: '',
    locationDetails: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' })
  
  const [inspectionsData, setInspectionsData] = useState([])
  const [inspectionsLoading, setInspectionsLoading] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState([])   // ids of starred transformers
  const [showFavoriteTransformersOnly, setShowFavoriteTransformersOnly] = useState(false)

  //Add-inspection dialog state
  const [openInspectionPopup, setOpenInspectionPopup] = useState(false)
  const [newInspection, setNewInspection] = useState({
    transformerId: '',
    branch: '',
    inspectionDate: '',
    inspectionTime: '',
  })

  // Inspections filters + favourites
  const [inspectionSearch, setInspectionSearch] = useState('')
  const [inspectionTimeFilter, setInspectionTimeFilter] = useState('All Time')
  const [showFavoriteInspectionsOnly, setShowFavoriteInspectionsOnly] = useState(false)
  const [favoriteInspectionIds, setFavoriteInspectionIds] = useState([])

  // Helpers to format dates/times that may be arrays like [2025,11,27] and [9,13,37]
  const formatDate = (arr) => {
    if (!arr) return '-'
    if (Array.isArray(arr)) {
      const [y, m, d] = arr
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
    if (typeof arr === 'string') return arr.split('T')[0]
    return '-'
  }

  const formatTime = (arr) => {
    if (!arr) return ''
    if (Array.isArray(arr)) {
      const [h, min, s = 0] = arr
      return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    }
    if (typeof arr === 'string') {
      const t = arr.split('T').length > 1 ? arr.split('T')[1] : arr
      return t.split('.')[0]
    }
    return ''
  }
  
  // Fetch transformers on component mount
  useEffect(() => {
    fetchTransformers()
  }, [])

  // Fetch inspections for each transformer when inspections view is selected
  useEffect(() => {
    const fetchInspectionsForAll = async () => {
      if (!transformersData || transformersData.length === 0) {
        setInspectionsData([])
        return
      }

      setInspectionsLoading(true)
      try {
        const promises = transformersData.map(t =>
          inspectionsAPI.getByTransformer(t.id)
            .then(r =>
              (Array.isArray(r.data) ? r.data : []).map(i => ({
                ...i,
                transformerId: t.id,
                transformerNo: t.transformerNo
              }))
            )
            .catch(err => {
              console.warn('Failed to fetch inspections for transformer', t.id, err)
              return []
            })
        )

        const results = await Promise.all(promises)
        const flattened = results.flat()
        setInspectionsData(flattened)
      } catch (err) {
        console.error('Failed to fetch inspections:', err)
      } finally {
        setInspectionsLoading(false)
      }
    }

    if (view === 'inspections') fetchInspectionsForAll()
  }, [view, transformersData])

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
      // reset all fields (keep same shape)
      setNewTransformer({
        transformerNo: '',
        region: '',
        type: '',
        poleNo: '',
        capacityKVA: '',
        locationDetails: ''
      })
      setOpenPopup(false)
      setSnackbar({ open: true, message: 'Transformer created successfully', severity: 'success' })
    } catch (err) {
      setError('Failed to create transformer')
      setSnackbar({ open: true, message: 'Failed to create transformer', severity: 'error' })
      console.error('Error creating transformer:', err)
    }
  }

  // Handler for saving an inspection (wire API later if needed)
  const handleSaveNewInspection = async () => {
    // Integrate with inspectionsAPI when ready
    console.log('New inspection payload:', newInspection)

    // reset + close dialog
    setNewInspection({
      transformerId: '',
      branch: '',
      inspectionDate: '',
      inspectionTime: '',
    })
    setOpenInspectionPopup(false)
  }

  // UPDATED: filteredData now also considers favourites when showFavoriteTransformersOnly is true
  const filteredData = transformersData.filter(item => {
    const matchesRegion =
      regionFilter === 'All Regions' || item.region === regionFilter

    const matchesType =
      typeFilter === 'All Types' || item.type === typeFilter

    const matchesFavorite =
      !showFavoriteTransformersOnly || favoriteIds.includes(item.id)

    return matchesRegion && matchesType && matchesFavorite
  })

  // Filter inspections list (search + favourites)
  const filteredInspections = inspectionsData.filter((ins) => {
    const search = inspectionSearch.trim().toLowerCase()
    const text = `${ins.transformerNo || ''} ${(ins.inspectionNumber || ins.inspectionNo || '')}`.toLowerCase()

    const matchesSearch = search === '' || text.includes(search)
    const matchesFavorite =
      !showFavoriteInspectionsOnly || favoriteInspectionIds.includes(ins.id)

    // inspectionTimeFilter is "All Time" for now, so no extra condition
    return matchesSearch && matchesFavorite
  })

  // NEW: pagination values for inspections
  const inspectionTotalPages = Math.max(1, Math.ceil(filteredInspections.length / ITEMS_PER_PAGE))
  const paginatedInspections = filteredInspections.slice(
    (inspectionPage - 1) * ITEMS_PER_PAGE,
    inspectionPage * ITEMS_PER_PAGE
  )

  const regions = ['All Regions', ...Array.from(new Set(transformersData.map(t => t.region)))]
  const types = ['All Types', ...Array.from(new Set(transformersData.map(t => t.type)))]

  const [editingTransformer, setEditingTransformer] = useState(null)

  const totalPages = Math.max(1, Math.ceil(filteredData.length / ITEMS_PER_PAGE))
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
    if (currentPage < 1) setCurrentPage(1)
  }, [totalPages, currentPage])

  // keep inspections page in range when filter changes
  useEffect(() => {
    if (inspectionPage > inspectionTotalPages) setInspectionPage(inspectionTotalPages)
    if (inspectionPage < 1) setInspectionPage(1)
  }, [inspectionTotalPages, inspectionPage])

  const handleEdit = (transformer) => {
    setEditingTransformer(transformer)
    setNewTransformer({
      transformerNo: transformer.transformerNo || '',
      region: transformer.region || '',
      type: transformer.type || '',
      poleNo: transformer.poleNo || '',
      capacityKVA: transformer.capacityKVA || '',
      locationDetails: transformer.locationDetails || ''
    })
    setOpenPopup(true)
  }

  const handleUpdateTransformer = async () => {
    try {
      const response = await transformersAPI.update(editingTransformer.id, newTransformer)
      setTransformersData(transformersData.map(t => 
        t.id === editingTransformer.id ? response.data : t
      ))
      setEditingTransformer(null)
      setNewTransformer({
        transformerNo: '',
        region: '',
        type: '',
        poleNo: '',
        capacityKVA: '',
        locationDetails: ''
      })
      setOpenPopup(false)
      setSnackbar({ open: true, message: 'Transformer updated successfully', severity: 'success' })
    } catch (err) {
      setError('Failed to update transformer')
      setSnackbar({ open: true, message: 'Failed to update transformer', severity: 'error' })
      console.error('Error updating transformer:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      await transformersAPI.delete(id)
      setTransformersData(transformersData.filter(t => t.id !== id))
      setSnackbar({ open: true, message: 'Transformer deleted successfully', severity: 'success' })
    } catch (err) {
      setError('Failed to delete transformer')
      setSnackbar({ open: true, message: 'Failed to delete transformer', severity: 'error' })
      console.error('Error deleting transformer:', err)
    }
  }

  const toggleFavorite = (id) => {
    setFavoriteIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)   // if already favorite, remove it
        : [...prev, id]                // otherwise add it
    )
  }

  // NEW: toggle favourites for inspections
  const toggleInspectionFavorite = (id) => {
    setFavoriteInspectionIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // NEW: reset inspections filters
  const resetInspectionFilters = () => {
    setInspectionSearch('')
    setInspectionTimeFilter('All Time')
    setShowFavoriteInspectionsOnly(false)
    setInspectionPage(1)
  }

  const navigate = useNavigate()
  const handleViewDetails = (transformer) => {
    navigate(`/transformer/${transformer.id}`, { state: transformer })
  }

  // Responsive: show inline action buttons on medium+ screens, dropdown on smaller screens
  const theme = useTheme()
  // collapse action buttons earlier (at md) to avoid overlapping when window shrinks
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'))
  const [actionAnchorEl, setActionAnchorEl] = useState(null)
  const [actionRow, setActionRow] = useState(null)

  const openActionMenu = (event, row) => {
    setActionAnchorEl(event.currentTarget)
    setActionRow(row)
  }

  const closeActionMenu = () => {
    setActionAnchorEl(null)
    setActionRow(null)
  }

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false })
  }

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

        {/* Top Section: Title + User Profile (from code 1) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          {/* Page Title on Left */}
          <Typography variant="h5" sx={{ fontWeight: 'bold', fontSize: '1.8rem' }}>
            {view === 'transformers' ? 'Transformers' : 'Transformer > All Inspections'}
          </Typography>

          {/* User Profile Section on Right */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
            <IconButton>
              <NotificationsIcon sx={{ fontSize: '1.5rem', color: '#666' }} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: '#e0e0e0',
                  borderRadius: '50%',
                  backgroundImage: 'url("https://via.placeholder.com/48")',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Flarenet ENTC
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  flarenet@gmail.com
                </Typography>
              </Box>
            </Box>
          </Box>
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

            {/* Transformers Toolbar (from code 1) */}
            {view === 'transformers' && !loading && (
              <>
                <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: '#3f51b5',
                        color: '#fff',
                        borderRadius: 1,
                        fontSize: '1rem',
                        cursor: 'pointer'
                      }}
                    >
                      ◄
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Transformers
                    </Typography>

                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={() => { setOpenPopup(true); setEditingTransformer(null); }}
                      sx={{ backgroundColor: '#3f51b5', textTransform: 'none', boxShadow: 'none', borderRadius: 1, ml: 1 }}
                    >
                      Add Transformer
                    </Button>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant={view === 'transformers' ? 'contained' : 'outlined'} 
                      onClick={() => setView('transformers')}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Transformers
                    </Button>
                    <Button 
                      variant={view === 'inspections' ? 'contained' : 'outlined'} 
                      onClick={() => setView('inspections')}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      Inspections
                    </Button>
                  </Box>
                </Box>

                {/* Popup Dialog (Transformer) */}
                <Dialog
                  open={openPopup}
                  onClose={() => { setOpenPopup(false); setEditingTransformer(null); }}
                  maxWidth="sm"
                  fullWidth
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 2,
                      borderBottom: '1px solid #eee'
                    }}
                  >
                    <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600, p: 0 }}>
                      {editingTransformer ? 'Edit Transformer' : 'Add New Transformer'}
                    </DialogTitle>
                    <IconButton
                      onClick={() => { setOpenPopup(false); setEditingTransformer(null); }}
                      sx={{ color: '#666' }}
                    >
                      <CloseIcon />
                    </IconButton>
                  </Box>

                  <DialogContent sx={{ pt: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                      {/* Transformer No Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Transformer No
                        </Typography>
                        <TextField 
                          fullWidth
                          placeholder="Transformer No"
                          value={newTransformer.transformerNo}
                          onChange={e => setNewTransformer({ ...newTransformer, transformerNo: e.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Box>
                      
                      {/* Regions Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Regions
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Region</InputLabel>
                          <Select
                            value={newTransformer.region}
                            onChange={e => setNewTransformer({ ...newTransformer, region: e.target.value })}
                            label="Region"
                            sx={{ borderRadius: 3 }}
                          >
                            <MenuItem value="">Select Region</MenuItem>
                            {regions
                              .filter(r => r !== 'All Regions')
                              .map(region => (
                                <MenuItem key={region} value={region}>{region}</MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Pole No Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Pole No
                        </Typography>
                        <TextField 
                          fullWidth
                          placeholder="Pole No"
                          value={newTransformer.poleNo}
                          onChange={e => setNewTransformer({ ...newTransformer, poleNo: e.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Box>

                      {/* Type Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Type
                        </Typography>
                        <FormControl fullWidth>
                          <InputLabel>Type</InputLabel>
                          <Select
                            value={newTransformer.type}
                            onChange={e => setNewTransformer({ ...newTransformer, type: e.target.value })}
                            label="Type"
                            sx={{ borderRadius: 3 }}
                          >
                            <MenuItem value="">Select Type</MenuItem>
                            <MenuItem value="Bulk">Bulk</MenuItem>
                            <MenuItem value="Distribution">Distribution</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>

                      {/* Capacity Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Capacity
                        </Typography>
                        <TextField 
                          fullWidth
                          placeholder="Capacity"
                          value={newTransformer.capacityKVA}
                          onChange={e => setNewTransformer({ ...newTransformer, capacityKVA: e.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Box>

                      {/* Location Details Section */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}>
                          Location Details
                        </Typography>
                        <TextField 
                          fullWidth
                          placeholder="Location Details"
                          value={newTransformer.locationDetails}
                          onChange={e => setNewTransformer({ ...newTransformer, locationDetails: e.target.value })}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                      </Box>
                    </Box>
                  </DialogContent>

                  <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={() => {
                        setOpenPopup(false)
                        setEditingTransformer(null)
                      }}
                      sx={{ textTransform: 'none', color: '#3f51b5', fontWeight: 750, fontSize: '1rem' }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => {
                        if (editingTransformer) {
                          handleUpdateTransformer()
                        } else {
                          handleSaveNewTransformer()
                        }
                      }}
                      disabled={loading}
                      sx={{ 
                        backgroundColor: '#3f51b5', 
                        textTransform: 'none', 
                        fontWeight: 600,
                        px: 4,
                        borderRadius: 1,
                        fontSize: '1rem'
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : (editingTransformer ? 'UPDATE' : 'Confirm')}
                    </Button>
                  </DialogActions>
                </Dialog>
              </>
            )}

            {/* Filter Section */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <FilterListIcon />
                <Typography variant="h6">Filters</Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* By Transformer No Dropdown */}
                <FormControl sx={{ minWidth: 180 }}>
                  <Select
                    defaultValue=""
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) => {
                      if (selected === '') {
                        // placeholder text styled similar to the "All Regions" button
                        return (
                          <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}>
                            By Transformer No
                          </Typography>
                        )
                      }
                      return selected
                    }}
                    sx={{ 
                      borderRadius: 2, 
                      height: 40,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '& svg': {
                        color: 'primary.main',
                      }
                    }}
                  >
                    {/* placeholder item – menu content can be updated later */}
                    <MenuItem disabled value="">
                      By Transformer No
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Search Transformer Input */}
                <TextField 
                  placeholder="Search Transformer"
                  variant="outlined"
                  size="small"
                  sx={{ 
                    minWidth: 220, 
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      paddingRight: 0,
                      '& fieldset': {
                        borderWidth: 2,
                      },
                      '&:hover fieldset': {
                        borderWidth: 2,
                      },
                      '&.Mui-focused fieldset': {
                        borderWidth: 2,
                      }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#3f51b5',
                          color: '#fff',
                          borderRadius: '0 4px 4px 0',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <SearchIcon />
                      </Box>
                    ),
                  }}
                />

                {/* Star toggle – show only favourite transformers */}
                <IconButton
                  onClick={() => setShowFavoriteTransformersOnly(prev => !prev)}
                  sx={{ ml: 1 }}
                >
                  {showFavoriteTransformersOnly ? (
                    <StarIcon sx={{ color: '#fbc02d', fontSize: '1.6rem' }} />
                  ) : (
                    <StarBorderIcon sx={{ color: '#bdbdbd', fontSize: '1.6rem' }} />
                  )}
                </IconButton>

                {/* All Regions Button */}
                <Button 
                  variant="outlined" 
                  onClick={handleRegionClick}
                  endIcon={<ExpandMoreIcon />}
                  sx={{ 
                    minWidth: 150, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 2
                  }}
                >
                  All Regions
                </Button>
                <Menu anchorEl={regionAnchorEl} open={Boolean(regionAnchorEl)} onClose={() => handleRegionClose(null)}>
                  {regions.map(region => (
                    <MenuItem key={region} onClick={() => handleRegionClose(region)} selected={regionFilter === region}>
                      {region}
                    </MenuItem>
                  ))}
                </Menu>

                {/* All Types Button */}
                <Button 
                  variant="outlined" 
                  onClick={handleTypeClick}
                  endIcon={<ExpandMoreIcon />}
                  sx={{ 
                    minWidth: 150, 
                    textTransform: 'none', 
                    fontWeight: 600,
                    height: 40,
                    borderRadius: 2
                  }}
                >
                  All Types
                </Button>
                <Menu anchorEl={typeAnchorEl} open={Boolean(typeAnchorEl)} onClose={() => handleTypeClose(null)}>
                  {types.map(type => (
                    <MenuItem key={type} onClick={() => handleTypeClose(type)} selected={typeFilter === type}>
                      {type}
                    </MenuItem>
                  ))}
                </Menu>

                {/* Reset Filters Button */}
                <Button 
                  variant="text"
                  onClick={resetFilters}
                  sx={{ textTransform: 'none', fontWeight: 750, color: '#514f4fff' }}
                >
                  Reset Filters
                </Button>
              </Box>
            </Paper>

            {/* Data Table */}
            <TableContainer component={Paper} sx={{ width: '100%' }}>
              <Table
                sx={{ minWidth: 650, tableLayout: 'fixed' }}
                aria-label="transformers table"
              >
                <TableHead>
                  <TableRow>
                    {/* Star column – narrow */}
                    <TableCell align="center" sx={{ width: '5%' }} />

                    <TableCell sx={{ fontWeight: 700, width: '19%' }} align="left">
                      Region
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '19%' }} align="left">
                      Type
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '19%' }} align="left">
                      Transformer No.
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, width: '19%' }} align="left">
                      Pole No
                    </TableCell>

                    {/* Action column – a bit wider to hold buttons */}
                    <TableCell sx={{ fontWeight: 700, width: '19%' }} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      {/* now 6 columns total */}
                      <TableCell colSpan={6} align="center">
                        No transformers available
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row) => {
                      const isFavorite = favoriteIds.includes(row.id)

                      return (
                        <TableRow key={row.id}>
                          {/* star column (unchanged) */}
                          <TableCell align="center">
                            <IconButton
                              onClick={() => toggleFavorite(row.id)}
                              sx={{
                                p: 0.5,
                                color: isFavorite ? '#2f2a8b' : '#ffffff',
                                '& svg': {
                                  stroke: !isFavorite ? '#9e9e9e' : 'transparent',
                                  strokeWidth: !isFavorite ? 1.2 : 0
                                }
                              }}
                            >
                              {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                            </IconButton>
                          </TableCell>

                          {/* data columns */}
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
                            {!isSmallScreen ? (
                              <>
                                {/* View button */}
                                <Button 
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleViewDetails(row)}
                                  sx={{ 
                                    mr: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: 'none',
                                    backgroundColor: '#283593',
                                    '&:hover': {
                                      backgroundColor: '#1A237E'
                                    },
                                    minWidth: 0
                                  }}
                                >
                                  View
                                </Button>

                                {/* Edit button */}
                                <Button 
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleEdit(row)}
                                  sx={{ 
                                    mr: 1,
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: 'none',
                                    backgroundColor: '#336fb9ff',
                                    '&:hover': {
                                      backgroundColor: '#336fb9ff'
                                    },
                                    minWidth: 0
                                  }}
                                >
                                  Edit
                                </Button>

                                {/* Delete button */}
                                <Button 
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleDelete(row.id)}
                                  sx={{ 
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 2,
                                    boxShadow: 'none',
                                    backgroundColor: '#e53935',
                                    '&:hover': {
                                      backgroundColor: '#c62828'
                                    },
                                    minWidth: 0
                                  }}
                                >
                                  Delete
                                </Button>
                              </>
                            ) : (
                              <>
                                <IconButton size="small" onClick={(e) => openActionMenu(e, row)}>
                                  <ExpandMoreIcon />
                                </IconButton>
                                <Menu
                                  anchorEl={actionAnchorEl}
                                  open={Boolean(actionAnchorEl) && actionRow?.id === row.id}
                                  onClose={closeActionMenu}
                                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                                >
                                  <MenuItem onClick={() => { closeActionMenu(); handleViewDetails(row); }}>View</MenuItem>
                                  <MenuItem onClick={() => { closeActionMenu(); handleEdit(row); }}>Edit</MenuItem>
                                  <MenuItem onClick={() => { closeActionMenu(); handleDelete(row.id); }}>Delete</MenuItem>
                                </Menu>
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}

                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
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
                      minWidth: item.type === 'previous' || item.type === 'next' ? 40 : 32,
                      borderRadius:
                        item.type === 'previous' || item.type === 'next' ? '999px' : '10px',
                      fontSize: '0.875rem',
                      boxShadow:
                        item.type === 'previous' || item.type === 'next'
                          ? '0px 4px 10px rgba(0,0,0,0.18)'
                          : 'none',
                      bgcolor:
                        item.type === 'previous' || item.type === 'next'
                          ? '#2f2a8b'
                          : item.selected
                          ? '#ffffff'
                          : '#f4f4f9',
                      color:
                        item.type === 'previous' || item.type === 'next'
                          ? '#ffffff'
                          : item.selected
                          ? '#2f2a8b'
                          : '#777',
                      '&:hover': {
                        bgcolor:
                          item.type === 'previous' || item.type === 'next'
                            ? '#241f72'
                            : '#e8e8f0',
                      },
                      border: 'none',
                    }}
                  />
                )}
              />
            </Box>
          </>
        ) : (
          /* Inspections View: updated with filters + star column + pagination */
          <>
            {/* Inspections Toolbar (styled like code 1) */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#3f51b5',
                    color: '#fff',
                    borderRadius: 1,
                    fontSize: '1rem',
                    cursor: 'pointer'
                  }}
                >
                  ◄
                </Box>

                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  All Inspections
                </Typography>

                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => {
                    setOpenInspectionPopup(true)
                    setNewInspection({
                      transformerId: '',
                      branch: '',
                      inspectionDate: '',
                      inspectionTime: '',
                    })
                  }}
                  sx={{ backgroundColor: '#3f51b5', textTransform: 'none', boxShadow: 'none', borderRadius: 1, ml: 1 }}
                >
                  Add Inspection
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant={view === 'transformers' ? 'contained' : 'outlined'} 
                  onClick={() => setView('transformers')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Transformers
                </Button>
                <Button 
                  variant={view === 'inspections' ? 'contained' : 'outlined'} 
                  onClick={() => setView('inspections')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Inspections
                </Button>
              </Box>
            </Box>

            {/* NEW: Add Inspection popup dialog */}
            <Dialog
              open={openInspectionPopup}
              onClose={() => setOpenInspectionPopup(false)}
              maxWidth="sm"
              fullWidth
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderBottom: '1px solid #eee',
                }}
              >
                <DialogTitle sx={{ fontSize: '1.5rem', fontWeight: 600, p: 0 }}>
                  Add New Inspection
                </DialogTitle>
                <IconButton
                  onClick={() => setOpenInspectionPopup(false)}
                  sx={{ color: '#666' }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>

              <DialogContent sx={{ pt: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* Transformer selector */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}
                    >
                      Transformer
                    </Typography>
                    <FormControl fullWidth>
                      <InputLabel>Transformer</InputLabel>
                      <Select
                        label="Transformer"
                        value={newInspection.transformerId}
                        onChange={(e) =>
                          setNewInspection((prev) => ({
                            ...prev,
                            transformerId: e.target.value,
                          }))
                        }
                        sx={{ borderRadius: 3 }}
                      >
                        <MenuItem value="">Select Transformer</MenuItem>
                        {transformersData.map((t) => (
                          <MenuItem key={t.id} value={t.id}>
                            {t.transformerNo || 'Transformer'} {t.region ? `- ${t.region}` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  {/* Branch */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}
                    >
                      Branch
                    </Typography>
                    <TextField
                      fullWidth
                      placeholder="Branch"
                      value={newInspection.branch}
                      onChange={(e) =>
                        setNewInspection((prev) => ({
                          ...prev,
                          branch: e.target.value,
                        }))
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>

                  {/* Inspection Date */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}
                    >
                      Inspection Date
                    </Typography>
                    <TextField
                      type="date"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={newInspection.inspectionDate}
                      onChange={(e) =>
                        setNewInspection((prev) => ({
                          ...prev,
                          inspectionDate: e.target.value,
                        }))
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>

                  {/* Inspection Time */}
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ fontWeight: 600, mb: 1, fontSize: '0.9rem' }}
                    >
                      Inspection Time
                    </Typography>
                    <TextField
                      type="time"
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      value={newInspection.inspectionTime}
                      onChange={(e) =>
                        setNewInspection((prev) => ({
                          ...prev,
                          inspectionTime: e.target.value,
                        }))
                      }
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions sx={{ p: 3, gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => setOpenInspectionPopup(false)}
                  sx={{ textTransform: 'none', color: '#3f51b5', fontWeight: 750, fontSize: '1rem' }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveNewInspection}
                  sx={{
                    backgroundColor: '#3f51b5',
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 4,
                    borderRadius: 1,
                    fontSize: '1rem',
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>

            {/* Inspections Filters */}
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                {/* By Transformer No dropdown (visual only for now) */}
                <FormControl sx={{ minWidth: 180 }}>
                  <Select
                    defaultValue=""
                    displayEmpty
                    IconComponent={ExpandMoreIcon}
                    renderValue={(selected) => {
                      if (selected === '') {
                        return (
                          <Typography
                            sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}
                          >
                            By Transformer No
                          </Typography>
                        )
                      }
                      return selected
                    }}
                    sx={{
                      borderRadius: 2,
                      height: 40,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main'
                      },
                      '& svg': {
                        color: 'primary.main'
                      }
                    }}
                  >
                    <MenuItem disabled value="">
                      By Transformer No
                    </MenuItem>
                  </Select>
                </FormControl>

                {/* Search Transformer input */}
                <TextField
                  placeholder="Search Transformer"
                  variant="outlined"
                  size="small"
                  value={inspectionSearch}
                  onChange={(e) => setInspectionSearch(e.target.value)}
                  sx={{
                    minWidth: 220,
                    borderRadius: 1,
                    '& .MuiOutlinedInput-root': {
                      height: 40,
                      paddingRight: 0,
                      '& fieldset': {
                        borderWidth: 2
                      },
                      '&:hover fieldset': {
                        borderWidth: 2
                      },
                      '&.Mui-focused fieldset': {
                        borderWidth: 2
                      }
                    }
                  }}
                  InputProps={{
                    endAdornment: (
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: '#3f51b5',
                          color: '#fff',
                          borderRadius: '0 4px 4px 0',
                          cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >
                        <SearchIcon />
                      </Box>
                    )
                  }}
                />

                {/* All Time dropdown (visual, but stateful) */}
                <FormControl sx={{ minWidth: 160 }}>
                  <Select
                    value={inspectionTimeFilter}
                    onChange={(e) => setInspectionTimeFilter(e.target.value)}
                    IconComponent={ExpandMoreIcon}
                    displayEmpty
                    renderValue={(selected) => (
                      <Typography
                        sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'primary.main' }}
                      >
                        {selected || 'All Time'}
                      </Typography>
                    )}
                    sx={{
                      borderRadius: 2,
                      height: 40,
                      '& .MuiSelect-select': {
                        fontSize: '0.875rem',
                        padding: '10px 12px',
                        fontWeight: 600,
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'primary.main',
                      },
                      '& svg': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <MenuItem value="All Time">All Time</MenuItem>
                  </Select>
                </FormControl>

                {/* Reset Filters (for inspections) */}
                <Button
                  variant="text"
                  onClick={resetInspectionFilters}
                  sx={{ textTransform: 'none', fontWeight: 750, color: '#514f4fff' }}
                >
                  Reset Filters
                </Button>

                {/* Star toggle – show only favourite inspections */}
                <IconButton
                  onClick={() => setShowFavoriteInspectionsOnly((prev) => !prev)}
                  sx={{ ml: 1 }}
                >
                  {showFavoriteInspectionsOnly ? (
                    <StarIcon sx={{ color: '#fbc02d', fontSize: '1.6rem' }} />
                  ) : (
                    <StarBorderIcon sx={{ color: '#bdbdbd', fontSize: '1.6rem' }} />
                  )}
                </IconButton>
              </Box>
            </Paper>

            {/* Inspections table – now with star column & pagination */}
            <Paper sx={{ p: 2 }}>
              {inspectionsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : filteredInspections && filteredInspections.length ? (
                <>
                  <TableContainer component={Paper} sx={{ mt: 1, width: '100%' }}>
                    <Table sx={{ tableLayout: 'fixed' }} aria-label="inspections table">
                      <TableHead>
                        <TableRow>
                          {/* star column header */}
                          <TableCell align="center" sx={{ width: '5%' }} />

                          <TableCell sx={{ fontWeight: 700, width: '25%' }} align="left">
                            Transformer No.
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '25%' }} align="left">
                            Branch
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '25%' }} align="left">
                            Inspection Date
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700, width: '20%' }} align="center">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>

                      <TableBody>
                        {paginatedInspections.map((ins) => {
                          const trans =
                            transformersData.find((t) => t.id === ins.transformerId) || {}
                          const inspectedDate =
                            formatDate(ins.inspectedDate) || formatDate(ins.inspectionDate)
                          const inspectionTime = formatTime(ins.inspectionTime)
                          const isFavorite = favoriteInspectionIds.includes(ins.id)

                          return (
                            <TableRow key={ins.id}>
                              {/* star cell */}
                              <TableCell align="center">
                                <IconButton
                                  onClick={() => toggleInspectionFavorite(ins.id)}
                                  sx={{
                                    p: 0.5,
                                    color: isFavorite ? '#2f2a8b' : '#ffffff',
                                    '& svg': {
                                      stroke: !isFavorite ? '#9e9e9e' : 'transparent',
                                      strokeWidth: !isFavorite ? 1.2 : 0
                                    }
                                  }}
                                >
                                  {isFavorite ? <StarIcon /> : <StarBorderIcon />}
                                </IconButton>
                              </TableCell>

                              <TableCell>
                                {trans.transformerNo ||
                                  trans.transformerNumber ||
                                  ins.transformerNumber ||
                                  ins.transformerNo ||
                                  ins.transformerId}
                              </TableCell>

                              <TableCell>{ins.branch || '-'}</TableCell>

                              <TableCell>
                                {inspectedDate} {inspectionTime}
                              </TableCell>

                              <TableCell align="center">
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    // navigate to TransformerDetails and pass transformer + inspection info
                                    const navState = trans.id
                                      ? { ...trans }
                                      : { id: ins.transformerId, transformerNo: ins.transformerNo }
                                    // attach inspection info so TransformerDetails can open that inspection
                                    navState.inspectionID = ins.id
                                    navState.inspectionDate =
                                      ins.inspectedDate || ins.inspectionDate
                                    navState.inspectionTime = ins.inspectionTime
                                    navigate(`/transformer/${ins.transformerId}`, { state: navState })
                                  }}
                                  sx={{
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    px: 3,
                                    boxShadow: 'none',
                                    backgroundColor: '#283593',
                                    '&:hover': { backgroundColor: '#1A237E' }
                                  }}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Inspections Pagination */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, mb: 2 }}>
                    <Pagination
                      count={inspectionTotalPages}
                      page={inspectionPage}
                      onChange={(event, value) => setInspectionPage(value)}
                      siblingCount={1}
                      boundaryCount={1}
                      renderItem={(item) => (
                        <PaginationItem
                          {...item}
                          sx={{
                            mx: 0.5,
                            height: 32,
                            minWidth: item.type === 'previous' || item.type === 'next' ? 40 : 32,
                            borderRadius:
                              item.type === 'previous' || item.type === 'next' ? '999px' : '10px',
                            fontSize: '0.875rem',
                            boxShadow:
                              item.type === 'previous' || item.type === 'next'
                                ? '0px 4px 10px rgba(0,0,0,0.18)'
                                : 'none',
                            bgcolor:
                              item.type === 'previous' || item.type === 'next'
                                ? '#2f2a8b'
                                : item.selected
                                ? '#ffffff'
                                : '#f4f4f9',
                            color:
                              item.type === 'previous' || item.type === 'next'
                                ? '#ffffff'
                                : item.selected
                                ? '#2f2a8b'
                                : '#777',
                            '&:hover': {
                              bgcolor:
                                item.type === 'previous' || item.type === 'next'
                                  ? '#241f72'
                                  : '#e8e8f0',
                            },
                            border: 'none',
                          }}
                        />
                      )}
                    />
                  </Box>
                </>
              ) : (
                <Typography variant="body1" color="textSecondary">
                  No inspections available.
                </Typography>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Box>
  )
}

export default MainPage
