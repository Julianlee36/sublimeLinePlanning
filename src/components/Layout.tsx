import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleBack = () => {
        navigate(-1);
    };

    // Don't render header on home page
    const isHome = location.pathname === '/';

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {!isHome && (
                <header className="bg-white shadow-soft rounded-b-2xl">
                    <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
                        <Link to="/" className="text-2xl font-extrabold text-gray-900 tracking-tight">Ultimate Stats</Link>
                        <button 
                            onClick={handleBack} 
                            className="bg-gray-900 text-white font-semibold py-2 px-6 rounded-xl shadow hover:bg-gray-700 transition duration-200"
                        >
                            Back
                        </button>
                    </div>
                </header>
            )}
            <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-10">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout; 