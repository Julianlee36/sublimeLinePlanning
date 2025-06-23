import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

const PlayerRoster = () => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayer, setNewPlayer] = useState({ name: '', position: '', jersey_number: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('jersey_number', { ascending: true });

      if (error) throw error;
      if (data) setPlayers(data);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlayer = async (e: FormEvent) => {
    e.preventDefault();
    try {
        const { data, error } = await supabase
            .from('players')
            .insert([{
                name: newPlayer.name,
                position: newPlayer.position,
                jersey_number: parseInt(newPlayer.jersey_number, 10),
            }])
            .select();

        if (error) throw error;
        
        if (data) {
            setPlayers(prevPlayers => [...prevPlayers, data[0]].sort((a, b) => a.jersey_number - b.jersey_number));
        }
        setNewPlayer({ name: '', position: '', jersey_number: '' });

    } catch (error: any) {
        setError(error.message);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Player Roster</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-2">Add New Player</h2>
        <form onSubmit={handleAddPlayer} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
            <input
              id="name"
              type="text"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="position" className="block text-sm font-medium text-gray-700">Position</label>
            <input
              id="position"
              type="text"
              value={newPlayer.position || ''}
              onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
            />
          </div>
          <div className="md:col-span-1">
            <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-700">Jersey #</label>
            <input
              id="jersey_number"
              type="number"
              value={newPlayer.jersey_number}
              onChange={(e) => setNewPlayer({ ...newPlayer, jersey_number: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
              required
            />
          </div>
          <button type="submit" className="md:col-span-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            Add Player
          </button>
        </form>
      </div>

      {error && <p className="text-red-500 bg-red-100 p-3 rounded-md">Error: {error}</p>}

      <div>
        <h2 className="text-xl font-semibold mb-2">Current Roster ({players.length} players)</h2>
        {loading ? (
          <p>Loading players...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {players.map((player) => (
              <div key={player.id} className="p-4 bg-white shadow rounded-lg text-center">
                <p className="text-3xl font-bold text-indigo-600">{player.jersey_number}</p>
                <p className="text-lg font-semibold">{player.name}</p>
                <p className="text-gray-600">{player.position}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerRoster; 