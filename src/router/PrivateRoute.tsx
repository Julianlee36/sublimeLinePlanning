import { Navigate, Outlet } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

interface PrivateRouteProps {
    session: Session | null;
}

const PrivateRoute = ({ session }: PrivateRouteProps) => {
    if (!session) {
        return <Navigate to="/auth" replace />;
    }

    return <Outlet />;
};

export default PrivateRoute; 