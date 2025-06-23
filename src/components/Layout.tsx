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
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-6 flex justify-between items-center">
                    <Link to="/" className="text-2xl font-bold text-gray-800">Ultimate Stats</Link>
                    <button 
                        onClick={handleLogout} 
                        className="bg-red-500 text-white font-bold py-2 px-4 rounded hover:bg-red-700 transition duration-300"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <main className="p-4">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout; 