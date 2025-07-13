import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Code, Schedule } from '@mui/icons-material';

interface BuildInfoProps {
  position?: 'header' | 'footer';
}

const BuildInfo: React.FC<BuildInfoProps> = ({ position = 'footer' }) => {
  // Build info will be injected during build process
  const buildInfo = {
    sha: process.env.REACT_APP_BUILD_SHA || 'dev',
    timestamp: process.env.REACT_APP_BUILD_TIMESTAMP || new Date().toISOString(),
    branch: process.env.REACT_APP_BUILD_BRANCH || 'dev'
  };

  // Convert UTC timestamp to PST
  const buildDate = new Date(buildInfo.timestamp);
  const pstDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(buildDate);

  const shortSha = buildInfo.sha.substring(0, 7);

  if (position === 'header') {
    return (
      <Box 
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white', 
          p: 0.5, 
          textAlign: 'center',
          fontSize: '0.75rem'
        }}
      >
        <Typography variant="caption">
          Build: {shortSha} • {pstDate} PST • {buildInfo.branch}
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        mt: 4,
        p: 2, 
        bgcolor: 'grey.100', 
        borderTop: 1, 
        borderColor: 'grey.300',
        textAlign: 'center'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Chip 
          icon={<Code />} 
          label={`Build: ${shortSha}`} 
          size="small" 
          variant="outlined"
        />
        <Chip 
          icon={<Schedule />} 
          label={`${pstDate} PST`} 
          size="small" 
          variant="outlined"
        />
        <Chip 
          label={buildInfo.branch} 
          size="small" 
          color={buildInfo.branch === 'main' ? 'success' : 'primary'}
          variant="outlined"
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        LPLivings Store • Deployed via GitHub Actions
      </Typography>
    </Box>
  );
};

export default BuildInfo;