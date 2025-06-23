import { Link } from "react-router-dom";

const Home = () => {
    return (
        <div className="bg-gray-50 flex items-center justify-center -m-4">
            <div className="text-center p-20">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
                    Welcome to Ultimate Stats
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Manage your teams, track games, and view detailed stats with ease.
                </p>
                <Link 
                    to="/admin" 
                    className="bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-300"
                >
                    Go to Your Dashboard
                </Link>
            </div>
        </div>
    );
};

export default Home; 