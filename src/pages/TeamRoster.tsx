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
    const [newPlayer, setNewPlayer] = useState({ name: '', jersey_number: '' });
    const [bulkText, setBulkText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false);
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);

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
                })
                .select()
                .single();
            
            if (error) throw error;
            
            setPlayers(prevPlayers => [...prevPlayers, data]);
            setNewPlayer({ name: '', jersey_number: '' });

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
                const [name, jersey_number] = line.split(',').map(s => s.trim());
                return {
                    team_id: teamId,
                    name,
                    jersey_number: parseInt(jersey_number) || null,
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

    if (loading) return <div className="flex justify-center items-center h-screen bg-background"><p className="text-lg">Loading team roster...</p></div>;
    if (error) return <div className="flex justify-center items-center h-screen bg-background"><p className="text-lg text-red-600 bg-red-100 p-4 rounded-lg">Error: {error}</p></div>;
    if (!team) return <div className="flex justify-center items-center h-screen bg-background"><p className="text-lg">Team not found.</p></div>;

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto p-6 max-w-4xl">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-10 tracking-tight">Roster for {team.name}</h1>

                <div className="space-y-8 mb-12">
                    {/* Collapsible Add New Player Form */}
                    <div className="bg-white rounded-2xl shadow-soft">
                        <button
                            onClick={() => setIsAddPlayerOpen(!isAddPlayerOpen)}
                            className="w-full flex justify-between items-center p-6 text-left"
                        >
                            <h2 className="text-2xl font-bold text-gray-900">Add New Player</h2>
                            <svg className={`w-6 h-6 transform transition-transform ${isAddPlayerOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isAddPlayerOpen ? 'max-h-96' : 'max-h-0'}`}> 
                            <div className="p-6 border-t border-gray-100">
                                <form onSubmit={handleAddPlayer} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <label htmlFor="name" className="block text-sm font-medium text-gray-600 mb-1">Name</label>
                                            <input id="name" name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="e.g., Jane Doe" required className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"/>
                                        </div>
                                        <div>
                                            <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-600 mb-1">Jersey #</label>
                                            <input id="jersey_number" name="jersey_number" type="number" value={newPlayer.jersey_number} onChange={handleInputChange} placeholder="e.g., 47" className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"/>
                                        </div>
                                    </div>
                                    <button type="submit" className="w-full md:w-auto bg-indigo-600 text-white font-semibold py-2 px-8 rounded-xl shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 transition">
                                        Add Player
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible Bulk Add Players Form */}
                    <div className="bg-white rounded-2xl shadow-soft">
                        <button
                            onClick={() => setIsBulkAddOpen(!isBulkAddOpen)}
                            className="w-full flex justify-between items-center p-6 text-left"
                        >
                            <h2 className="text-2xl font-bold text-gray-900">Bulk Add Players</h2>
                            <svg className={`w-6 h-6 transform transition-transform ${isBulkAddOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isBulkAddOpen ? 'max-h-96' : 'max-h-0'}`}> 
                            <div className="p-6 border-t border-gray-100">
                                <p className="text-sm text-gray-500 mb-4">Paste player data below, one player per line. Fields separated by commas: Name, Jersey Number.</p>
                                <form onSubmit={handleBulkAddPlayers} className="space-y-4">
                                    <textarea
                                        value={bulkText}
                                        onChange={(e) => setBulkText(e.target.value)}
                                        placeholder={"John Doe, 1\nJane Smith, 2"}
                                        className="w-full p-3 border border-gray-200 rounded-xl mb-4 h-32 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                                    />
                                    <button type="submit" className="w-full md:w-auto bg-green-600 text-white font-semibold py-2 px-8 rounded-xl shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition">
                                        Add Players from Text
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Current Roster */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Current Roster</h2>
                    {players.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
                            {players.map(player => (
                                <div key={player.id} className="bg-white p-6 rounded-2xl shadow-soft hover:shadow-lg transition-shadow duration-300">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-lg text-gray-800">{player.name}</p>
                                        <span className="bg-indigo-100 text-indigo-800 text-sm font-semibold px-3 py-1 rounded-full">#{player.jersey_number || 'N/A'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No players found for this team.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeamRoster;
