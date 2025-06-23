import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

const LOCAL_STORAGE_KEY = 'ultimate-stats-active-game';

const CreateTallyGame = () => {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');
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
  // Animation state for modal
  const [modalStepKey, setModalStepKey] = useState(0);
  const [absentPlayers, setAbsentPlayers] = useState<Player[]>([]);
  const [editEventIdx, setEditEventIdx] = useState<number | null>(null);

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
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  }, [teamCreationMethod, players, teamA, teamB, step, duration, scoreCap, timer, timerActive, scoreA, scoreB, defendsA, defendsB, turnoversA, turnoversB, events, absentPlayers]);

  // After saving or resetting, clear localStorage
  const clearGameState = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

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
  const allPlayers = Array.from(new Map([...teamA, ...teamB, ...players].filter(p => !absentPlayers.some(a => a.id === p.id)).map(p => [p.id, p])).values());
  const filteredPlayers =
    eventModal
      ? allPlayers.filter(p => p.name.toLowerCase().includes(playerQuery.toLowerCase()))
      : allPlayers.filter(p => p.name.toLowerCase().includes(playerQuery.toLowerCase()));

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

  // End game and save to DB
  const handleEndGame = async () => {
    setTimerActive(false);
    if (!teamId) {
      setError('No team selected.');
      return;
    }
    // Prompt for confirmation
    const confirmSave = window.confirm('Are you sure you want to end the game and save all data? This cannot be undone.');
    if (!confirmSave) return;
    setLoading(true);
    setError(null);
    try {
      // Save game
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({
          team_id: teamId,
          opponent: 'TBD',
          game_date: new Date().toISOString(),
          final_score_us: scoreA,
          final_score_them: scoreB,
          game_type: 'Tally',
        })
        .select()
        .single();
      if (gameError) throw gameError;
      // Save events
      const eventRows = events.map((e) => {
        if (e.type === 'score') {
          return {
            game_id: game.id,
            thrower_id: e.assister?.id || null,
            receiver_id: e.scorer?.id || null,
            result: 'goal',
            point_number: null,
            timestamp: new Date().toISOString(),
          };
        } else if (e.type === 'defend') {
          return {
            game_id: game.id,
            thrower_id: e.player?.id || null,
            receiver_id: null,
            result: 'defense',
            point_number: null,
            timestamp: new Date().toISOString(),
          };
        } else if (e.type === 'turnover') {
          return {
            game_id: game.id,
            thrower_id: e.player?.id || null,
            receiver_id: null,
            result: 'turnover',
            point_number: null,
            timestamp: new Date().toISOString(),
          };
        }
        return null;
      }).filter(Boolean);
      if (eventRows.length > 0) {
        const { error: eventsError } = await supabase
          .from('events')
          .insert(eventRows);
        if (eventsError) throw eventsError;
      }
      // Save lineups for both teams
      const lineupRows = [
        {
          game_id: game.id,
          team: 'Dark',
          player_ids: teamA.map((p) => p.id),
        },
        {
          game_id: game.id,
          team: 'Light',
          player_ids: teamB.map((p) => p.id),
        },
      ];
      const { error: lineupError } = await supabase
        .from('lineups')
        .insert(lineupRows);
      if (lineupError) throw lineupError;

      // Allocate tally points to winning team players
      // --- Migration needed: create table tally_points (id uuid pk, game_id uuid, player_id uuid, created_at timestamptz default now())
      let winner: 'Dark' | 'Light' | null = null;
      if (scoreA > scoreB) winner = 'Dark';
      else if (scoreB > scoreA) winner = 'Light';
      if (winner) {
        const winningPlayers = winner === 'Dark' ? teamA : teamB;
        const tallyRows = winningPlayers.map((p) => ({
          game_id: game.id,
          player_id: p.id,
        }));
        if (tallyRows.length > 0) {
          const { error: tallyError } = await supabase
            .from('tally_points')
            .insert(tallyRows);
          if (tallyError) {
            // If table does not exist, show a message
            alert('Tally points table missing. Please run the migration to create tally_points table.');
          }
        }
      }

      // Optionally: show confirmation or reset state
      setStep('teams');
      setEvents([]);
      setScoreA(0);
      setScoreB(0);
      setDefendsA(0);
      setDefendsB(0);
      setTurnoversA(0);
      setTurnoversB(0);
      setTeamA([]);
      setTeamB([]);
      setPlayers([]);
      setAbsentPlayers([]);
      clearGameState();
      alert('Game and events saved!');
    } catch (err: any) {
      setError(err.message || 'Failed to save game.');
    } finally {
      setLoading(false);
    }
  };

  // Open modal for editing an event
  const handleEditEvent = (idx: number) => {
    const event = events[idx];
    if (!event) return;
    if (event.type === 'score') {
      setEventModal({ type: 'score', step: 0, data: { assister: event.assister } });
      setEditEventIdx(idx);
      setPlayerQuery('');
    } else if (event.type === 'defend') {
      setEventModal({ type: 'defend', step: 0, data: { player: event.player } });
      setEditEventIdx(idx);
      setPlayerQuery('');
    } else if (event.type === 'turnover') {
      setEventModal({ type: 'turnover', step: 0, data: { player: event.player, turnoverType: event.turnoverType } });
      setEditEventIdx(idx);
      setPlayerQuery('');
    }
  };

  // When saving an event, replace if editing
  const handleModalNext = (value: any) => {
    if (!eventModal) return;
    const { type, step, data } = eventModal;
    if (type === 'score') {
      if (step === 0) {
        setEventModal({ type, step: 1, data: { ...data, assister: value } });
        setPlayerQuery('');
      } else if (step === 1) {
        const newEvent = { type: 'score', assister: data.assister, scorer: value, time: timer };
        if (editEventIdx !== null) {
          const updated = [...events];
          updated[editEventIdx] = newEvent;
          setEvents(updated);
          setEditEventIdx(null);
        } else {
          setEvents([...events, newEvent]);
        }
        setScoreA(teamA.some(p => p.id === value.id) ? scoreA + 1 : scoreA);
        setScoreB(teamB.some(p => p.id === value.id) ? scoreB + 1 : scoreB);
        closeModal();
      }
    } else if (type === 'defend') {
      const newEvent = { type: 'defend', player: value, time: timer };
      if (editEventIdx !== null) {
        const updated = [...events];
        updated[editEventIdx] = newEvent;
        setEvents(updated);
        setEditEventIdx(null);
      } else {
        setEvents([...events, newEvent]);
      }
      setDefendsA(teamA.some(p => p.id === value.id) ? defendsA + 1 : defendsA);
      setDefendsB(teamB.some(p => p.id === value.id) ? defendsB + 1 : defendsB);
      closeModal();
    } else if (type === 'turnover') {
      if (step === 0) {
        setEventModal({ type, step: 1, data: { ...data, player: value } });
      } else if (step === 1) {
        const newEvent = { type: 'turnover', player: data.player, turnoverType: value, time: timer };
        if (editEventIdx !== null) {
          const updated = [...events];
          updated[editEventIdx] = newEvent;
          setEvents(updated);
          setEditEventIdx(null);
        } else {
          setEvents([...events, newEvent]);
        }
        setTurnoversA(teamA.some(p => p.id === data.player.id) ? turnoversA + 1 : turnoversA);
        setTurnoversB(teamB.some(p => p.id === data.player.id) ? turnoversB + 1 : turnoversB);
        closeModal();
      }
    }
  };

  // Focus input and animate on modal step change
  useEffect(() => {
    if (eventModal && inputRef.current) {
      inputRef.current.focus();
    }
    setModalStepKey(prev => prev + 1); // triggers animation
  }, [eventModal]);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto p-4 space-y-10">
        {/* Example: Main heading and step cards */}
        {step === 'teams' && (
          <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
            <h1 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">Create Tally Game</h1>
            {/* ...rest of the step UI... */}
          </div>
        )}
        {/* ...other steps/cards would be similarly styled... */}
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