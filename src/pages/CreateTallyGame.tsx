import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

const CreateTallyGame = () => {
  const [teamCreationMethod, setTeamCreationMethod] = useState<'lines' | 'scratch' | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (teamCreationMethod === 'scratch') {
      fetchPlayers();
    }
  }, [teamCreationMethod]);

  const fetchPlayers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMovePlayer = (player: Player, to: 'A' | 'B' | 'available') => {
    if (to === 'A') {
        setTeamA([...teamA, player]);
        setTeamB(teamB.filter(p => p.id !== player.id));
        setPlayers(players.filter(p => p.id !== player.id));
    } else if (to === 'B') {
        setTeamB([...teamB, player]);
        setTeamA(teamA.filter(p => p.id !== player.id));
        setPlayers(players.filter(p => p.id !== player.id));
    } else { // to 'available'
        setPlayers([...players, player]);
        setTeamA(teamA.filter(p => p.id !== player.id));
        setTeamB(teamB.filter(p => p.id !== player.id));
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold">Create a New Tally Game</h1>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold">Step 1: Specify Teams</h2>
        <p className="mt-2 text-gray-600">How would you like to create the teams for this game?</p>
        <div className="mt-4 flex gap-4">
          <button
            onClick={() => setTeamCreationMethod('lines')}
            className={`px-4 py-2 rounded-lg font-semibold ${teamCreationMethod === 'lines' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Use Pre-designated Lines
          </button>
          <button
            onClick={() => setTeamCreationMethod('scratch')}
            className={`px-4 py-2 rounded-lg font-semibold ${teamCreationMethod === 'scratch' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-800'}`}
          >
            Create Teams from Scratch
          </button>
        </div>
      </div>

      {teamCreationMethod === 'lines' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Select Pre-designated Lines</h3>
          <p className="mt-2 text-gray-600">This feature is coming soon!</p>
          {/* Placeholder for line selection UI */}
        </div>
      )}

      {teamCreationMethod === 'scratch' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Create Teams from Scratch</h3>
          {loading && <p>Loading players...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
                <h4 className="font-semibold">Available Players</h4>
                <ul className="border p-2 rounded-md min-h-[200px]">
                    {players.map(player => (
                        <li key={player.id} className="flex justify-between items-center">
                            {player.name}
                            <div>
                                <button onClick={() => handleMovePlayer(player, 'A')} className="text-xs bg-blue-500 text-white px-1 rounded">A</button>
                                <button onClick={() => handleMovePlayer(player, 'B')} className="text-xs bg-red-500 text-white px-1 rounded ml-1">B</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold">Team A</h4>
                <ul className="border p-2 rounded-md min-h-[200px]">
                    {teamA.map(player => (
                        <li key={player.id} className="flex justify-between items-center">
                            {player.name}
                            <button onClick={() => handleMovePlayer(player, 'available')} className="text-xs bg-gray-500 text-white px-1 rounded">X</button>
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h4 className="font-semibold">Team B</h4>
                <ul className="border p-2 rounded-md min-h-[200px]">
                    {teamB.map(player => (
                        <li key={player.id} className="flex justify-between items-center">
                            {player.name}
                            <button onClick={() => handleMovePlayer(player, 'available')} className="text-xs bg-gray-500 text-white px-1 rounded">X</button>
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateTallyGame; 