import React, { useState, useRef, useEffect } from 'react';

export interface Player {
  id: string;
  name: string;
  team: 'A' | 'B'; // 'A' = teamA, 'B' = teamB
}

export type EventType = 'score' | 'defend' | 'turnover';
export type TurnoverType = 'Throwing' | 'Catching' | 'Skip';

export interface TallyEvent {
  type: EventType;
  team: 'A' | 'B';
  assister?: Player | null;
  scorer?: Player | null;
  defender?: Player;
  turnoverPlayer?: Player;
  turnoverType?: TurnoverType;
  timestamp: number;
}

interface Props {
  presentPlayers: Player[];
  teamAName: string;
  teamBName: string;
  onUpdateTallies?: (tallies: any, eventLog: TallyEvent[]) => void;
}

const LOCAL_STORAGE_KEY = 'tally-game-event-recorder';

const TallyGameEventRecorder: React.FC<Props> = ({ presentPlayers, teamAName, teamBName, onUpdateTallies }) => {
  // Tallies
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [defendsA, setDefendsA] = useState(0);
  const [defendsB, setDefendsB] = useState(0);
  const [turnoversA, setTurnoversA] = useState(0);
  const [turnoversB, setTurnoversB] = useState(0);
  // Event log
  const [eventLog, setEventLog] = useState<TallyEvent[]>([]);
  // Modal state
  const [modal, setModal] = useState<{ type: EventType | null; step: number; data: any } | null>(null);
  // Autocomplete state
  const [autocomplete, setAutocomplete] = useState({ input: '', options: presentPlayers, selected: null as Player | null });
  const [turnoverType, setTurnoverType] = useState<TurnoverType>('Throwing');
  const modalRef = useRef<HTMLDivElement>(null);
  // Add state for recent players
  const [recentPlayers, setRecentPlayers] = useState<Player[]>([]);

  // Persist state in localStorage
  useEffect(() => {
    const state = { scoreA, scoreB, defendsA, defendsB, turnoversA, turnoversB, eventLog };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    if (onUpdateTallies) onUpdateTallies({ scoreA, scoreB, defendsA, defendsB, turnoversA, turnoversB }, eventLog);
  }, [scoreA, scoreB, defendsA, defendsB, turnoversA, turnoversB, eventLog, onUpdateTallies]);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setScoreA(parsed.scoreA || 0);
        setScoreB(parsed.scoreB || 0);
        setDefendsA(parsed.defendsA || 0);
        setDefendsB(parsed.defendsB || 0);
        setTurnoversA(parsed.turnoversA || 0);
        setTurnoversB(parsed.turnoversB || 0);
        setEventLog(parsed.eventLog || []);
      } catch {}
    }
  }, []);

  // Modal animation (fade/slide)
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.classList.remove('animate-fade-slide');
      void modalRef.current.offsetWidth;
      modalRef.current.classList.add('animate-fade-slide');
    }
  }, [modal?.step]);

  // --- Event Handlers ---
  const openModal = (type: EventType) => {
    setModal({ type, step: 0, data: {} });
    setAutocomplete({ input: '', options: presentPlayers, selected: null });
    setTurnoverType('Throwing');
  };
  const closeModal = () => setModal(null);

  // --- Score Flow ---
  const handleScoreStep = (step: number, value: Player | null) => {
    if (step === 0) {
      setModal(m => m && { ...m, step: 1, data: { assister: value } });
      setAutocomplete({ input: '', options: presentPlayers, selected: null });
      if (value) setRecentPlayers(r => [value, ...r.filter(p => p.id !== value.id)].slice(0, 5));
    } else if (step === 1) {
      const assister = modal?.data.assister || null;
      const scorer = value;
      if (!scorer) return;
      // Find team
      const team = scorer.team;
      // Log event
      const event: TallyEvent = {
        type: 'score',
        team,
        assister,
        scorer,
        timestamp: Date.now(),
      };
      setEventLog(log => [...log, event]);
      if (team === 'A') setScoreA(s => s + 1);
      else setScoreB(s => s + 1);
      if (value) setRecentPlayers(r => [value, ...r.filter(p => p.id !== value.id)].slice(0, 5));
      closeModal();
    }
  };

  // --- Defend Flow ---
  const handleDefend = (player: Player) => {
    if (!player) return;
    const team = player.team;
    const event: TallyEvent = {
      type: 'defend',
      team,
      defender: player,
      timestamp: Date.now(),
    };
    setEventLog(log => [...log, event]);
    if (team === 'A') setDefendsA(d => d + 1);
    else setDefendsB(d => d + 1);
    setRecentPlayers(r => [player, ...r.filter(p => p.id !== player.id)].slice(0, 5));
    closeModal();
  };

  // --- Turnover Flow ---
  const handleTurnoverStep = (step: number, value: any) => {
    if (step === 0) {
      setModal(m => m && { ...m, step: 1, data: { player: value } });
      if (value) setRecentPlayers(r => [value, ...r.filter(p => p.id !== value.id)].slice(0, 5));
    } else if (step === 1) {
      const player = modal?.data.player;
      const type = value as TurnoverType;
      if (!player) return;
      const team = player.team;
      const event: TallyEvent = {
        type: 'turnover',
        team,
        turnoverPlayer: player,
        turnoverType: type,
        timestamp: Date.now(),
      };
      setEventLog(log => [...log, event]);
      if (team === 'A') setTurnoversA(t => t + 1);
      else setTurnoversB(t => t + 1);
      closeModal();
    }
  };

  // --- Undo ---
  const handleUndo = () => {
    if (eventLog.length === 0) return;
    const last = eventLog[eventLog.length - 1];
    setEventLog(log => log.slice(0, -1));
    // Update tallies
    if (last.type === 'score') {
      if (last.team === 'A') setScoreA(s => Math.max(0, s - 1));
      else setScoreB(s => Math.max(0, s - 1));
    } else if (last.type === 'defend') {
      if (last.team === 'A') setDefendsA(d => Math.max(0, d - 1));
      else setDefendsB(d => Math.max(0, d - 1));
    } else if (last.type === 'turnover') {
      if (last.team === 'A') setTurnoversA(t => Math.max(0, t - 1));
      else setTurnoversB(t => Math.max(0, t - 1));
    }
  };

  // --- Autocomplete Logic ---
  const getAutocompleteOptions = (input: string) => {
    const normalizedInput = input.trim().toLowerCase().normalize();
    const filtered = presentPlayers.filter(p =>
      p.name.trim().toLowerCase().normalize().includes(normalizedInput)
    );
    return filtered;
  };

  // --- Render ---
  return (
    <div className="w-full max-w-md mx-auto p-2">
      {/* Tallies */}
      <div className="flex justify-between mb-4">
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-blue-700">{teamAName}</div>
          <div className="text-3xl font-extrabold">{scoreA}</div>
          <div className="text-sm text-blue-700">Defends: {defendsA} | TO: {turnoversA}</div>
        </div>
        <div className="flex-1 text-center">
          <div className="text-2xl font-bold text-red-700">{teamBName}</div>
          <div className="text-3xl font-extrabold">{scoreB}</div>
          <div className="text-sm text-red-700">Defends: {defendsB} | TO: {turnoversB}</div>
        </div>
      </div>
      {/* Event Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button className="bg-blue-600 text-white rounded-xl py-6 text-xl font-bold shadow hover:bg-blue-700 transition" onClick={() => openModal('score')}>Score</button>
        <button className="bg-green-600 text-white rounded-xl py-6 text-xl font-bold shadow hover:bg-green-700 transition" onClick={() => openModal('defend')}>Defend</button>
        <button className="bg-red-600 text-white rounded-xl py-6 text-xl font-bold shadow hover:bg-red-700 transition" onClick={() => openModal('turnover')}>Turnover</button>
        <button className="bg-gray-400 text-white rounded-xl py-6 text-xl font-bold shadow hover:bg-gray-500 transition" onClick={handleUndo}>Undo</button>
      </div>
      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40" onClick={closeModal}>
          <div
            ref={modalRef}
            className="w-full max-w-md bg-white rounded-t-2xl p-6 pb-8 shadow-lg animate-fade-slide overflow-y-auto sm:rounded-2xl sm:max-h-[80vh]"
            style={{
              maxHeight: '80vh',
              overscrollBehavior: 'contain',
              height: 'auto',
              ...(window.innerWidth <= 640 ? {
                borderRadius: 24,
                maxWidth: '95vw',
                maxHeight: '95vh',
                height: 'auto',
                padding: '2rem 1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              } : {})
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button for mobile */}
            <button
              className="absolute top-4 right-4 text-2xl font-bold text-gray-400 hover:text-gray-700 sm:hidden"
              onClick={closeModal}
              aria-label="Close"
            >
              &times;
            </button>
            {/* Score Flow */}
            {modal.type === 'score' && modal.step === 0 && (
              <>
                <div className="text-lg font-bold mb-2">Select Assister</div>
                <AutocompleteInput
                  options={getAutocompleteOptions(autocomplete.input)}
                  value={autocomplete.selected}
                  input={autocomplete.input}
                  onInput={input => setAutocomplete(a => ({ ...a, input }))}
                  onSelect={player => handleScoreStep(0, player)}
                  recentPlayers={recentPlayers}
                />
              </>
            )}
            {modal.type === 'score' && modal.step === 1 && (
              <>
                <div className="text-lg font-bold mb-2">Select Scorer</div>
                <AutocompleteInput
                  options={getAutocompleteOptions(autocomplete.input)}
                  value={autocomplete.selected}
                  input={autocomplete.input}
                  onInput={input => setAutocomplete(a => ({ ...a, input }))}
                  onSelect={player => handleScoreStep(1, player)}
                  recentPlayers={recentPlayers}
                />
              </>
            )}
            {/* Defend Flow */}
            {modal.type === 'defend' && (
              <>
                <div className="text-lg font-bold mb-2">Select Defender</div>
                <AutocompleteInput
                  options={getAutocompleteOptions(autocomplete.input)}
                  value={autocomplete.selected}
                  input={autocomplete.input}
                  onInput={input => setAutocomplete(a => ({ ...a, input }))}
                  onSelect={player => handleDefend(player)}
                  recentPlayers={recentPlayers}
                />
              </>
            )}
            {/* Turnover Flow */}
            {modal.type === 'turnover' && modal.step === 0 && (
              <>
                <div className="text-lg font-bold mb-2">Select Player</div>
                <AutocompleteInput
                  options={getAutocompleteOptions(autocomplete.input)}
                  value={autocomplete.selected}
                  input={autocomplete.input}
                  onInput={input => setAutocomplete(a => ({ ...a, input }))}
                  onSelect={player => handleTurnoverStep(0, player)}
                  recentPlayers={recentPlayers}
                />
              </>
            )}
            {modal.type === 'turnover' && modal.step === 1 && (
              <>
                <div className="text-lg font-bold mb-2">Turnover Type</div>
                <div className="flex gap-2 mb-4">
                  {(['Throwing', 'Catching', 'Skip'] as TurnoverType[]).map(type => (
                    <button
                      key={type}
                      className={`px-4 py-2 rounded-xl font-bold border ${turnoverType === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
                      onClick={() => { setTurnoverType(type); handleTurnoverStep(1, type); }}
                    >{type}</button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Journal Log */}
      <div className="mt-6">
        <div className="font-bold mb-2">Event Log</div>
        <div className="bg-gray-50 rounded-xl p-3 max-h-60 overflow-y-auto text-sm space-y-2">
          {eventLog.length === 0 && <div className="text-gray-400">No events yet.</div>}
          {eventLog.map((ev, i) => (
            <div key={i} className="flex items-center gap-2">
              {ev.type === 'score' && (
                <span className="text-blue-700 font-bold">Score:</span>
              )}
              {ev.type === 'defend' && (
                <span className="text-green-700 font-bold">Defend:</span>
              )}
              {ev.type === 'turnover' && (
                <span className="text-red-700 font-bold">Turnover:</span>
              )}
              <span>
                {ev.type === 'score' && (
                  <>
                    {ev.assister && ev.assister.id !== '0' ? <>{ev.assister.name} → </> : <>No Assister → </>}
                    <span className={ev.team === 'A' ? 'text-blue-700' : 'text-red-700'}>{ev.scorer?.name}</span>
                  </>
                )}
                {ev.type === 'defend' && (
                  <span className={ev.team === 'A' ? 'text-blue-700' : 'text-red-700'}>{ev.defender?.name}</span>
                )}
                {ev.type === 'turnover' && (
                  <>
                    <span className={ev.team === 'A' ? 'text-blue-700' : 'text-red-700'}>{ev.turnoverPlayer?.name}</span>
                    {ev.turnoverType && <span className="ml-1">({ev.turnoverType})</span>}
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Animation styles */}
      <style>{`
        .animate-fade-slide {
          animation: fadeSlideIn 0.25s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

// --- AutocompleteInput Component ---
interface AutocompleteInputProps {
  options: Player[];
  value: Player | null;
  input: string;
  onInput: (input: string) => void;
  onSelect: (player: Player) => void;
  recentPlayers: Player[];
}
const AutocompleteInput: React.FC<AutocompleteInputProps> = ({ options, value, input, onInput, onSelect, recentPlayers }) => {
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  // Always use the input state for the input value
  const displayValue = input;

  // When the user types, always clear the selection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onInput(e.target.value);
    setHighlight(0);
    if (value) {
      onSelect(null as any); // Always clear selection on typing
    }
  };

  // When a player is selected, set the input to their name and set the selected value
  const handleSelect = (player: Player) => {
    onInput(player.name);
    onSelect(player);
  };

  // Scroll input into view on focus (mobile)
  const handleFocus = () => {
    if (inputRef.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 200);
    }
  };

  // Dismiss keyboard on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        inputRef.current.blur();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="w-full">
      {/* Sticky search input */}
      <div className="sticky top-0 z-10 bg-white pb-2">
        <input
          ref={inputRef}
          className="w-full p-3 border border-gray-300 rounded-xl mb-2"
          placeholder="Type to search..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') setHighlight(h => Math.min(h + 1, options.length - 1));
            if (e.key === 'ArrowUp') setHighlight(h => Math.max(h - 1, 0));
            if (e.key === 'Enter') handleSelect(options[highlight]);
          }}
        />
        {/* Quick-select recent players */}
        {recentPlayers && recentPlayers.length > 0 && (
          <div className="flex gap-2 mb-2 overflow-x-auto">
            {recentPlayers.map((p) => (
              <button
                key={p.id}
                className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-semibold text-sm shadow hover:bg-blue-200 transition whitespace-nowrap"
                onClick={() => handleSelect(p)}
                type="button"
              >
                {p.name}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* Scrollable player list */}
      <ul className="max-h-[50vh] overflow-y-auto bg-white rounded-xl border border-gray-200">
        {options.map((p, i) => (
          <li
            key={p.id}
            className={`px-3 py-2 cursor-pointer ${i === highlight ? 'bg-blue-100' : ''}${value && value.id === p.id ? ' font-bold' : ''}`}
            onMouseEnter={() => setHighlight(i)}
            onClick={() => handleSelect(p)}
          >
            {p.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TallyGameEventRecorder; 