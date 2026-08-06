import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
    }

    // Si no hay usuario, redirigir a la página de login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Verificamos si la ruta requiere un rol específico
    if (requiredRole && user.role && user.role.toLowerCase() !== 'maestro' && user.role.toLowerCase() !== requiredRole.toLowerCase()) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
            <h2>Acceso Denegado</h2>
            <p>Se requieren permisos de {requiredRole} para ver esta página.</p>
        </div>;
    }

    // Si está autenticado y tiene permisos, renderiza la ruta correspondiente
    return children;
};

export default ProtectedRoute;
