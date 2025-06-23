import { useState, useEffect } from 'react';
// import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

const LOCAL_STORAGE_KEY = 'ultimate-stats-active-game';

const CreateTallyGame = () => {
  // const [searchParams] = useSearchParams();
  // const teamId = searchParams.get('teamId');
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
  // const clearGameState = () => { /* ... */ };

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