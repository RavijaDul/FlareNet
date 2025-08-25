# FlareNet Frontend

This is the React frontend for the FlareNet Transformer Management System.

## Features

- **View Transformers**: Display all transformers in a table format with filtering capabilities
- **Add Transformers**: Create new transformers with all required fields
- **Edit Transformers**: Update existing transformer information
- **Delete Transformers**: Remove transformers with confirmation
- **View Details**: Detailed view of individual transformers with inspection history
- **Filtering**: Filter transformers by region and type
- **Inspection Management**: Complete CRUD operations for transformer inspections
- **Inspection Tracking**: Track inspection status, dates, and maintenance schedules

## Backend Integration

The frontend is now fully connected to the Spring Boot backend with the following API endpoints:

- `GET /api/transformers` - List all transformers
- `POST /api/transformers` - Create new transformer
- `GET /api/transformers/{id}` - Get transformer by ID
- `PUT /api/transformers/{id}` - Update transformer
- `DELETE /api/transformers/{id}` - Delete transformer

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Backend**:
   Make sure your Spring Boot backend is running on `http://localhost:8080`

3. **Start the Frontend**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   Open `http://localhost:5173` in your browser

## File Structure

- `src/services/api.js` - API service layer for backend communication
- `src/Pages/Homepage.jsx` - Dashboard with transformer overview
- `src/Pages/TransformerInfo.jsx` - Main transformer management interface
- `src/Pages/TransformerDetails.jsx` - Detailed transformer view

## Data Model

The frontend handles the following transformer fields:
- `transformerNo` (required) - Unique transformer number
- `region` - Geographic region
- `type` - Transformer type (Bulk/Distribution)
- `poleNo` - Pole number
- `capacityKVA` - Capacity in KVA

### Inspection Data Model
The frontend handles the following inspection fields:
- `inspectionNumber` (required) - Unique inspection number
- `inspectedDate` (required) - Date of inspection
- `maintenanceDate` - Scheduled maintenance date
- `status` - Inspection status (PENDING, IN_PROGRESS, COMPLETED, FAILED, CANCELLED)
- `transformerId` (required) - Reference to the transformer

## Error Handling

The application includes comprehensive error handling:
- Loading states with spinners
- Error messages for failed API calls
- Form validation
- Confirmation dialogs for destructive actions

## CORS Configuration

The backend is configured to allow CORS from `http://localhost:5173` (frontend dev server).
