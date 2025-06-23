import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Layout = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
        } else {
            navigate('/'); // This will now lead to the AuthPage because the session is null
        }
    };

    return (
        <div>
            <nav className="bg-gray-800 text-white p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link to="/" className="font-bold text-xl">Stats App</Link>
                    <div className="flex gap-4">
                        <Link to="/roster" className="hover:underline">Roster</Link>
                        <Link to="/game/new" className="hover:underline">New Game</Link>
                        <Link to="/stats" className="hover:underline">Stats</Link>
                        <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded">Logout</button>
                    </div>
                </div>
            </nav>
            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout; 