import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';
import type { Game } from '../types/game';

const LiveGame = () => {
    const { id: gameId } = useParams<{ id: string }>();
    const [game, setGame] = useState<Game | null>(null);
    const [players, setPlayers] = useState<Player[]>([]);
    const [lineup, setLineup] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Stat tracking state
    const [pointNumber, setPointNumber] = useState(1);
    const [thrower, setThrower] = useState<Player | null>(null);
    const [receiver, setReceiver] = useState<Player | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (!gameId) return;
            setLoading(true);
            setError(null);

            try {
                // Fetch game details
                const { data: gameData, error: gameError } = await supabase
                    .from('games')
                    .select('*')
                    .eq('id', gameId)
                    .single();
                if (gameError) throw gameError;
                setGame(gameData);

                // Fetch all players
                const { data: playersData, error: playersError } = await supabase
                    .from('players')
                    .select('*')
                    .order('name', { ascending: true });
                if (playersError) throw playersError;
                setPlayers(playersData);

            } catch (error: any) {
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [gameId]);

    const togglePlayerInLineup = (player: Player) => {
        setLineup(prevLineup => {
            const isInLineup = prevLineup.some(p => p.id === player.id);
            if (isInLineup) {
                // If the player being removed is the current thrower or receiver, clear them
                if (thrower?.id === player.id) setThrower(null);
                if (receiver?.id === player.id) setReceiver(null);
                return prevLineup.filter(p => p.id !== player.id);
            } else {
                if (prevLineup.length < 7) {
                    return [...prevLineup, player];
                }
                return prevLineup;
            }
        });
    };
    
    const isPlayerInLineup = (player: Player) => lineup.some(p => p.id === player.id);

    const handlePlayerTap = (player: Player) => {
        if (!thrower) {
            // 1. Select the thrower
            setThrower(player);
            setReceiver(null); // Ensure receiver is clear
        } else if (!receiver && player.id !== thrower.id) {
            // 2. Select the receiver
            setReceiver(player);
        } else if (receiver && player.id === receiver.id) {
            // 3. Pass was completed. The receiver becomes the new thrower.
            console.log(`Completion: ${thrower.name} to ${receiver.name}`);
            // You could record a "Completion" event here if desired
            setThrower(receiver);
            setReceiver(null);
        }
    };

    const recordEvent = async (result: 'Goal' | 'Turnover') => {
        if (!gameId || !thrower) {
            setError("A thrower must be selected.");
            return;
        }
        if (result === 'Goal' && !receiver) {
            setError("Please select a receiver for the goal.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const { error } = await supabase.from('events').insert({
                game_id: gameId,
                thrower_id: thrower.id,
                receiver_id: result === 'Turnover' ? null : receiver?.id,
                result: result,
                point_number: pointNumber,
            });

            if (error) throw error;
            
            alert(`${result} recorded!`);
            setPointNumber(prev => prev + 1);
            setThrower(null);
            setReceiver(null);
            
        } catch (error: any) {
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUndo = () => {
        if (receiver) setReceiver(null);
        else if (thrower) setThrower(null);
    };

    if (loading) return <div className="p-4">Loading game...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!game) return <div className="p-4">Game not found.</div>;

    return (
        <div className="container mx-auto p-4">
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">vs. {game.opponent}</h1>
                    <p className="text-gray-600">{game.game_date}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-xl font-bold">Point #{pointNumber}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Player Selection Column */}
                <div className="md:col-span-1">
                    <h2 className="text-xl font-semibold mb-2">Select Lineup ({lineup.length}/7)</h2>
                    <div className="bg-white p-4 rounded-lg shadow-md max-h-96 overflow-y-auto">
                        {players.map(player => (
                            <div
                                key={player.id}
                                onClick={() => togglePlayerInLineup(player)}
                                className={`p-2 my-1 rounded-md cursor-pointer flex justify-between items-center ${
                                    isPlayerInLineup(player)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                            >
                                <span>{player.name}</span>
                                <span className="font-mono text-sm">{player.jersey_number}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* On-Field / Stat-tracking Column */}
                <div className="md:col-span-2">
                    <h2 className="text-xl font-semibold mb-2">On Field Actions</h2>
                    <div className="bg-white p-4 rounded-lg shadow-md">
                        {lineup.length === 0 ? (
                            <p className="text-gray-500">Select players for the lineup to begin tracking stats.</p>
                        ) : (
                            <>
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                                    {lineup.map(player => (
                                        <div 
                                            key={player.id} 
                                            onClick={() => handlePlayerTap(player)}
                                            className={`p-3 rounded-lg text-center cursor-pointer transition-all duration-200
                                                ${thrower?.id === player.id 
                                                    ? 'bg-blue-300 ring-2 ring-blue-500 transform scale-105' 
                                                    : 'bg-gray-100'
                                                }
                                                ${receiver?.id === player.id
                                                    ? 'bg-yellow-300 ring-2 ring-yellow-500 transform scale-105'
                                                    : 'bg-green-100 border border-green-300 hover:bg-green-200'
                                                }
                                            `}
                                        >
                                            <p className="font-bold text-lg">{player.name}</p>
                                            <p className="text-sm text-gray-700">#{player.jersey_number}</p>
                                        </div>
                                    ))}
                                </div>
                                
                                {thrower && (
                                    <div className="mt-6 pt-4 border-t">
                                        <div className="mb-4">
                                            <p className="text-lg">
                                                Thrower: <span className="font-bold text-blue-600">{thrower.name}</span>
                                                {receiver && ` -> Receiver: `}
                                                {receiver && <span className="font-bold text-yellow-600">{receiver.name}</span>}
                                            </p>
                                            {receiver && <button onClick={() => handlePlayerTap(receiver)} className="text-sm text-indigo-600 hover:underline">(Tap here to confirm completion & continue)</button>}
                                        </div>
                                        <h3 className="text-lg font-semibold mb-2">Record Final Result:</h3>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <button
                                                onClick={() => recordEvent('Goal')}
                                                disabled={!receiver || isSubmitting}
                                                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >Goal</button>
                                            <button
                                                onClick={() => recordEvent('Turnover')}
                                                disabled={isSubmitting}
                                                className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
                                            >Turnover (by Thrower)</button>
                                            <button
                                                onClick={handleUndo}
                                                className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                                            >Undo Selection</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveGame; 