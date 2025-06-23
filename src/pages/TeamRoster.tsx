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

    if (loading) return <p className="text-center p-4">Loading team roster...</p>;
    if (error) return <p className="text-center text-red-500 p-4">Error: {error}</p>;
    if (!team) return <p className="text-center p-4">Team not found.</p>;

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Roster for {team.name}</h1>

            <div className="bg-white p-4 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold mb-2">Add New Player</h2>
                <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <input name="name" value={newPlayer.name} onChange={handleInputChange} placeholder="Name" required className="p-2 border rounded"/>
                    <input name="jersey_number" type="number" value={newPlayer.jersey_number} onChange={handleInputChange} placeholder="Jersey #" className="p-2 border rounded"/>
                    <input name="position" value={newPlayer.position} onChange={handleInputChange} placeholder="Position (e.g., Handler)" className="p-2 border rounded"/>
                    <button type="submit" className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700">Add Player</button>
                </form>
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-2">Current Roster</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map(player => (
                        <div key={player.id} className="bg-white p-4 rounded-lg shadow">
                            <p className="font-bold text-lg">{player.name} <span className="text-gray-500">#{player.jersey_number}</span></p>
                            <p className="text-sm text-gray-600">{player.position}</p>
                        </div>
                    ))}
                </div>
                {players.length === 0 && <p>No players on this team yet.</p>}
            </div>
        </div>
    );
};

export default TeamRoster;
