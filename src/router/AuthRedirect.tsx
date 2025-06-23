import { Navigate, Outlet } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';

interface AuthRedirectProps {
    session: Session | null;
}

const AuthRedirect = ({ session }: AuthRedirectProps) => {
    if (session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AuthRedirect; 