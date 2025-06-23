import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';
import type { Team } from '../types/team';

const TeamRoster = () => {
    const { teamId } = useParams<{ teamId: string }>();
    const [team, setTeam] = useState<Team | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [newPlayer, setNewPlayer] = useState({ name: '', jersey_number: '', position: '' });
    const [bulkText, setBulkText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (teamId) {
            fetchTeamAndPlayers();
        }
    }, [teamId]);

    const fetchTeamAndPlayers = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch team details
            const { data: teamData, error: teamError } = await supabase
                .from('teams')
                .select('*')
                .eq('id', teamId)
                .single();
            
            if (teamError) throw teamError;
            setTeam(teamData);

            // Fetch players for the team
            const { data: playersData, error: playersError } = await supabase
                .from('players')
                .select('*')
                .eq('team_id', teamId)
                .order('jersey_number');

            if (playersError) throw playersError;
            setPlayers(playersData || []);

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewPlayer(prev => ({ ...prev, [name]: value }));
    };

    const handleAddPlayer = async (e: FormEvent) => {
        e.preventDefault();
        if (!teamId) return;
        
        setError(null);
        try {
            const { data, error } = await supabase
                .from('players')
                .insert({
                    team_id: teamId,
                    name: newPlayer.name,
                    jersey_number: parseInt(newPlayer.jersey_number) || null,
                    position: newPlayer.position || null,
                })
                .select()
                .single();
            
            if (error) throw error;
            
            setPlayers(prevPlayers => [...prevPlayers, data]);
            setNewPlayer({ name: '', jersey_number: '', position: '' });

        } catch (error: any) {
            setError(error.message);
        }
    };

    const handleBulkAddPlayers = async (e: FormEvent) => {
        e.preventDefault();
        if (!teamId || !bulkText.trim()) return;

        setError(null);
        try {
            const lines = bulkText.trim().split('\n');
            const newPlayers = lines.map(line => {
                const [name, jersey_number, position] = line.split(',').map(s => s.trim());
                return {
                    team_id: teamId,
                    name,
                    jersey_number: parseInt(jersey_number) || null,
                    position: position || null,
                };
            });

            const { data, error } = await supabase
                .from('players')
                .insert(newPlayers)
                .select();

            if (error) throw error;

            setPlayers(prevPlayers => [...prevPlayers, ...data]);
            setBulkText('');

        } catch (error: any) {
            setError(error.message);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Loading team roster...</p></div>;
    if (error) return <div className="flex justify-center items-center h-screen"><p className="text-lg text-red-600 bg-red-100 p-4 rounded-lg">Error: {error}</p></div>;
    if (!team) return <div className="flex justify-center items-center h-screen"><p className="text-lg">Team not found.</p></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto p-4 sm:p-6 lg:p-8 max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Roster for {team.name}</h1>

                {/* Add New Player Form */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Add New Player</h2>
                    <form onSubmit={handleAddPlayer}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                                <input id="name" name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="e.g., Jane Doe" required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
                            </div>
                            <div>
                                <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-600 mb-1">Jersey #</label>
                                <input id="jersey_number" name="jersey_number" type="number" value={newPlayer.jersey_number} onChange={handleInputChange} placeholder="e.g., 47" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
                            </div>
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-600 mb-1">Position</label>
                                <input id="position" name="position" value={newPlayer.position} onChange={handleInputChange} placeholder="e.g., Handler" className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"/>
                            </div>
                        </div>
                        <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition">
                            Add Player
                        </button>
                    </form>
                </div>

                {/* Bulk Add Players Form */}
                <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Bulk Add Players</h2>
                    <p className="text-sm text-gray-500 mb-4">Paste player data below, one player per line. Fields separated by commas: Name, Jersey Number, Position.</p>
                    <form onSubmit={handleBulkAddPlayers}>
                        <textarea
                            value={bulkText}
                            onChange={(e) => setBulkText(e.target.value)}
                            placeholder={"John Doe, 1, Handler\nJane Smith, 2, Cutter"}
                            className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                        />
                        <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition">
                            Add Players from Text
                        </button>
                    </form>
                </div>

                {/* Current Roster */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Current Roster</h2>
                    {players.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {players.map(player => (
                                <div key={player.id} className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lg text-gray-800">{player.name}</p>
                                        <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-2.5 py-0.5 rounded-full">#{player.jersey_number || 'N/A'}</span>
                                    </div>
                                    <p className="text-md text-gray-600 mt-1">{player.position || 'No position specified'}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 px-6 bg-white rounded-xl shadow-md">
                            <p className="text-gray-500">No players on this team yet. Add one above!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamRoster;
