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
  const [step, setStep] = useState<'teams' | 'settings' | 'game'>('teams');
  const [duration, setDuration] = useState<number>(0);
  const [scoreCap, setScoreCap] = useState<number>(0);
  // Game state
  const [timer, setTimer] = useState<number>(0); // seconds
  const [timerActive, setTimerActive] = useState(false);
  const [scoreA, setScoreA] = useState<number>(0);
  const [scoreB, setScoreB] = useState<number>(0);
  const [defendsA, setDefendsA] = useState<number>(0);
  const [defendsB, setDefendsB] = useState<number>(0);
  const [turnoversA, setTurnoversA] = useState<number>(0);
  const [turnoversB, setTurnoversB] = useState<number>(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'game' && timerActive && (duration === 0 || timer < duration * 60)) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerActive, duration, timer]);

  // Start game handler
  const handleStartGame = () => {
    setStep('game');
    setTimer(0);
    setTimerActive(true);
    setScoreA(0);
    setScoreB(0);
    setDefendsA(0);
    setDefendsB(0);
    setTurnoversA(0);
    setTurnoversB(0);
  };

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

          {/* Responsive layout: teams side by side on mobile, all columns on desktop */}
          <div className="flex flex-col md:grid md:grid-cols-3 gap-8 mt-4">
            {/* Teams side by side on mobile */}
            <div className="flex flex-row gap-4 md:flex-col md:col-span-2">
              <div className="flex-1 bg-gray-50 p-4 rounded-lg">
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
              <div className="flex-1 bg-gray-50 p-4 rounded-lg">
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
            {/* Available players below on mobile, right column on desktop */}
            <div className="bg-gray-50 p-4 rounded-lg md:col-span-1">
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
                onClick={handleStartGame}
              >
                Start Game
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Game in progress step */}
      {teamCreationMethod === 'scratch' && step === 'game' && (
        <div className="mt-8 max-w-2xl mx-auto bg-gray-50 p-6 rounded-lg shadow flex flex-col gap-6">
          {/* Timer */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">Timer:</div>
            <div className="text-2xl font-mono">
              {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
              {duration > 0 && (
                <span className="ml-2 text-sm text-gray-500">/ {duration}:00</span>
              )}
            </div>
            <button
              onClick={() => setTimerActive(!timerActive)}
              className="ml-4 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-sm"
            >
              {timerActive ? 'Pause' : 'Resume'}
            </button>
          </div>
          {/* Scoreboard */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex-1 bg-white p-4 rounded-lg shadow text-center">
              <div className="font-bold text-lg mb-2">Team A</div>
              <div className="text-3xl font-mono mb-2">{scoreA}</div>
              <div className="flex justify-center gap-2 mb-2">
                <button onClick={() => setScoreA(s => (scoreCap === 0 || s < scoreCap) ? s + 1 : s)} className="px-3 py-1 bg-green-500 text-white rounded">Score</button>
                <button onClick={() => setDefendsA(d => d + 1)} className="px-3 py-1 bg-blue-500 text-white rounded">Defend</button>
                <button onClick={() => setTurnoversA(t => t + 1)} className="px-3 py-1 bg-red-500 text-white rounded">Turnover</button>
              </div>
              <div className="text-sm text-gray-600">Defends: {defendsA} | Turnovers: {turnoversA}</div>
            </div>
            <div className="flex-1 bg-white p-4 rounded-lg shadow text-center">
              <div className="font-bold text-lg mb-2">Team B</div>
              <div className="text-3xl font-mono mb-2">{scoreB}</div>
              <div className="flex justify-center gap-2 mb-2">
                <button onClick={() => setScoreB(s => (scoreCap === 0 || s < scoreCap) ? s + 1 : s)} className="px-3 py-1 bg-green-500 text-white rounded">Score</button>
                <button onClick={() => setDefendsB(d => d + 1)} className="px-3 py-1 bg-blue-500 text-white rounded">Defend</button>
                <button onClick={() => setTurnoversB(t => t + 1)} className="px-3 py-1 bg-red-500 text-white rounded">Turnover</button>
              </div>
              <div className="text-sm text-gray-600">Defends: {defendsB} | Turnovers: {turnoversB}</div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateTallyGame; 