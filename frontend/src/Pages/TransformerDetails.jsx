import { useLocation, useParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';

function TransformerDetails() {
  const { state } = useLocation();
  const { id } = useParams();

  if (!state) {
    return <Typography>No transformer data found.</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Transformer Details
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography><strong>ID:</strong> {id}</Typography>
        <Typography><strong>Region:</strong> {state.region}</Typography>
        <Typography><strong>Type:</strong> {state.type}</Typography>
        <Typography><strong>Transformer No.:</strong> {state.transformerNo}</Typography>
        <Typography><strong>Pole No.:</strong> {state.poleNo}</Typography>
      </Paper>
    </Box>
  );
}

export default TransformerDetails;
