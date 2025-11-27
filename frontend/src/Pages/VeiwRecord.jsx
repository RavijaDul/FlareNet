import React from 'react';
import { Box, Typography, Divider, Button, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress } from '@mui/material';
import { imagesAPI, annotationsAPI, maintenanceAPI } from '../services/api';

export default function VeiwRecord({ transformer = {}, inspection = null, onClose = () => {} }) {
  const rootRef = React.useRef(null);
  const { transformerNo, poleNo, region, type, capacityKVA, locationDetails } = transformer;
  const inspectionNumber = inspection?.inspectionNumber || inspection?.id || '';
  const inspectionDate = inspection?.inspectedDate || inspection?.inspectionDate || '';

  const [loading, setLoading] = React.useState(false);
  const [anomalies, setAnomalies] = React.useState([]);
  const [selectedThermalFile, setSelectedThermalFile] = React.useState(null);
  const [thermalImageUrl, setThermalImageUrl] = React.useState(null);
  const [maintenanceData, setMaintenanceData] = React.useState(null);
  const [maintenanceSource, setMaintenanceSource] = React.useState(null); // 'server', 'local', 'draft', etc.
  const [selectedBaselineFile, setSelectedBaselineFile] = React.useState(null);
  const [baselineImageUrl, setBaselineImageUrl] = React.useState(null);

  const mainImgRef = React.useRef(null);
  const [mainImgDims, setMainImgDims] = React.useState({
    naturalWidth: 0,
    naturalHeight: 0,
    renderedWidth: 0,
    renderedHeight: 0,
  });

  const updateMainDims = React.useCallback(() => {
    const img = mainImgRef.current;
    if (!img) return;
    setMainImgDims({
      naturalWidth: img.naturalWidth || 0,
      naturalHeight: img.naturalHeight || 0,
      renderedWidth: img.clientWidth || 0,
      renderedHeight: img.clientHeight || 0,
    });
  }, []);

  // Code-only offsets to tweak overlay placement. Adjust these numbers in code
  // to move all overlay boxes. You may also set per-anomaly offsets by adding
  // `offsetX` and/or `offsetY` to an anomaly object in the data.
  const OVERLAY_OFFSETS = { x: 0, y: 30 };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      const d = new Date(ts);
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleString();
    } catch (e) {
      return ts;
    }
  };

  React.useEffect(() => {
    const fetchAnomalies = async () => {
      if (!inspection || !transformer) return;
      setLoading(true);
      try {
        // Fetch baseline image (similar to Transformer.jsx)
        try {
          const baselineResp = await imagesAPI.getBaseline(transformer.id);
          if (baselineResp.data) {
            const b = baselineResp.data;
            setSelectedBaselineFile({ id: b.id, url: b.url, weather: b.weatherCondition });
            setBaselineImageUrl(b.url ? `http://localhost:8080${b.url}` : null);
          }
        } catch (e) {
          // ignore baseline fetch errors for record view
          console.warn('Failed to fetch baseline image', e);
        }

        // Fetch maintenance images for this inspection (Transformer.jsx did the same)
        const resp = await imagesAPI.getMaintenanceByInspection(transformer.id, inspection.id || inspection.inspectionID || inspection.inspectionId);
          if (resp.data && resp.data.length > 0) {
          const img = resp.data[0];
          setSelectedThermalFile({ id: img.id, url: img.url });
          // store the full URL (server expects prefix)
          setThermalImageUrl(img.url ? `http://localhost:8080${img.url}` : null);
          // Prefer server-side analysis if present
          let parsed = null;
          if (img.analysis) {
            try { parsed = JSON.parse(img.analysis); } catch (e) { console.warn('Failed to parse analysis', e); }
          }

          // then try user annotations that may override
          try {
            const annResp = await annotationsAPI.get(img.id);
            if (annResp.data && annResp.data.annotationsJson) {
              const userAnnotations = JSON.parse(annResp.data.annotationsJson);
              parsed = userAnnotations;
            }
          } catch (e) {
            // no annotations or failed parse
          }

          // parsed is expected to have an 'anomalies' array similar to Transformer.jsx
          if (parsed && Array.isArray(parsed.anomalies)) {
            setAnomalies(parsed.anomalies);
          } else {
            setAnomalies([]);
          }
        } else {
          setAnomalies([]);
        }
        // Fetch maintenance record using the same methods MaintenanceRecord.jsx relies on:
        // 1) Try server: getByTransformerAndInspection(transformerId, inspectionId)
        // 2) Then server: getByInspection(inspectionId)
        // 3) Fallbacks: localStorage key `maintenanceRecord_<inspectionId>`, then `maintenanceRecord_draft`, then `maintenanceRecord_latest`
        try {
          const insId = inspection?.id || inspection?.inspectionID || inspection?.inspectionId;
          let loaded = null;
          if (insId) {
            // Prefer the transformer+inspection API when transformer id is available
            if (transformer?.id) {
              try {
                const respTI = await maintenanceAPI.getByTransformerAndInspection(transformer.id, insId);
                if (respTI?.data && Array.isArray(respTI.data) && respTI.data.length > 0) {
                  const list = respTI.data;
                  const rec = list[list.length - 1];
                  let parsedRec = null;
                  try {
                    parsedRec = typeof rec.recordJson === 'string' ? JSON.parse(rec.recordJson) : (rec.recordJson || rec);
                  } catch (e) {
                    parsedRec = rec;
                  }
                  loaded = parsedRec;
                  setMaintenanceSource('server:transformer_inspection');
                }
              } catch (e) {
                // continue to next attempt
              }
            }

            if (!loaded) {
              try {
                const respI = await maintenanceAPI.getByInspection(insId);
                if (respI?.data) {
                  const list = Array.isArray(respI.data) ? respI.data : [respI.data];
                  if (list.length > 0) {
                    const rec = list[list.length - 1];
                    let parsedRec = null;
                    try {
                      parsedRec = typeof rec.recordJson === 'string' ? JSON.parse(rec.recordJson) : (rec.recordJson || rec);
                    } catch (e) {
                      parsedRec = rec;
                    }
                    loaded = parsedRec;
                    setMaintenanceSource('server:inspection');
                  }
                }
              } catch (e) {
                // server unavailable or error
              }
            }
          }

          // localStorage fallback: only use inspection-specific record.
          // Avoid using transformer/global/draft/latest fallbacks here so
          // inspections with no maintenance records render blank rather
          // than showing unrelated previous data.
          if (!loaded && insId) {
            try {
              const rawI = localStorage.getItem(`maintenanceRecord_${insId}`);
              if (rawI) {
                loaded = JSON.parse(rawI);
                setMaintenanceSource(`local:inspection:${insId}`);
              }
            } catch (e) {
              // ignore parse errors
            }
          }

          if (loaded) setMaintenanceData(loaded);
        } catch (e) {
          console.warn('Failed to resolve maintenance record from server or local storage', e);
        }
      } catch (err) {
        console.error('Error fetching anomalies for record view', err);
        setAnomalies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnomalies();
  }, [transformer, inspection]);

  // keep overlay in sync on load/resize
  React.useEffect(() => {
    if (!mainImgRef.current) return;
    const ro = new ResizeObserver(updateMainDims);
    ro.observe(mainImgRef.current);
    return () => ro.disconnect();
  }, [updateMainDims, thermalImageUrl]);

  return (
    <Box sx={{ p: 2 }} ref={rootRef} id="view-record-root">
      <Typography variant="h6" gutterBottom>
        Record Details
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
        <Typography variant="caption">Transformer No</Typography>
        <Typography variant="body1">{transformerNo || '-'}</Typography>

        <Typography variant="caption">Pole No</Typography>
        <Typography variant="body1">{poleNo || '-'}</Typography>

        <Typography variant="caption">Region</Typography>
        <Typography variant="body1">{region || '-'}</Typography>

        <Typography variant="caption">Type</Typography>
        <Typography variant="body1">{type || '-'}</Typography>

        <Typography variant="caption">Capacity (KVA)</Typography>
        <Typography variant="body1">{capacityKVA ?? '-'}</Typography>

        <Typography variant="caption">Location</Typography>
        <Typography variant="body1">{locationDetails || '-'}</Typography>

        <Typography variant="caption">Inspection Number</Typography>
        <Typography variant="body1">{inspectionNumber || '-'}</Typography>

        <Typography variant="caption">Inspection Date</Typography>
        <Typography variant="body1">{inspectionDate || '-'}</Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Detected / Annotated Anomalies</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Location (x,y,w,h)</TableCell>
              <TableCell>Severity / Confidence</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {anomalies.length ? anomalies.map((a, idx) => (
              <TableRow key={idx}>
                <TableCell>{a.label || a.type || a.category || '-'}</TableCell>
                <TableCell>{a.category || '-'}</TableCell>
                <TableCell>{a.bbox ? `${Math.round(a.bbox.x)}, ${Math.round(a.bbox.y)}, ${Math.round(a.bbox.width)}, ${Math.round(a.bbox.height)}` : '-'}</TableCell>
                <TableCell>{(a.severity ? a.severity + ' / ' : '') + (a.confidence !== undefined ? a.confidence.toFixed(2) : '')}</TableCell>
                <TableCell>{(a.confidence !== undefined && Number(a.confidence) === 1) ? 'User annotated' : 'AI detected'}</TableCell>
                <TableCell>{a.details || a.comment || (a.editReason || '')}</TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center' }}>No anomalies found for this record.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      {/* Maintenance record display (if available) */}
      {maintenanceData && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#fafafa', borderRadius: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Maintenance Record</Typography>
            <Typography variant="caption" color="text.secondary">{formatTimestamp(maintenanceData.timestamp || maintenanceData.date || maintenanceData.savedAt)}</Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Source: {maintenanceSource || 'unknown'}</Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            <Typography variant="subtitle2">Inspector</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.name || maintenanceData.inspectorName || maintenanceData.inspectedBy || '-'}</Typography>

            <Typography variant="subtitle2">Status</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.status || maintenanceData.status || maintenanceData.inspectorStatus || '-'}</Typography>

            <Typography variant="subtitle2">Voltage</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.voltage || maintenanceData.voltage || maintenanceData.voltageReading || '-'}</Typography>

            <Typography variant="subtitle2">Current</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.current || maintenanceData.current || maintenanceData.currentReading || '-'}</Typography>

            <Typography variant="subtitle2">Recommended Action</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.recommendedAction || maintenanceData.recommendedAction || maintenanceData.recommendation || '-'}</Typography>

            <Typography variant="subtitle2">Additional Remarks</Typography>
            <Typography variant="body2">{maintenanceData.inspector?.additionalRemarks || maintenanceData.additionalRemarks || maintenanceData.remarks || '-'}</Typography>
          </Box>

          {/* Rectification */}
          {maintenanceData.rectification && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Rectification</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                <Typography variant="subtitle2">Name</Typography>
                <Typography variant="body2">{maintenanceData.rectification.name || maintenanceData.rectifierName || '-'}</Typography>

                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="body2">{maintenanceData.rectification.status || maintenanceData.rectifierStatus || '-'}</Typography>

                <Typography variant="subtitle2">Voltage</Typography>
                <Typography variant="body2">{maintenanceData.rectification.voltage || maintenanceData.rectifierVoltage || '-'}</Typography>

                <Typography variant="subtitle2">Current</Typography>
                <Typography variant="body2">{maintenanceData.rectification.current || maintenanceData.rectifierCurrent || '-'}</Typography>

                <Typography variant="subtitle2">Remarks</Typography>
                <Typography variant="body2">{maintenanceData.rectification.additionalRemarks || maintenanceData.rectifierAdditionalRemarks || '-'}</Typography>
              </Box>
            </Box>
          )}

          {/* Re-inspection */}
          {maintenanceData.reinspection && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Re-inspection</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
                <Typography variant="subtitle2">Name</Typography>
                <Typography variant="body2">{maintenanceData.reinspection.name || maintenanceData.reinspectorName || '-'}</Typography>

                <Typography variant="subtitle2">Status</Typography>
                <Typography variant="body2">{maintenanceData.reinspection.status || maintenanceData.reinspectorStatus || '-'}</Typography>

                <Typography variant="subtitle2">Voltage</Typography>
                <Typography variant="body2">{maintenanceData.reinspection.voltage || maintenanceData.reinspectorVoltage || '-'}</Typography>

                <Typography variant="subtitle2">Current</Typography>
                <Typography variant="body2">{maintenanceData.reinspection.current || maintenanceData.reinspectorCurrent || '-'}</Typography>

                <Typography variant="subtitle2">Remarks</Typography>
                <Typography variant="body2">{maintenanceData.reinspection.additionalRemarks || maintenanceData.reinspectorAdditionalRemarks || '-'}</Typography>
              </Box>
            </Box>
          )}
        </Box>
      )}
              {(baselineImageUrl || thermalImageUrl) && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, alignItems: 'start' }}>
                    {/* Baseline */}
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Baseline</Typography>
                      {baselineImageUrl ? (
                        <img src={baselineImageUrl} alt="Baseline" crossOrigin="anonymous" style={{ width: '100%', maxWidth: 700, height: 'auto', borderRadius: 8 }} />
                      ) : (
                        <Typography variant="body2" color="textSecondary">No baseline available</Typography>
                      )}
                    </Box>

                    {/* Thermal with overlay */}
                    <Box sx={{ textAlign: 'center', position: 'relative', display: 'inline-block' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Maintenance</Typography>
                      {thermalImageUrl ? (
                        <img
                          ref={mainImgRef}
                          src={thermalImageUrl}
                          alt="Thermal"
                          crossOrigin="anonymous"
                          style={{ width: '100%', maxWidth: 700, height: 'auto', borderRadius: 8 }}
                          onLoad={updateMainDims}
                          draggable={false}
                        />
                      ) : (
                        <Typography variant="body2" color="textSecondary">No maintenance image available</Typography>
                      )}

                      {/* overlay boxes */}
                      {thermalImageUrl && anomalies && anomalies.filter(a => !a.isDeleted).map((a, idx) => {
                        const { naturalWidth, naturalHeight, renderedWidth, renderedHeight } = mainImgDims;
                        if (!naturalWidth || !naturalHeight || !renderedWidth || !renderedHeight) return null;
                        const { x, y, width: bw, height: bh } = a.bbox || { x: 0, y: 0, width: 0, height: 0 };
                        const sx = renderedWidth / naturalWidth;
                        const sy = renderedHeight / naturalHeight;
                        const anomalyOffsetX = (a.offsetX !== undefined ? a.offsetX : OVERLAY_OFFSETS.x);
                        const anomalyOffsetY = (a.offsetY !== undefined ? a.offsetY : OVERLAY_OFFSETS.y);
                        const left = x * sx + anomalyOffsetX;
                        const top = y * sy + anomalyOffsetY;
                        const w = bw * sx;
                        const h = bh * sy;
                        const isFaulty = (a.severity || '').toLowerCase().startsWith('faulty');
                        const color = isFaulty ? 'red' : 'gold';

                        return (
                          <React.Fragment key={idx}>
                            <div
                              style={{
                                position: 'absolute',
                                left,
                                top,
                                width: w,
                                height: h,
                                border: `2px solid ${color}`,
                                borderRadius: 4,
                                boxSizing: 'border-box',
                                pointerEvents: 'none',
                              }}
                            />

                            <div
                              style={{
                                position: 'absolute',
                                left,
                                top: Math.max(0, top - 22),
                                background: color,
                                color: isFaulty ? '#fff' : '#000',
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 4,
                                fontWeight: 700,
                                pointerEvents: 'none',
                              }}
                            >
                              #{idx + 1} {(a.confidence !== undefined) ? `(${(a.confidence).toFixed(2)})` : ''}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </Box>
                  </Box>
                </Box>
              )}

      <Box className="no-pdf" sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
        <Button variant="outlined" color="error" onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={async () => {
          try {
            const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
              import('html2canvas'),
              import('jspdf')
            ]);

            const element = rootRef.current;
            if (!element) {
              alert('Unable to capture view');
              return;
            }

            const canvas = await html2canvas(element, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              logging: false,
              windowWidth: document.documentElement.clientWidth,
              backgroundColor: '#ffffff',
              ignoreElements: (el) => el.classList && el.classList.contains('no-pdf'),
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF('p', 'pt', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
              position = heightLeft - imgHeight;
              pdf.addPage();
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
            }

            const name = `record_${inspection?.inspectionNumber || inspection?.id || 'view'}.pdf`;
            pdf.save(name);
          } catch (e) {
            console.warn('PDF export failed. Ensure html2canvas and jspdf are installed.', e);
            alert('PDF export requires html2canvas and jspdf. Please run: npm install html2canvas jspdf');
          }
        }}>Download PDF</Button>
      </Box>
    </Box>
  );
}
