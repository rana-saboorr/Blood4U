import { Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from '../features/auth/authSlice';
import LoadingScreen from '../components/LoadingScreen';

export default function PublicRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated, role, initialized, loading } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!initialized) {
      dispatch(fetchMe());
    }
  }, [dispatch, initialized]);

  if (loading || !initialized) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to={role === 'admin' ? '/dashboard/admin' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
