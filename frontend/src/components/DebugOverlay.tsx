import React, { useState, useEffect } from 'react';
import { 
  Fab, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  TextField
} from '@mui/material';
import { 
  BugReport, 
  ExpandMore, 
  Close,
  Info,
  Storage
} from '@mui/icons-material';

interface DebugLog {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

const DebugOverlay: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [isDebugMode, setIsDebugMode] = useState(false);

  useEffect(() => {
    // Check if debug mode is enabled via URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';
    setIsDebugMode(debugMode);

    if (debugMode) {
      // Override console methods to capture logs
      const originalLog = console.log;
      const originalWarn = console.warn;
      const originalError = console.error;

      console.log = (...args) => {
        addLog('info', args.join(' '));
        originalLog(...args);
      };

      console.warn = (...args) => {
        addLog('warn', args.join(' '));
        originalWarn(...args);
      };

      console.error = (...args) => {
        addLog('error', args.join(' '));
        originalError(...args);
      };

      // Add initial debug info
      addLog('info', 'Debug mode enabled');
      addLog('info', `User Agent: ${navigator.userAgent}`);
      addLog('info', `API URL: ${process.env.REACT_APP_API_URL || 'localhost:3002'}`);

      return () => {
        console.log = originalLog;
        console.warn = originalWarn;
        console.error = originalError;
      };
    }
  }, []);

  const addLog = (level: DebugLog['level'], message: string, data?: any) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev.slice(-99), log]); // Keep last 100 logs
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const getEnvironmentInfo = () => {
    return {
      'API URL': process.env.REACT_APP_API_URL || 'localhost:3002',
      'Google Client ID': process.env.REACT_APP_GOOGLE_CLIENT_ID?.substring(0, 20) + '...' || 'Not set',
      'Environment': process.env.REACT_APP_ENVIRONMENT || 'development',
      'Build SHA': process.env.REACT_APP_BUILD_SHA || 'dev',
      'Build Timestamp': process.env.REACT_APP_BUILD_TIMESTAMP || 'unknown',
      'User Agent': navigator.userAgent,
      'Screen Size': `${window.screen.width}x${window.screen.height}`,
      'Viewport Size': `${window.innerWidth}x${window.innerHeight}`,
      'Local Storage': Object.keys(localStorage).length + ' items',
      'Session Storage': Object.keys(sessionStorage).length + ' items'
    };
  };

  const getLogColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'error';
      case 'warn': return 'warning';
      case 'info': return 'info';
      case 'debug': return 'default';
      default: return 'default';
    }
  };

  if (!isDebugMode) {
    return null;
  }

  return (
    <>
      {/* Debug FAB */}
      <Fab
        color="secondary"
        size="small"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          opacity: 0.7,
          '&:hover': { opacity: 1 }
        }}
      >
        <BugReport />
      </Fab>

      {/* Debug Dialog */}
      <Dialog 
        open={isOpen} 
        onClose={() => setIsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: '80vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BugReport color="secondary" />
          Debug Console
          <Chip label={`${logs.length} logs`} size="small" />
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Info />
                <Typography>Environment Info</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {Object.entries(getEnvironmentInfo()).map(([key, value]) => (
                  <Box key={key} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight="bold">{key}:</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', maxWidth: '60%' }}>
                      {value}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Storage />
                <Typography>Console Logs ({logs.length})</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails sx={{ maxHeight: 300, overflow: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption">Latest logs (max 100)</Typography>
                <Button size="small" onClick={clearLogs}>Clear</Button>
              </Box>
              {logs.map((log, index) => (
                <Box key={index} sx={{ mb: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip 
                      label={log.level.toUpperCase()} 
                      size="small" 
                      color={getLogColor(log.level)}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                    {log.message}
                  </Typography>
                  {log.data && (
                    <TextField
                      multiline
                      fullWidth
                      value={JSON.stringify(log.data, null, 2)}
                      variant="outlined"
                      size="small"
                      InputProps={{ readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.7rem' } }}
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}
              {logs.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  No logs yet. Interact with the app to see debug information.
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setIsOpen(false)} startIcon={<Close />}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DebugOverlay;