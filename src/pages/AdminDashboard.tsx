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
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin - Manage Teams</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-2">Create New Team</h2>
                <form onSubmit={handleCreateTeam} className="flex gap-4">
                    <input
                        type="text"
                        placeholder="Enter team name"
                        value={teamName}
                        onChange={(e) => setTeamName(e.target.value)}
                        className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        required
                    />
                    <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        Create Team
                    </button>
                </form>
                {error && <p className="text-red-500 mt-2">{error}</p>}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">Your Teams</h2>
                {loading ? (
                    <p>Loading teams...</p>
                ) : (
                    <div className="space-y-3">
                        {teams.map(team => (
                            <Link 
                                to={`/admin/team/${team.id}`} 
                                key={team.id}
                                className="block p-4 bg-white hover:bg-gray-50 shadow rounded-lg"
                            >
                                <h3 className="font-bold text-lg text-indigo-700">{team.name}</h3>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
