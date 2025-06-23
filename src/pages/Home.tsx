import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Team } from "../types/team";

const Home = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('teams')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setTeams(data || []);
            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTeams();
    }, []);

    return (
        <div className="bg-gray-50 flex items-center justify-center min-h-screen -m-4">
            <div className="text-center p-8 w-full max-w-md">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
                    Welcome to Ultimate Stats
                </h1>
                <p className="text-lg text-gray-600 mb-8">
                    Manage your teams, track games, and view detailed stats with ease.
                </p>
                <div className="space-y-8">
                    {/* Pick a team */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-2">Pick a Team</h2>
                        {loading ? (
                            <p>Loading teams...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : teams.length === 0 ? (
                            <p className="text-gray-500">No teams found. Create one below!</p>
                        ) : (
                            <ul className="space-y-2">
                                {teams.map(team => (
                                    <li key={team.id}>
                                        <Link to={`/team/${team.id}/menu`} className="block py-2 px-4 rounded bg-indigo-100 hover:bg-indigo-200 text-indigo-800 font-medium transition">
                                            {team.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Teams management */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-2">Teams</h2>
                        <Link to="/admin" className="block py-2 px-4 rounded bg-green-100 hover:bg-green-200 text-green-800 font-medium transition">
                            Manage Teams & Players
                        </Link>
                    </div>
                    {/* Settings */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold mb-2">Settings</h2>
                        <p className="text-gray-500">Settings functionality coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 