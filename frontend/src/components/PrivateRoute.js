import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { loading, authenticated } = useAuth();

  if (loading) {
    return <p className="text-center mt-5">Checking authentication...</p>;
  }

  if (!authenticated) {
    return <Navigate to="/login" state={{ message: "Please log in" }} replace />;
  }

  return children;
};

export default ProtectedRoute;
