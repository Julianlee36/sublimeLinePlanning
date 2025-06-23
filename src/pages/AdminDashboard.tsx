import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Team } from '../types/team';

const AdminDashboard = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [teamName, setTeamName] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTeams();
    }, []);

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

    const handleCreateTeam = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        try {
            const { data, error } = await supabase
                .from('teams')
                .insert({ name: teamName })
                .select()
                .single();
            
            if (error) throw error;

            setTeams(prevTeams => [data, ...prevTeams]);
            setTeamName('');
        } catch (error: any) {
            setError(error.message);
        }
    };

    return (
        <div className="min-h-screen bg-background py-10">
            <div className="container mx-auto max-w-2xl p-6">
                <h1 className="text-4xl font-extrabold mb-10 text-gray-900 tracking-tight">Admin - Manage Teams</h1>

                <div className="bg-white p-8 rounded-2xl shadow-soft mb-12">
                    <h2 className="text-2xl font-bold mb-4">Create New Team</h2>
                    <form onSubmit={handleCreateTeam} className="flex flex-col sm:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Enter team name"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            className="flex-grow block w-full rounded-xl border-gray-200 shadow focus:border-indigo-400 focus:ring-indigo-400 text-lg p-3"
                            required
                        />
                        <button type="submit" className="inline-flex justify-center py-3 px-8 rounded-xl text-white font-bold bg-indigo-600 shadow hover:bg-indigo-700 transition">
                            Create Team
                        </button>
                    </form>
                    {error && <p className="text-red-500 mt-2">{error}</p>}
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Your Teams</h2>
                    {loading ? (
                        <p>Loading teams...</p>
                    ) : (
                        <div className="space-y-4">
                            {teams.map(team => (
                                <Link 
                                    to={`/admin/team/${team.id}`} 
                                    key={team.id}
                                    className="block p-6 bg-white hover:bg-gray-50 shadow-soft rounded-2xl text-lg font-semibold text-indigo-900 transition"
                                >
                                    {team.name}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
