import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Team } from "../types/team";

const Home = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                let firstName = null;
                if (user.user_metadata?.full_name) {
                    firstName = user.user_metadata.full_name.split(' ')[0];
                } else if (user.email) {
                    firstName = user.email.split('@')[0];
                }
                setUserName(firstName);
            }
        };
        fetchUser();
    }, []);

    return (
        <div className="bg-background flex items-center justify-center min-h-screen -m-4">
            <div className="text-center p-10 w-full max-w-lg space-y-12">
                <h1 className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
                    {`Welcome${userName ? ", " + userName : ", there"}!`}
                </h1>
                <p className="text-xl text-gray-600 mb-10">
                    Manage your teams, track games, and view detailed stats with ease.
                </p>
                <div className="space-y-8">
                    {/* Pick a team */}
                    <div className="bg-white rounded-2xl shadow-soft p-8">
                        <h2 className="text-2xl font-bold mb-4">Pick a Team</h2>
                        {loading ? (
                            <p>Loading teams...</p>
                        ) : error ? (
                            <p className="text-red-500">{error}</p>
                        ) : teams.length === 0 ? (
                            <p className="text-gray-500">No teams found. Create one below!</p>
                        ) : (
                            <ul className="space-y-3">
                                {teams.map(team => (
                                    <li key={team.id}>
                                        <Link to={`/team/${team.id}/menu`} className="block py-3 px-6 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold shadow transition">
                                            {team.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* Teams management */}
                    <div className="bg-white rounded-2xl shadow-soft p-8">
                        <h2 className="text-2xl font-bold mb-4">Teams</h2>
                        <Link to="/admin" className="block py-3 px-6 rounded-xl bg-green-50 hover:bg-green-100 text-green-900 font-semibold shadow transition">
                            Manage Teams & Players
                        </Link>
                    </div>
                    {/* Settings */}
                    <div className="bg-white rounded-2xl shadow-soft p-8">
                        <h2 className="text-2xl font-bold mb-4">Settings</h2>
                        <p className="text-gray-500">Settings functionality coming soon.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home; 