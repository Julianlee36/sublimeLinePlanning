import { useState, useEffect, useRef } from 'react';
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
  const [eventModal, setEventModal] = useState<null | { type: 'score' | 'defend' | 'turnover', step: number, data: any }> (null);
  const [events, setEvents] = useState<any[]>([]); // {type, team, player(s), time, extra}
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Autocomplete filter
  const [playerQuery, setPlayerQuery] = useState('');
  const allPlayers = Array.from(new Map([...teamA, ...teamB, ...players].map(p => [p.id, p])).values());
  const filteredPlayers = allPlayers.filter(p => p.name.toLowerCase().includes(playerQuery.toLowerCase()));

  // Modal close helper
  const closeModal = () => {
    setEventModal(null);
    setPlayerQuery('');
  };

  // Event handlers
  const handleEventButton = (type: 'score' | 'defend' | 'turnover') => {
    setEventModal({ type, step: 0, data: {} });
  };

  // Undo
  const handleUndo = () => {
    if (events.length > 0) {
      const last = events[events.length - 1];
      setUndoStack([...undoStack, last]);
      setEvents(events.slice(0, -1));
      // Optionally update tallies here
    }
  };

  // End game
  const handleEndGame = () => {
    setTimerActive(false);
    // Optionally: show summary, save, etc.
  };

  // Handle modal step logic
  const handleModalNext = (value: any) => {
    if (!eventModal) return;
    const { type, step, data } = eventModal;
    if (type === 'score') {
      if (step === 0) {
        // Pick assister
        setEventModal({ type, step: 1, data: { ...data, assister: value } });
      } else if (step === 1) {
        // Pick scorer
        setEvents([...events, { type: 'score', assister: data.assister, scorer: value, time: timer }]);
        setScoreA(teamA.some(p => p.id === value.id) ? scoreA + 1 : scoreA);
        setScoreB(teamB.some(p => p.id === value.id) ? scoreB + 1 : scoreB);
        closeModal();
      }
    } else if (type === 'defend') {
      setEvents([...events, { type: 'defend', player: value, time: timer }]);
      setDefendsA(teamA.some(p => p.id === value.id) ? defendsA + 1 : defendsA);
      setDefendsB(teamB.some(p => p.id === value.id) ? defendsB + 1 : defendsB);
      closeModal();
    } else if (type === 'turnover') {
      if (step === 0) {
        // Pick player
        setEventModal({ type, step: 1, data: { ...data, player: value } });
      } else if (step === 1) {
        // Pick type or skip
        setEvents([...events, { type: 'turnover', player: data.player, turnoverType: value, time: timer }]);
        setTurnoversA(teamA.some(p => p.id === data.player.id) ? turnoversA + 1 : turnoversA);
        setTurnoversB(teamB.some(p => p.id === data.player.id) ? turnoversB + 1 : turnoversB);
        closeModal();
      }
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
        <div className="mt-2 max-w-md mx-auto flex flex-col gap-4">
          {/* Timer and End Game */}
          <div className="flex items-center justify-between mb-2">
            <div className="text-lg font-semibold">Timer:</div>
            <div className="text-2xl font-mono">
              {Math.floor(timer / 60).toString().padStart(2, '0')}:{(timer % 60).toString().padStart(2, '0')}
              {duration > 0 && (
                <span className="ml-2 text-sm text-gray-500">/ {duration}:00</span>
              )}
            </div>
            <button
              onClick={() => setTimerActive(!timerActive)}
              className="ml-2 px-3 py-1 rounded bg-gray-300 hover:bg-gray-400 text-sm"
            >
              {timerActive ? 'Pause' : 'Resume'}
            </button>
            <button
              onClick={handleEndGame}
              className="ml-2 px-3 py-1 rounded bg-red-500 text-white text-sm"
            >
              End Game
            </button>
          </div>
          {/* Scoreboard */}
          <div className="flex flex-row gap-2 justify-between items-center">
            <div className="flex-1 bg-white p-2 rounded-lg shadow text-center">
              <div className="font-bold text-md mb-1">Team A</div>
              <div className="text-2xl font-mono mb-1">{scoreA}</div>
              <div className="text-xs text-gray-600">Defends: {defendsA} | Turnovers: {turnoversA}</div>
            </div>
            <div className="flex-1 bg-white p-2 rounded-lg shadow text-center">
              <div className="font-bold text-md mb-1">Team B</div>
              <div className="text-2xl font-mono mb-1">{scoreB}</div>
              <div className="text-xs text-gray-600">Defends: {defendsB} | Turnovers: {turnoversB}</div>
            </div>
          </div>
          {/* Event buttons */}
          <div className="flex flex-wrap gap-3 justify-center mt-2">
            <button onClick={() => handleEventButton('score')} className="px-6 py-3 rounded bg-green-600 text-white font-bold text-lg">Score</button>
            <button onClick={() => handleEventButton('defend')} className="px-6 py-3 rounded bg-blue-600 text-white font-bold text-lg">Defend</button>
            <button onClick={() => handleEventButton('turnover')} className="px-6 py-3 rounded bg-red-600 text-white font-bold text-lg">Turnover</button>
            <button onClick={handleUndo} className="px-6 py-3 rounded bg-gray-400 text-white font-bold text-lg">Undo</button>
          </div>

          {/* Event modal */}
          {eventModal && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-xs mx-auto">
                {/* Score event flow */}
                {eventModal.type === 'score' && eventModal.step === 0 && (
                  <>
                    <div className="mb-2 font-semibold">Select Assister</div>
                    <input
                      ref={inputRef}
                      autoFocus
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Type to search..."
                      value={playerQuery}
                      onChange={e => setPlayerQuery(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredPlayers.map(player => (
                        <div key={player.id} className="p-2 hover:bg-gray-200 cursor-pointer rounded" onClick={() => handleModalNext(player)}>
                          {player.name}
                        </div>
                      ))}
                      {filteredPlayers.length === 0 && <div className="text-gray-400 p-2">No players found</div>}
                    </div>
                  </>
                )}
                {eventModal.type === 'score' && eventModal.step === 1 && (
                  <>
                    <div className="mb-2 font-semibold">Select Goal Scorer</div>
                    <input
                      ref={inputRef}
                      autoFocus
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Type to search..."
                      value={playerQuery}
                      onChange={e => setPlayerQuery(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredPlayers.map(player => (
                        <div key={player.id} className="p-2 hover:bg-gray-200 cursor-pointer rounded" onClick={() => handleModalNext(player)}>
                          {player.name}
                        </div>
                      ))}
                      {filteredPlayers.length === 0 && <div className="text-gray-400 p-2">No players found</div>}
                    </div>
                  </>
                )}
                {/* Defend event flow */}
                {eventModal.type === 'defend' && (
                  <>
                    <div className="mb-2 font-semibold">Select Defender</div>
                    <input
                      ref={inputRef}
                      autoFocus
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Type to search..."
                      value={playerQuery}
                      onChange={e => setPlayerQuery(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredPlayers.map(player => (
                        <div key={player.id} className="p-2 hover:bg-gray-200 cursor-pointer rounded" onClick={() => handleModalNext(player)}>
                          {player.name}
                        </div>
                      ))}
                      {filteredPlayers.length === 0 && <div className="text-gray-400 p-2">No players found</div>}
                    </div>
                  </>
                )}
                {/* Turnover event flow */}
                {eventModal.type === 'turnover' && eventModal.step === 0 && (
                  <>
                    <div className="mb-2 font-semibold">Select Player (Turnover)</div>
                    <input
                      ref={inputRef}
                      autoFocus
                      className="w-full p-2 border rounded mb-2"
                      placeholder="Type to search..."
                      value={playerQuery}
                      onChange={e => setPlayerQuery(e.target.value)}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {filteredPlayers.map(player => (
                        <div key={player.id} className="p-2 hover:bg-gray-200 cursor-pointer rounded" onClick={() => handleModalNext(player)}>
                          {player.name}
                        </div>
                      ))}
                      {filteredPlayers.length === 0 && <div className="text-gray-400 p-2">No players found</div>}
                    </div>
                  </>
                )}
                {eventModal.type === 'turnover' && eventModal.step === 1 && (
                  <>
                    <div className="mb-2 font-semibold">Turnover Type</div>
                    <div className="flex flex-col gap-2">
                      <button className="p-2 bg-blue-500 text-white rounded" onClick={() => handleModalNext('throwing')}>Throwing</button>
                      <button className="p-2 bg-green-500 text-white rounded" onClick={() => handleModalNext('catching')}>Catching</button>
                      <button className="p-2 bg-gray-300 text-gray-800 rounded" onClick={() => handleModalNext('skip')}>Skip</button>
                    </div>
                  </>
                )}
                <button className="mt-4 w-full p-2 rounded bg-gray-200 hover:bg-gray-300" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default CreateTallyGame; 