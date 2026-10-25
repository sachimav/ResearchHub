import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentUser, onAuthStateChanged } from '../services/session';

export default function ProtectedRoute({ role, children }) {
  const location = useLocation();
  const [user, setUser] = useState(getCurrentUser);
  useEffect(() => onAuthStateChanged(setUser), []);
  if (!user || (role && user.role !== role)) {
    const loginPath = role
      ? `/login?role=${role}`
      : `/login?redirect=${encodeURIComponent(location.pathname + location.search + location.hash)}`;
    return <Navigate to={loginPath} replace />;
  }
  return children;
}
