// src/pages/HomePage.jsx
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { 
  Box, Typography, Button, Card, CardContent, Grid, 
  Chip, CircularProgress, Alert 
} from '@mui/material'
import { transformerAPI } from '../services/api'

function HomePage() {
  const navigate = useNavigate()
  const [transformers, setTransformers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadTransformers()
  }, [])

  const loadTransformers = async () => {
    try {
      setLoading(true)
      const data = await transformerAPI.getAll()
      setTransformers(data)
      setError(null)
    } catch (err) {
      setError('Failed to load transformers: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h3" gutterBottom>
        FlareNet Transformer Management
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/new')}
          sx={{ mr: 2 }}
        >
          Manage Transformers
        </Button>
        <Button
          variant="outlined"
          onClick={loadTransformers}
        >
          Refresh
        </Button>
      </Box>

      <Typography variant="h5" gutterBottom>
        Recent Transformers ({transformers.length})
      </Typography>

      {transformers.length === 0 ? (
        <Card>
          <CardContent>
            <Typography color="textSecondary">
              No transformers found. Click "Manage Transformers" to add new ones.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {transformers.slice(0, 6).map((transformer) => (
            <Grid item xs={12} sm={6} md={4} key={transformer.id}>
              <Card 
                sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                onClick={() => navigate(`/transformer/${transformer.id}`)}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {transformer.transformerNo}
                  </Typography>
                  <Typography color="textSecondary" gutterBottom>
                    {transformer.region}
                  </Typography>
                  <Chip 
                    label={transformer.type} 
                    color={transformer.type === 'Bulk' ? 'primary' : 'secondary'} 
                    size="small" 
                  />
                  {transformer.poleNo && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Pole: {transformer.poleNo}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  )
}

export default HomePage 