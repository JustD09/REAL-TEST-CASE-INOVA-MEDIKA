import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, requiredPermissions, requiredRoles }) {
  const { isAuthenticated, isLoading, hasPermission, hasRole, hasAnyPermission, hasAnyRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAccess = requiredPermissions.length === 1
      ? hasPermission(requiredPermissions[0])
      : hasAnyPermission(requiredPermissions);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.length === 1
      ? hasRole(requiredRoles[0])
      : hasAnyRole(requiredRoles);
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;