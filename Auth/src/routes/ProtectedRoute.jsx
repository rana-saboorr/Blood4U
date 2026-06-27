import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';
import LoadingScreen from '../components/LoadingScreen';

export default function ProtectedRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, initialized } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchMe());
    }
  }, [dispatch, initialized]);

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  // If not authenticated, redirect to signin
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  // Else, render the child routes (e.g. Dashboard)
  return <Outlet />;
}
