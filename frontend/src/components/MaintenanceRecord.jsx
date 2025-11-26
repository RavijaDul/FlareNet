import React from 'react';
import { Box, TextField, Button, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

export default function MaintenanceRecord({ initialData = null, onSave = () => {}, onCancel = () => {} }) {
  const [inspectorName, setInspectorName] = React.useState(initialData?.inspectorName || initialData?.inspectedBy || '');
  const [status, setStatus] = React.useState(initialData?.status || 'OK');
  const [voltage, setVoltage] = React.useState(initialData?.voltage || '');
  const [current, setCurrent] = React.useState(initialData?.current || '');
  const [recommendedAction, setRecommendedAction] = React.useState(initialData?.recommendedAction || '');
  const [additionalRemarks, setAdditionalRemarks] = React.useState(initialData?.additionalRemarks || '');
  const [timestamp, setTimestamp] = React.useState(initialData?.timestamp || new Date().toLocaleString());
  // Rectification fields
  const [rectifierName, setRectifierName] = React.useState(initialData?.rectifierName || initialData?.rectification?.rectifierName || '');
  const [rectifierStatus, setRectifierStatus] = React.useState(initialData?.rectifierStatus || initialData?.rectification?.status || 'OK');
  const [rectifierVoltage, setRectifierVoltage] = React.useState(initialData?.rectifierVoltage || initialData?.rectification?.voltage || '');
  const [rectifierCurrent, setRectifierCurrent] = React.useState(initialData?.rectifierCurrent || initialData?.rectification?.current || '');
  const [rectifierRecommendedAction, setRectifierRecommendedAction] = React.useState(initialData?.rectifierRecommendedAction || initialData?.rectification?.recommendedAction || '');
  const [rectifierAdditionalRemarks, setRectifierAdditionalRemarks] = React.useState(initialData?.rectifierAdditionalRemarks || initialData?.rectification?.additionalRemarks || '');
  const [rectifierTimestamp, setRectifierTimestamp] = React.useState(initialData?.rectifierTimestamp || initialData?.rectification?.timestamp || '');
  // Re-inspection fields
  const [reinspectorName, setReinspectorName] = React.useState(initialData?.reinspectorName || initialData?.reinspection?.reinspectorName || '');
  const [reinspectorStatus, setReinspectorStatus] = React.useState(initialData?.reinspectorStatus || initialData?.reinspection?.status || 'OK');
  const [reinspectorVoltage, setReinspectorVoltage] = React.useState(initialData?.reinspectorVoltage || initialData?.reinspection?.voltage || '');
  const [reinspectorCurrent, setReinspectorCurrent] = React.useState(initialData?.reinspectorCurrent || initialData?.reinspection?.current || '');
  const [reinspectorRecommendedAction, setReinspectorRecommendedAction] = React.useState(initialData?.reinspectorRecommendedAction || initialData?.reinspection?.recommendedAction || '');
  const [reinspectorAdditionalRemarks, setReinspectorAdditionalRemarks] = React.useState(initialData?.reinspectorAdditionalRemarks || initialData?.reinspection?.additionalRemarks || '');
  const [reinspectorTimestamp, setReinspectorTimestamp] = React.useState(initialData?.reinspectorTimestamp || initialData?.reinspection?.timestamp || '');

  // Keep form state in sync when parent provides/updates `initialData` (e.g. when opening in edit mode)
  React.useEffect(() => {
    if (initialData) {
      // Accept both flattened and nested payload shapes
      setInspectorName(
        initialData.inspector?.name || initialData.inspectorName || initialData.inspectedBy || ''
      );
      setStatus(
        initialData.status || initialData.inspector?.status || 'OK'
      );
      setVoltage(
        initialData.voltage || initialData.inspector?.voltage || ''
      );
      setCurrent(
        initialData.current || initialData.inspector?.current || ''
      );
      setRecommendedAction(
        initialData.recommendedAction || initialData.inspector?.recommendedAction || ''
      );
      setAdditionalRemarks(
        initialData.additionalRemarks || initialData.inspector?.additionalRemarks || ''
      );
      setTimestamp(
        initialData.timestamp || initialData.inspector?.timestamp || new Date().toLocaleString()
      );
      // rectification
      setRectifierName(
        initialData.rectification?.name || initialData.rectifierName || initialData.rectification?.rectifierName || ''
      );
      setRectifierStatus(
        initialData.rectification?.status || initialData.rectifierStatus || 'OK'
      );
      setRectifierVoltage(
        initialData.rectification?.voltage || initialData.rectifierVoltage || ''
      );
      setRectifierCurrent(
        initialData.rectification?.current || initialData.rectifierCurrent || ''
      );
      setRectifierRecommendedAction(
        initialData.rectification?.recommendedAction || initialData.rectifierRecommendedAction || ''
      );
      setRectifierAdditionalRemarks(
        initialData.rectification?.additionalRemarks || initialData.rectifierAdditionalRemarks || ''
      );
      setRectifierTimestamp(
        initialData.rectification?.timestamp || initialData.rectifierTimestamp || ''
      );
      // re-inspection
      setReinspectorName(
        initialData.reinspection?.name || initialData.reinspectorName || ''
      );
      setReinspectorStatus(
        initialData.reinspection?.status || initialData.reinspectorStatus || 'OK'
      );
      setReinspectorVoltage(
        initialData.reinspection?.voltage || initialData.reinspectorVoltage || ''
      );
      setReinspectorCurrent(
        initialData.reinspection?.current || initialData.reinspectorCurrent || ''
      );
      setReinspectorRecommendedAction(
        initialData.reinspection?.recommendedAction || initialData.reinspectorRecommendedAction || ''
      );
      setReinspectorAdditionalRemarks(
        initialData.reinspection?.additionalRemarks || initialData.reinspectorAdditionalRemarks || ''
      );
      setReinspectorTimestamp(
        initialData.reinspection?.timestamp || initialData.reinspectorTimestamp || ''
      );
    } else {
      // When no initialData (add mode) try to restore a previously-saved
      // maintenance record from localStorage so the user doesn't lose data
      // between dialog opens. Falls back to blank defaults if nothing saved.
      try {
        // Prefer transformer/inspection-specific key if initialData had ids
        const candidateKeys = ['maintenanceRecord_latest'];
        const rawLatest = localStorage.getItem('maintenanceRecord_latest');
        if (rawLatest) candidateKeys.unshift('maintenanceRecord_latest');

        // also try to derive a transformer-specific key if available on initialData
        // (initialData is null here, but parent may pass ids in other flows)
        // fallback: check any 'maintenanceRecord_' keys available
        let loaded = null;
        // try draft first (unsaved user input)
        const rawDraft = localStorage.getItem('maintenanceRecord_draft');
        if (rawDraft) {
          try { loaded = JSON.parse(rawDraft); } catch (e) { /* ignore parse errors */ }
        }

        // try explicit keys next (transformer/inspection specific)
        if (!loaded) {
          const explicitKey = initialData?.transformerId || initialData?.inspectionID || initialData?.inspectionId || null;
          if (explicitKey) {
            const k = `maintenanceRecord_${explicitKey}`;
            const raw = localStorage.getItem(k);
            if (raw) loaded = JSON.parse(raw);
          }
        }

        // finally try 'maintenanceRecord_latest'
        if (!loaded) {
          const raw = localStorage.getItem('maintenanceRecord_latest');
          if (raw) loaded = JSON.parse(raw);
        }

        if (loaded) {
          // populate fields from nested payload structure
          setInspectorName(loaded.inspector?.name || '');
          setStatus(loaded.inspector?.status || 'OK');
          setVoltage(loaded.inspector?.voltage || '');
          setCurrent(loaded.inspector?.current || '');
          setRecommendedAction(loaded.inspector?.recommendedAction || '');
          setAdditionalRemarks(loaded.inspector?.additionalRemarks || '');
          setTimestamp(loaded.timestamp || new Date().toLocaleString());

          // rectification
          setRectifierName(loaded.rectification?.name || '');
          setRectifierStatus(loaded.rectification?.status || 'OK');
          setRectifierVoltage(loaded.rectification?.voltage || '');
          setRectifierCurrent(loaded.rectification?.current || '');
          setRectifierRecommendedAction(loaded.rectification?.recommendedAction || '');
          setRectifierAdditionalRemarks(loaded.rectification?.additionalRemarks || '');
          setRectifierTimestamp(loaded.rectification?.timestamp || '');

          // re-inspection
          setReinspectorName(loaded.reinspection?.name || '');
          setReinspectorStatus(loaded.reinspection?.status || 'OK');
          setReinspectorVoltage(loaded.reinspection?.voltage || '');
          setReinspectorCurrent(loaded.reinspection?.current || '');
          setReinspectorRecommendedAction(loaded.reinspection?.recommendedAction || '');
          setReinspectorAdditionalRemarks(loaded.reinspection?.additionalRemarks || '');
          setReinspectorTimestamp(loaded.reinspection?.timestamp || '');
        } else {
          // no saved record found -> clear to blanks
          setInspectorName('');
          setStatus('OK');
          setVoltage('');
          setCurrent('');
          setRecommendedAction('');
          setAdditionalRemarks('');
          setTimestamp(new Date().toLocaleString());
          // rectification defaults
          setRectifierName('');
          setRectifierStatus('OK');
          setRectifierVoltage('');
          setRectifierCurrent('');
          setRectifierRecommendedAction('');
          setRectifierAdditionalRemarks('');
          setRectifierTimestamp('');
          // re-inspection defaults
          setReinspectorName('');
          setReinspectorStatus('OK');
          setReinspectorVoltage('');
          setReinspectorCurrent('');
          setReinspectorRecommendedAction('');
          setReinspectorAdditionalRemarks('');
          setReinspectorTimestamp('');
        }
      } catch (err) {
        console.warn('Failed to read saved maintenance record', err);
        // fallback to defaults
        setInspectorName('');
        setStatus('OK');
        setVoltage('');
        setCurrent('');
        setRecommendedAction('');
        setAdditionalRemarks('');
        setTimestamp(new Date().toLocaleString());
      }
    }
  }, [initialData]);

  // Auto-save a draft of the current form so closing the dialog without
  // pressing Save doesn't lose user input. Debounce writes to avoid
  // thrashing localStorage.
  React.useEffect(() => {
    let timer = null;
    try {
      const saveDraft = () => {
        const draft = {
          timestamp,
          inspector: {
            name: inspectorName,
            status,
            voltage,
            current,
            recommendedAction,
            additionalRemarks,
          },
          rectification: {
            name: rectifierName,
            status: rectifierStatus,
            voltage: rectifierVoltage,
            current: rectifierCurrent,
            recommendedAction: rectifierRecommendedAction,
            additionalRemarks: rectifierAdditionalRemarks,
            timestamp: rectifierTimestamp,
          },
          reinspection: {
            name: reinspectorName,
            status: reinspectorStatus,
            voltage: reinspectorVoltage,
            current: reinspectorCurrent,
            recommendedAction: reinspectorRecommendedAction,
            additionalRemarks: reinspectorAdditionalRemarks,
            timestamp: reinspectorTimestamp,
          },
        };
        localStorage.setItem('maintenanceRecord_draft', JSON.stringify(draft));
      };

      // debounce by 600ms
      timer = setTimeout(saveDraft, 600);
    } catch (err) {
      console.warn('Failed to write maintenance draft', err);
    }

    return () => {
      if (timer) clearTimeout(timer);
      // final save on unmount so quick closes still persist state
      try {
        const draft = {
          timestamp,
          inspector: {
            name: inspectorName,
            status,
            voltage,
            current,
            recommendedAction,
            additionalRemarks,
          },
          rectification: {
            name: rectifierName,
            status: rectifierStatus,
            voltage: rectifierVoltage,
            current: rectifierCurrent,
            recommendedAction: rectifierRecommendedAction,
            additionalRemarks: rectifierAdditionalRemarks,
            timestamp: rectifierTimestamp,
          },
          reinspection: {
            name: reinspectorName,
            status: reinspectorStatus,
            voltage: reinspectorVoltage,
            current: reinspectorCurrent,
            recommendedAction: reinspectorRecommendedAction,
            additionalRemarks: reinspectorAdditionalRemarks,
            timestamp: reinspectorTimestamp,
          },
        };
        localStorage.setItem('maintenanceRecord_draft', JSON.stringify(draft));
      } catch (e) {
        /* ignore */
      }
    };
  // include all form fields in deps so drafts update when user types
  }, [timestamp, inspectorName, status, voltage, current, recommendedAction, additionalRemarks,
      rectifierName, rectifierStatus, rectifierVoltage, rectifierCurrent, rectifierRecommendedAction, rectifierAdditionalRemarks, rectifierTimestamp,
      reinspectorName, reinspectorStatus, reinspectorVoltage, reinspectorCurrent, reinspectorRecommendedAction, reinspectorAdditionalRemarks, reinspectorTimestamp
  ]);

  // No backend fetch in this component (API changes undone)

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      inspectionID: initialData?.inspectionID || initialData?.inspectionId || initialData?.id || undefined,
      transformerId: initialData?.transformerId || initialData?.transformerID || undefined,
      timestamp,
      inspector: {
        name: inspectorName,
        status,
        voltage,
        current,
        recommendedAction,
        additionalRemarks,
      },
      rectification: {
        name: rectifierName,
        status: rectifierStatus,
        voltage: rectifierVoltage,
        current: rectifierCurrent,
        recommendedAction: rectifierRecommendedAction,
        additionalRemarks: rectifierAdditionalRemarks,
        timestamp: rectifierTimestamp || undefined,
      },
      reinspection: {
        name: reinspectorName,
        status: reinspectorStatus,
        voltage: reinspectorVoltage,
        current: reinspectorCurrent,
        recommendedAction: reinspectorRecommendedAction,
        additionalRemarks: reinspectorAdditionalRemarks,
        timestamp: reinspectorTimestamp || undefined,
      },
    };

    // Persist locally so data survives a reload (keyed by transformer if available)
    try {
      const key = `maintenanceRecord_${payload.transformerId || payload.inspectionID || 'global'}`;
      localStorage.setItem(key, JSON.stringify(payload));
      // also keep a generic key for quick lookup
      localStorage.setItem('maintenanceRecord_latest', JSON.stringify(payload));
      // remove any in-progress draft now that user pressed Save
      try { localStorage.removeItem('maintenanceRecord_draft'); } catch (e) { /* ignore */ }
    } catch (err) {
      console.warn('Failed to persist maintenance record to localStorage', err);
    }

    // Call parent onSave with local payload
    onSave(payload);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
      <Typography variant="h6">{initialData ? 'Edit Maintenance Record' : 'Add Maintenance Record'}</Typography>
      <Typography variant="subtitle2" color="text.secondary">{timestamp}</Typography>

      <TextField
        label="Inspector name"
        value={inspectorName}
        onChange={(e) => setInspectorName(e.target.value)}
        size="small"
        fullWidth
      />

      <FormControl fullWidth size="small">
        <InputLabel id="status-select-label">Status of transformer</InputLabel>
        <Select
          labelId="status-select-label"
          id="status-select"
          value={status}
          label="Status of transformer"
          onChange={(e) => setStatus(e.target.value)}
        >
          <MenuItem value="OK">OK</MenuItem>
          <MenuItem value="Needs Maintenance">Needs Maintenance</MenuItem>
          <MenuItem value="Urgent Attention">Urgent Attention</MenuItem>
        </Select>
      </FormControl>

      <Typography variant="subtitle2">Electrical readings</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Voltage"
          value={voltage}
          onChange={(e) => setVoltage(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Current"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          size="small"
          fullWidth
        />
      </Stack>

      <TextField
        label="Recommended action"
        value={recommendedAction}
        onChange={(e) => setRecommendedAction(e.target.value)}
        size="small"
        fullWidth
      />

      <TextField
        label="Additional remarks"
        value={additionalRemarks}
        onChange={(e) => setAdditionalRemarks(e.target.value)}
        size="small"
        multiline
        rows={3}
        fullWidth
      />

      {/* Rectification section */}
      <Typography variant="h6" sx={{ mt: 2 }}>Rectification</Typography>
      <Typography variant="subtitle2" color="text.secondary">{rectifierTimestamp}</Typography>
      <TextField
        label="Rectifier name"
        value={rectifierName}
        onChange={(e) => setRectifierName(e.target.value)}
        size="small"
        fullWidth
      />
      <FormControl fullWidth size="small">
        <InputLabel id="rectifier-status-select-label">Status after rectification</InputLabel>
        <Select
          labelId="rectifier-status-select-label"
          id="rectifier-status-select"
          value={rectifierStatus}
          label="Status after rectification"
          onChange={(e) => setRectifierStatus(e.target.value)}
        >
          <MenuItem value="OK">OK</MenuItem>
          <MenuItem value="Needs Maintenance">Needs Maintenance</MenuItem>
          <MenuItem value="Urgent Attention">Urgent Attention</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="subtitle2">Electrical readings (rectification)</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Voltage"
          value={rectifierVoltage}
          onChange={(e) => setRectifierVoltage(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Current"
          value={rectifierCurrent}
          onChange={(e) => setRectifierCurrent(e.target.value)}
          size="small"
          fullWidth
        />
      </Stack>
      <TextField
        label="Recommended action (rectification)"
        value={rectifierRecommendedAction}
        onChange={(e) => setRectifierRecommendedAction(e.target.value)}
        size="small"
        fullWidth
      />
      <TextField
        label="Additional remarks (rectification)"
        value={rectifierAdditionalRemarks}
        onChange={(e) => setRectifierAdditionalRemarks(e.target.value)}
        size="small"
        multiline
        rows={3}
        fullWidth
      />

      {/* Re-inspection section */}
      <Typography variant="h6" sx={{ mt: 2 }}>Re-inspection</Typography>
      <Typography variant="subtitle2" color="text.secondary">{reinspectorTimestamp}</Typography>
      <TextField
        label="Re-inspector name"
        value={reinspectorName}
        onChange={(e) => setReinspectorName(e.target.value)}
        size="small"
        fullWidth
      />
      <FormControl fullWidth size="small">
        <InputLabel id="reinspector-status-select-label">Status after re-inspection</InputLabel>
        <Select
          labelId="reinspector-status-select-label"
          id="reinspector-status-select"
          value={reinspectorStatus}
          label="Status after re-inspection"
          onChange={(e) => setReinspectorStatus(e.target.value)}
        >
          <MenuItem value="OK">OK</MenuItem>
          <MenuItem value="Needs Maintenance">Needs Maintenance</MenuItem>
          <MenuItem value="Urgent Attention">Urgent Attention</MenuItem>
        </Select>
      </FormControl>
      <Typography variant="subtitle2">Electrical readings (re-inspection)</Typography>
      <Stack direction="row" spacing={1}>
        <TextField
          label="Voltage"
          value={reinspectorVoltage}
          onChange={(e) => setReinspectorVoltage(e.target.value)}
          size="small"
          fullWidth
        />
        <TextField
          label="Current"
          value={reinspectorCurrent}
          onChange={(e) => setReinspectorCurrent(e.target.value)}
          size="small"
          fullWidth
        />
      </Stack>
      <TextField
        label="Recommended action (re-inspection)"
        value={reinspectorRecommendedAction}
        onChange={(e) => setReinspectorRecommendedAction(e.target.value)}
        size="small"
        fullWidth
      />
      <TextField
        label="Additional remarks (re-inspection)"
        value={reinspectorAdditionalRemarks}
        onChange={(e) => setReinspectorAdditionalRemarks(e.target.value)}
        size="small"
        multiline
        rows={3}
        fullWidth
      />

      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Button variant="outlined" size="small" onClick={onCancel}>Cancel</Button>
        <Button variant="contained" size="small" type="submit">Save</Button>
      </Stack>
    </Box>
  );
}
