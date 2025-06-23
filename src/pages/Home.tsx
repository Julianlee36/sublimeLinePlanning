import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="text-center p-10">
            <h1 className="text-3xl font-bold mb-4">Welcome to Ultimate Stats</h1>
            <p className="mb-6">Manage your teams, track games, and view detailed stats.</p>
            <Link 
                to="/admin" 
                className="bg-indigo-600 text-white font-bold py-2 px-4 rounded hover:bg-indigo-700"
            >
                Go to Your Teams Dashboard
            </Link>
        </div>
    );
};

export default Home; 