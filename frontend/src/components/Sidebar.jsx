import React from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemText, Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

function Sidebar({ mobileOpen, handleDrawerToggle }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const drawer = (
    <Box sx={{ width: drawerWidth, p: 2 }}>
      {/* Top section with image and name */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <img
          src="/tras.png"
          alt="Flarenet Icon"
          style={{ width: 40, height: 40, marginRight: 10 }}
        />
        <Typography variant="h6" component="div">
          Flarenet
        </Typography>
      </Box>

      {/* Buttons */}
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/transformer')}>
            <ListItemText primary="Transformer" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/')}>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box component="nav">
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
    </Box>
  );
}

export default Sidebar;
