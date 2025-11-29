import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";

import { AuthContext } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Grid
      container
      component="main"
      sx={{ height: '100vh' }}
      alignItems="center"
      justifyContent="center"
    >
      <Grid item xs={11} sm={9} md={6} lg={4}>
        <Paper elevation={8} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <LockOutlinedIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              Sign in to FlareNet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Enter your username and password to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ width: '100%', mt: 2 }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <TextField
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 2 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 1, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign In'}
              </Button>

              {/* <Grid container>
                <Grid item xs>
                  <Link href="#" variant="body2">Forgot password?</Link>
                </Grid>
                <Grid item>
                  <Link href="#" variant="body2">Don't have an account? Contact admin</Link>
                </Grid>
              </Grid> */}
            </Box>

            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
              To sign in as an engineer: use <strong>engineer1</strong> or <strong>engineer2</strong> as the username and <strong>engineer</strong> as the password.
              <br />
              To sign in as an inspector: use <strong>inspector1</strong> or <strong>inspector2</strong> as the username and <strong>inspector</strong> as the password.
            </Typography>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}
