import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player as PlayerBase } from '../types/player';
import TallyGameEventRecorder from '../components/TallyGameEventRecorder';
import type { TallyEvent } from '../components/TallyGameEventRecorder';
import CardStack from '../components/CardStack';

const LOCAL_STORAGE_KEY = 'ultimate-stats-active-game';

interface Line {
  id: string;
  team_id: string;
  name: string;
  description: string;
  player_ids: string[];
  created_at: string;
}

// Extend Player type locally to include team_id for this file
interface Player extends PlayerBase {
  team_id?: string;
}

const CreateTallyGame = () => {
  // Get teamId from route or query param
  const { teamId: routeTeamId } = useParams<{ teamId: string }>();
  const [searchParams] = useSearchParams();
  const queryTeamId = searchParams.get('teamId');
  const teamId = routeTeamId || queryTeamId || null;
  const [teamCreationMethod, setTeamCreationMethod] = useState<'lines' | 'scratch' | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
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
  const [events, setEvents] = useState<any[]>([]); // {type, team, player(s), time, extra}
  // const [undoStack, setUndoStack] = useState<any[]>([]);
  // const inputRef = useRef<HTMLInputElement>(null);
  // Animation state for modal
  // const [modalStepKey, setModalStepKey] = useState(0);
  const [absentPlayers, setAbsentPlayers] = useState<Player[]>([]);
  // const [editEventIdx, setEditEventIdx] = useState<number | null>(null);
  const [selectedLineId, setSelectedLineId] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [errorLines, setErrorLines] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Add state to hold event log from the event recorder
  const [tallyEventLog, setTallyEventLog] = useState<TallyEvent[]>([]);
  const [showEndGameModal, setShowEndGameModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Restore state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTeamCreationMethod(parsed.teamCreationMethod ?? null);
        setPlayers(parsed.players ?? []);
        setTeamA(parsed.teamA ?? []);
        setTeamB(parsed.teamB ?? []);
        setStep(parsed.step ?? 'teams');
        setDuration(parsed.duration ?? 0);
        setScoreCap(parsed.scoreCap ?? 0);
        setTimer(parsed.timer ?? 0);
        setTimerActive(parsed.timerActive ?? false);
        setScoreA(parsed.scoreA ?? 0);
        setScoreB(parsed.scoreB ?? 0);
        setDefendsA(parsed.defendsA ?? 0);
        setDefendsB(parsed.defendsB ?? 0);
        setTurnoversA(parsed.turnoversA ?? 0);
        setTurnoversB(parsed.turnoversB ?? 0);
        setEvents(parsed.events ?? []);
        setAbsentPlayers(parsed.absentPlayers ?? []);
        setSelectedLineId(parsed.selectedLineId ?? null);
      } catch {}
    }
  }, []);

  // Persist state to localStorage on every change
  useEffect(() => {
    const state = {
      teamCreationMethod,
      players,
      teamA,
      teamB,
      step,
      duration,
      scoreCap,
      timer,
      timerActive,
      scoreA,
      scoreB,
      defendsA,
      defendsB,
      turnoversA,
      turnoversB,
      events,
      absentPlayers,
      selectedLineId,
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [teamCreationMethod, players, teamA, teamB, step, duration, scoreCap, timer, timerActive, scoreA, scoreB, defendsA, defendsB, turnoversA, turnoversB, events, absentPlayers, selectedLineId]);

  // After saving or resetting, clear localStorage
  // const clearGameState = () => { /* ... */ };

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'game' && timerActive) {
      if (duration > 0) {
        // Countdown
        if (timer > 0) {
          interval = setInterval(() => {
            setTimer(t => (t > 0 ? t - 1 : 0));
          }, 1000);
        }
      } else {
        // Count up
        interval = setInterval(() => {
          setTimer(t => t + 1);
        }, 1000);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timerActive, duration, timer]);

  // Start game handler
  // const handleStartGame = () => { /* ... */ };

  useEffect(() => {
    if (teamCreationMethod === 'scratch') {
      fetchPlayers();
    }
  }, [teamCreationMethod]);

  const fetchPlayers = async () => {
    // setLoading(true);
    // setError(null);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*');
      
      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      // setError(error.message);
    } finally {
      // setLoading(false);
    }
  };

  // Modal close helper
  // const closeModal = () => { /* ... */ };

  // Event handlers
  // const handleEventButton = (type: 'score' | 'defend' | 'turnover') => { /* ... */ };

  // Undo
  // const handleUndo = () => { /* ... */ };

  // End game and save to DB
  // const handleEndGame = async () => { /* ... */ };

  // Open modal for editing an event
  // const handleEditEvent = (idx: number) => { /* ... */ };

  // When saving an event, replace if editing
  // const handleModalNext = (value: any) => { /* ... */ };

  // Fetch lines and players when teamCreationMethod is 'lines' and teamId is available
  useEffect(() => {
    if (teamCreationMethod === 'lines' && teamId) {
      const fetchLinesAndPlayers = async () => {
        setLoadingLines(true);
        setErrorLines(null);
        try {
          // Fetch lines for the team
          const { data: linesData, error: linesError } = await supabase
            .from('lines')
            .select('*')
            .eq('team_id', teamId)
            .order('created_at', { ascending: false });
          if (linesError) setErrorLines(linesError.message);
          else setLines(linesData || []);
          // Fetch players for the team
          const { data: playersData, error: playersError } = await supabase
            .from('players')
            .select('*')
            .eq('team_id', teamId);
          if (!playersError) setPlayers(playersData || []);
        } finally {
          setLoadingLines(false);
        }
      };
      fetchLinesAndPlayers();
    }
  }, [teamCreationMethod, teamId]);

  const handleSubmitGame = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Insert game (include event_log as JSONB if supported)
      const gameInsert = {
        opponent: 'Tally Game',
        game_date: new Date().toISOString(),
        game_type: 'tally',
        final_score_us: scoreA,
        final_score_them: scoreB,
        team_id: teamId || null,
        event_log: tallyEventLog, // <-- Make sure 'event_log' JSONB column exists in 'games' table
      };
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .insert(gameInsert)
        .select()
        .single();
      if (gameError) throw gameError;
      const gameId = gameData.id;

      // 2. Insert lineups
      const lineupInserts = [
        {
          game_id: gameId,
          team: 'Dark',
          player_ids: teamA.map(p => p.id),
        },
        {
          game_id: gameId,
          team: 'Light',
          player_ids: teamB.map(p => p.id),
        },
      ];
      const { error: lineupError } = await supabase
        .from('lineups')
        .insert(lineupInserts);
      if (lineupError) throw lineupError;

      // 3. Insert tally points for winning team
      let winner: 'Dark' | 'Light' | null = null;
      if (scoreA > scoreB) winner = 'Dark';
      else if (scoreB > scoreA) winner = 'Light';
      if (winner) {
        const winningPlayers = winner === 'Dark' ? teamA : teamB;
        // Prevent duplicate points for same player/game
        for (const player of winningPlayers) {
          const { data: existing, error: tallyCheckError } = await supabase
            .from('tally_points')
            .select('id')
            .eq('game_id', gameId)
            .eq('player_id', player.id)
            .maybeSingle();
          if (tallyCheckError) throw tallyCheckError;
          if (!existing) {
            const { error: tallyInsertError } = await supabase
              .from('tally_points')
              .insert({ game_id: gameId, player_id: player.id });
            if (tallyInsertError) throw tallyInsertError;
          }
        }
      }

      // Success: reset state and show alert
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setTeamCreationMethod(null);
      setPlayers([]);
      setTeamA([]);
      setTeamB([]);
      setStep('teams');
      setDuration(0);
      setScoreCap(0);
      setTimer(0);
      setTimerActive(false);
      setScoreA(0);
      setScoreB(0);
      setDefendsA(0);
      setDefendsB(0);
      setTurnoversA(0);
      setTurnoversB(0);
      setEvents([]);
      setAbsentPlayers([]);
      setSelectedLineId(null);
      setLines([]);
      setTallyEventLog([]);
      alert('Game recorded!');
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record game.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscardGame = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setTeamCreationMethod(null);
    setPlayers([]);
    setTeamA([]);
    setTeamB([]);
    setStep('teams');
    setDuration(0);
    setScoreCap(0);
    setTimer(0);
    setTimerActive(false);
    setScoreA(0);
    setScoreB(0);
    setDefendsA(0);
    setDefendsB(0);
    setTurnoversA(0);
    setTurnoversB(0);
    setEvents([]);
    setAbsentPlayers([]);
    setSelectedLineId(null);
    setLines([]);
    setTallyEventLog([]);
    setShowDiscardConfirm(false);
    setShowEndGameModal(false);
    alert('Game discarded.');
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto p-4 space-y-10">
        {teamCreationMethod === null && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
            <h1 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">Create Tally Game</h1>
            <p className="mb-4 text-lg">How would you like to create teams?</p>
            <div className="flex gap-4">
              <button
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                onClick={() => setTeamCreationMethod('lines')}
              >
                Pick from existing lines/teams
              </button>
              <button
                className="px-6 py-3 rounded-xl bg-gray-200 text-gray-900 font-bold hover:bg-gray-300 transition"
                onClick={() => setTeamCreationMethod('scratch')}
              >
                Manually assign players
              </button>
            </div>
          </div>
        )}
        {teamCreationMethod === 'lines' && step === 'teams' && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Pick a Line</h2>
            <div className="mb-4">
              <label className="block mb-2 font-semibold">Select a Line</label>
              {loadingLines ? (
                <p>Loading lines...</p>
              ) : errorLines ? (
                <p className="text-red-500">{errorLines}</p>
              ) : (
                <CardStack
                  cards={lines.map(line => ({
                    id: line.id,
                    title: line.name,
                    description: line.description,
                  }))}
                  selectedId={selectedLineId}
                  onSelect={id => {
                    setSelectedLineId(id);
                    const line = lines.find((l) => l.id === id);
                    if (line) {
                      setTeamA(players.filter((p) => line.player_ids.includes(p.id)));
                      setTeamB(players.filter((p) => !line.player_ids.includes(p.id) && !absentPlayers.some(a => a.id === p.id)));
                    } else {
                      setTeamA([]);
                      setTeamB([]);
                    }
                  }}
                />
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-8 mt-6">
              {/* Team A */}
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-blue-700">Team A (Line)</h3>
                <ul className="space-y-2">
                  {teamA.map((player: Player) => (
                    <li key={player.id} className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                      <span>{player.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Team B */}
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-green-700">Team B (Rest of Team)</h3>
                <ul className="space-y-2">
                  {teamB.map((player: Player) => (
                    <li key={player.id} className="bg-green-50 rounded-xl px-3 py-2 mb-2 w-full">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                        <span className="font-semibold text-gray-900 whitespace-normal pl-2 text-base mb-2 md:mb-0 md:flex-1">{player.name}</span>
                        <div className="flex gap-2 md:ml-4 w-full md:w-auto">
                          <button
                            className="w-full md:w-28 h-10 px-0 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition text-sm flex items-center justify-center"
                            onClick={() => {
                              setTeamA([...teamA, player]);
                              setTeamB(teamB.filter(p => p.id !== player.id));
                            }}
                          >
                            Add to Line (Temp)
                          </button>
                          <button
                            className="w-full md:w-20 h-10 px-0 rounded-lg bg-gray-400 text-white font-semibold hover:bg-gray-500 transition text-sm flex items-center justify-center"
                            onClick={() => {
                              setAbsentPlayers([...absentPlayers, player]);
                              setTeamB(teamB.filter(p => p.id !== player.id));
                            }}
                          >
                            Absent
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Absent Players */}
            {absentPlayers.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 text-gray-500">Absent Players</h3>
                <ul className="space-y-2">
                  {absentPlayers.map((player: Player) => (
                    <li key={player.id} className="bg-gray-100 rounded-xl px-3 py-2 mb-2 w-full">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                        <span className="font-semibold text-gray-900 whitespace-normal pl-2 text-base mb-2 md:mb-0 md:flex-1">{player.name}</span>
                        <div className="flex gap-2 md:ml-4 w-full md:w-auto">
                          <button
                            className="w-full md:w-24 h-10 px-0 rounded-lg bg-red-400 text-white font-semibold hover:bg-red-500 transition text-sm flex items-center justify-center"
                            onClick={() => {
                              setAbsentPlayers(absentPlayers.filter(p => p.id !== player.id));
                              setTeamB([...teamB, player]);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <button
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                disabled={teamA.length === 0 || teamB.length === 0}
                onClick={() => setStep('settings')}
              >
                Next: Game Settings
              </button>
            </div>
          </div>
        )}
        {teamCreationMethod === 'scratch' && step === 'teams' && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Assign Players to Sub-Teams</h2>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Team A */}
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-blue-700">Team A</h3>
                <ul className="space-y-2">
                  {teamA.map(player => (
                    <li key={player.id} className="flex items-center justify-between bg-blue-50 rounded px-3 py-2">
                      <span>{player.name}</span>
                      <button
                        className="px-2 py-1 rounded bg-red-400 text-white hover:bg-red-500"
                        onClick={() => setTeamA(teamA.filter(p => p.id !== player.id))}
                      >Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Team B */}
              <div className="flex-1">
                <h3 className="font-semibold mb-2 text-green-700">Team B</h3>
                <ul className="space-y-2">
                  {teamB.map(player => (
                    <li key={player.id} className="flex items-center justify-between bg-green-50 rounded px-3 py-2">
                      <span>{player.name}</span>
                      <button
                        className="px-2 py-1 rounded bg-red-400 text-white hover:bg-red-500"
                        onClick={() => setTeamB(teamB.filter(p => p.id !== player.id))}
                      >Remove</button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* Unassigned Players */}
            <div className="mt-8">
              <h3 className="font-semibold mb-2">Unassigned Players</h3>
              <ul className="space-y-2">
                {players.filter(p => !teamA.some(a => a.id === p.id) && !teamB.some(b => b.id === p.id) && !absentPlayers.some(a => a.id === p.id)).map(player => (
                  <li key={player.id} className="flex items-center justify-between bg-gray-100 rounded px-3 py-2">
                    <span>{player.name}</span>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600"
                        onClick={() => setTeamA([...teamA, player])}
                      >Team A</button>
                      <button
                        className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
                        onClick={() => setTeamB([...teamB, player])}
                      >Team B</button>
                      <button
                        className="px-3 py-1 rounded bg-gray-400 text-white hover:bg-gray-500"
                        onClick={() => setAbsentPlayers([...absentPlayers, player])}
                      >Absent</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Absent Players */}
            {absentPlayers.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2 text-gray-500">Absent Players</h3>
                <ul className="space-y-2">
                  {absentPlayers.map((player: Player) => (
                    <li key={player.id} className="bg-gray-100 rounded-xl px-3 py-2 mb-2 w-full">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between w-full">
                        <span className="font-semibold text-gray-900 whitespace-normal pl-2 text-base mb-2 md:mb-0 md:flex-1">{player.name}</span>
                        <div className="flex gap-2 md:ml-4 w-full md:w-auto">
                          <button
                            className="w-full md:w-24 h-10 px-0 rounded-lg bg-red-400 text-white font-semibold hover:bg-red-500 transition text-sm flex items-center justify-center"
                            onClick={() => {
                              setAbsentPlayers(absentPlayers.filter(p => p.id !== player.id));
                              setTeamB([...teamB, player]);
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-8 flex justify-end">
              <button
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                disabled={teamA.length === 0 || teamB.length === 0}
                onClick={() => setStep('settings')}
              >
                Next: Game Settings
              </button>
            </div>
          </div>
        )}
        {step === 'settings' && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Game Settings</h2>
            <div className="mb-6 flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <label className="block mb-2 font-semibold">Game Duration (minutes, optional)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={duration || ''}
                  onChange={e => setDuration(Number(e.target.value))}
                  placeholder="e.g. 30"
                />
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-semibold">Score Cap (optional)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full p-3 border border-gray-200 rounded-xl"
                  value={scoreCap || ''}
                  onChange={e => setScoreCap(Number(e.target.value))}
                  placeholder="e.g. 15"
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition"
                onClick={() => {
                  if (duration > 0) {
                    setTimer(duration * 60);
                  } else {
                    setTimer(0);
                  }
                  setTimerActive(true);
                  setStep('game');
                }}
              >
                Start Game
              </button>
            </div>
          </div>
        )}
        {step === 'game' && (
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-8">
            {/* Game Timer */}
            <div className="flex items-center justify-center mb-6">
              <span className="text-2xl font-mono font-bold bg-gray-100 rounded px-4 py-2">
                {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
              </span>
              <button
                className={`ml-4 px-4 py-2 rounded font-bold shadow ${timerActive ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-green-500 text-white hover:bg-green-600'}`}
                onClick={() => setTimerActive(!timerActive)}
              >
                {timerActive ? 'Pause' : 'Start'}
              </button>
            </div>
            {/* Pass all non-absent players as presentPlayers, so any can score or assist. The scorer is the one who gets the goal and their team gets the point. */}
            <TallyGameEventRecorder
              presentPlayers={players.filter(p => !absentPlayers.some(a => a.id === p.id)).map(p => ({ id: p.id, name: p.name, team: teamA.some(a => a.id === p.id) ? 'A' : 'B' }))}
              teamAName="Dark"
              teamBName="Light"
              onUpdateTallies={(tallies, eventLog) => {
                setTallyEventLog(eventLog);
                setScoreA(tallies.scoreA);
                setScoreB(tallies.scoreB);
                setDefendsA(tallies.defendsA);
                setDefendsB(tallies.defendsB);
                setTurnoversA(tallies.turnoversA);
                setTurnoversB(tallies.turnoversB);
              }}
            />
            <div className="mt-8 flex justify-end gap-4">
              <button
                className="px-6 py-3 rounded-xl bg-gray-400 text-white font-bold hover:bg-gray-500 transition disabled:opacity-50"
                disabled={isSubmitting}
                onClick={() => setShowEndGameModal(true)}
              >
                End Game
              </button>
            </div>
            {submitError && <div className="text-red-500 mt-4">{submitError}</div>}
          </div>
        )}
        {/* End Game Modal */}
        {showEndGameModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">End Game</h2>
              <p className="mb-6">Would you like to save or discard this game?</p>
              <div className="flex gap-4 justify-end">
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700"
                  onClick={() => { setShowEndGameModal(false); handleSubmitGame(); }}
                  disabled={isSubmitting}
                >
                  Save Game
                </button>
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                  onClick={() => { setShowEndGameModal(false); setShowDiscardConfirm(true); }}
                >
                  Discard Game
                </button>
                <button
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400"
                  onClick={() => setShowEndGameModal(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Discard Confirmation Modal */}
        {showDiscardConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Discard Game?</h2>
              <p className="mb-6">Are you sure you want to discard this game? This cannot be undone.</p>
              <div className="flex gap-4 justify-end">
                <button
                  className="px-4 py-2 rounded bg-red-600 text-white font-bold hover:bg-red-700"
                  onClick={handleDiscardGame}
                >
                  Yes, Discard
                </button>
                <button
                  className="px-4 py-2 rounded bg-gray-300 text-gray-800 font-bold hover:bg-gray-400"
                  onClick={() => setShowDiscardConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTallyGame;

/* Add animation styles at the bottom of the file */
/*
@layer utilities {
  .animate-fade-slide {
    animation: fadeSlideIn 0.25s cubic-bezier(0.4,0,0.2,1);
  }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(24px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
}
*/