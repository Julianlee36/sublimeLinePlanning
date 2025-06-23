import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

const CreateTallyGame = () => {
  const [teamCreationMethod, setTeamCreationMethod] = useState<'lines' | 'scratch' | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'teams' | 'settings'>('teams');
  const [duration, setDuration] = useState<number>(0);
  const [scoreCap, setScoreCap] = useState<number>(0);

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
      {/* Only show method selection if not chosen yet */}
      {teamCreationMethod === null && (
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
      )}

      {/* Show back button if a method is selected */}
      {teamCreationMethod !== null && (
        <button
          onClick={() => {
            setTeamCreationMethod(null);
            setTeamA([]);
            setTeamB([]);
            setPlayers([]);
          }}
          className="mt-4 mb-2 px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
        >
          &larr; Back
        </button>
      )}

      {teamCreationMethod === 'lines' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Select Pre-designated Lines</h3>
          <p className="mt-2 text-gray-600">This feature is coming soon!</p>
        </div>
      )}

      {teamCreationMethod === 'scratch' && step === 'teams' && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Create Teams from Scratch</h3>
          {loading && <p>Loading players...</p>}
          {error && <p className="text-red-500">{error}</p>}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-center mb-4">Available Players</h4>
                <div className="space-y-3">
                    {players.map(player => (
                        <div key={player.id} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                            <span className="font-medium">{player.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleMovePlayer(player, 'A')} className="w-8 h-8 font-bold bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center">A</button>
                                <button onClick={() => handleMovePlayer(player, 'B')} className="w-8 h-8 font-bold bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center justify-center">B</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-center mb-4">Team A</h4>
                <div className="space-y-3">
                    {teamA.map(player => (
                        <div key={player.id} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                            <span className="font-medium">{player.name}</span>
                            <button onClick={() => handleMovePlayer(player, 'available')} className="w-8 h-8 font-bold bg-gray-400 text-white rounded-md hover:bg-gray-500 flex items-center justify-center">X</button>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-center mb-4">Team B</h4>
                <div className="space-y-3">
                    {teamB.map(player => (
                        <div key={player.id} className="bg-white p-3 rounded-lg shadow flex justify-between items-center">
                            <span className="font-medium">{player.name}</span>
                            <button onClick={() => handleMovePlayer(player, 'available')} className="w-8 h-8 font-bold bg-gray-400 text-white rounded-md hover:bg-gray-500 flex items-center justify-center">X</button>
                        </div>
                    ))}
                </div>
            </div>
          </div>
          {/* Next button only if both teams have at least one player */}
          <div className="mt-6 flex justify-end">
            <button
              disabled={teamA.length === 0 || teamB.length === 0}
              onClick={() => setStep('settings')}
              className={`px-6 py-2 rounded-lg font-semibold text-white ${teamA.length === 0 || teamB.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Game settings step */}
      {teamCreationMethod === 'scratch' && step === 'settings' && (
        <div className="mt-8 max-w-md mx-auto bg-gray-50 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Game Settings</h3>
          <form className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Game Duration (minutes)</label>
              <input
                type="number"
                min="0"
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="0 for unlimited"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">Score Cap</label>
              <input
                type="number"
                min="0"
                value={scoreCap}
                onChange={e => setScoreCap(Number(e.target.value))}
                className="w-full p-2 border rounded"
                placeholder="0 for uncapped"
              />
            </div>
            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setStep('teams')}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                &larr; Back
              </button>
              <button
                type="button"
                className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700"
                // onClick={handleCreateTallyGame} // To be implemented
              >
                Create Tally Game
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default CreateTallyGame; 