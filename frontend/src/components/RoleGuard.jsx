import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth'; // You'll create this to get user from JWT

const RoleGuard = ({ children, allowedRoles }) => {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;
    
    if (user.is_first_login) return <Navigate to="/change-password" />;

    const hasAccess = user.roles.some(role => allowedRoles.includes(role));

    return hasAccess ? children : <Navigate to="/unauthorized" />;
};

export default RoleGuard;