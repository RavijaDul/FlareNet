import React from 'react'
import { useContext } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

export default function RequireAuth({ children }) {
  const { user } = useContext(AuthContext)
  const location = useLocation()

  if (!user) {
    // Redirect to login, preserve the attempted location for post-login redirect if desired
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
