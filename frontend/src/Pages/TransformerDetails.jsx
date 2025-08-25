import { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Button, CircularProgress, Alert,
  Grid, Card, CardContent, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow
} from '@mui/material';
import { transformerAPI, inspectionAPI } from '../services/api';

function TransformerDetails() {
  const { state } = useLocation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [transformer, setTransformer] = useState(state || null);
  const [loading, setLoading] = useState(!state);
  const [error, setError] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);

  useEffect(() => {
    if (!state && id) {
      loadTransformer();
    }
  }, [id, state]);

  useEffect(() => {
    if (transformer) {
      loadInspections();
    }
  }, [transformer]);

  const loadTransformer = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await transformerAPI.getById(id);
      setTransformer(data);
    } catch (err) {
      setError('Failed to load transformer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadInspections = async () => {
    try {
      setInspectionsLoading(true);
      const data = await inspectionAPI.getByTransformerId(transformer.id);
      setInspections(data);
    } catch (err) {
      console.error('Failed to load inspections:', err.message);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this transformer?')) {
      try {
        await transformerAPI.delete(id);
        navigate('/new'); // Redirect to transformers list
      } catch (err) {
        setError('Failed to delete transformer: ' + err.message);
      }
    }
  };

  const handleViewInspection = (inspection) => {
    alert(`Viewing Inspection: ${inspection.inspectionNumber}\nStatus: ${inspection.status}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" onClick={() => navigate('/new')}>
          Back to Transformers
        </Button>
      </Box>
    );
  }

  if (!transformer) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Transformer Not Found
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/new')}>
          Back to Transformers
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Transformer Details
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/new')}
            sx={{ mr: 1 }}
          >
            Back to List
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => navigate('/new', { state: { editTransformer: transformer } })}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Transformer Number
                </Typography>
                <Typography variant="h5">
                  {transformer.transformerNo}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Chip 
                  label={transformer.type} 
                  color={transformer.type === 'Bulk' ? 'primary' : 'secondary'} 
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Region
                </Typography>
                <Typography variant="body1">
                  {transformer.region || 'Not specified'}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Pole Number
                </Typography>
                <Typography variant="body1">
                  {transformer.poleNo || 'Not specified'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Technical Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Capacity
                </Typography>
                <Typography variant="body1">
                  {transformer.capacityKVA ? `${transformer.capacityKVA} KVA` : 'Not specified'}
                </Typography>
              </Box>
              
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Created At
                  </Typography>
                  <Typography variant="body1">
                    {transformer.createdAt ? new Date(transformer.createdAt).toLocaleString() : 'Not available'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">
                    {transformer.updatedAt ? new Date(transformer.updatedAt).toLocaleString() : 'Not available'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
                 </Grid>
       </Grid>

       {/* Inspections Section */}
       <Box sx={{ mt: 4 }}>
         <Typography variant="h5" gutterBottom>
           Inspections ({inspections.length})
         </Typography>
         
         {inspectionsLoading ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
             <CircularProgress />
           </Box>
         ) : inspections.length === 0 ? (
           <Card>
             <CardContent>
               <Typography color="textSecondary" align="center">
                 No inspections found for this transformer.
               </Typography>
             </CardContent>
           </Card>
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
                 {inspections.map((inspection) => (
                   <TableRow key={inspection.id}>
                     <TableCell>{inspection.inspectionNumber}</TableCell>
                     <TableCell>
                       {new Date(inspection.inspectedDate).toLocaleDateString()}
                     </TableCell>
                     <TableCell>
                       {inspection.maintenanceDate 
                         ? new Date(inspection.maintenanceDate).toLocaleDateString() 
                         : '-'}
                     </TableCell>
                     <TableCell>
                       <Chip 
                         label={inspection.status} 
                         color={
                           inspection.status === 'COMPLETED' ? 'success' :
                           inspection.status === 'PENDING' ? 'warning' :
                           inspection.status === 'IN_PROGRESS' ? 'info' :
                           inspection.status === 'FAILED' ? 'error' : 'default'
                         } 
                         size="small" 
                       />
                     </TableCell>
                     <TableCell align="right">
                       <Button 
                         variant="outlined" 
                         size="small"
                         onClick={() => handleViewInspection(inspection)}
                       >
                         View
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </TableContainer>
         )}
       </Box>
     </Box>
   );
 }

export default TransformerDetails;
