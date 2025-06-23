import { Outlet, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Layout = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div>
            <header className="bg-white shadow">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="text-lg font-semibold text-gray-800">Ultimate Stats</Link>
                    <button 
                        onClick={handleBack} 
                        className="bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded hover:bg-gray-300 transition duration-300"
                    >
                        Back
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