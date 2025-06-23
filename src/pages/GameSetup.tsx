import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Game } from '../types/game';

const GameSetup = () => {
    const [opponent, setOpponent] = useState('');
    const [gameDate, setGameDate] = useState('');
    const [gameType, setGameType] = useState('Regular Season');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleCreateGame = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase
                .from('games')
                .insert({
                    opponent,
                    game_date: gameDate || null,
                    game_type: gameType,
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Navigate to the live game page for the newly created game
                navigate(`/game/live/${data.id}`);
            }
        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-lg">
            <h1 className="text-2xl font-bold mb-4">Setup New Game</h1>
            <div className="bg-white p-6 rounded-lg shadow-md">
                <form onSubmit={handleCreateGame}>
                    <div className="mb-4">
                        <label htmlFor="opponent" className="block text-sm font-medium text-gray-700">Opponent Name</label>
                        <input
                            id="opponent"
                            type="text"
                            value={opponent}
                            onChange={(e) => setOpponent(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label htmlFor="game_date" className="block text-sm font-medium text-gray-700">Date</label>
                        <input
                            id="game_date"
                            type="date"
                            value={gameDate}
                            onChange={(e) => setGameDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="game_type" className="block text-sm font-medium text-gray-700">Game Type</label>
                        <select
                            id="game_type"
                            value={gameType}
                            onChange={(e) => setGameType(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2"
                        >
                            <option>Regular Season</option>
                            <option>Playoffs</option>
                            <option>Tournament</option>
                            <option>Scrimmage</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">Error: {error}</p>}
                    
                    <button 
                        type="submit" 
                        className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Creating Game...' : 'Start Game'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default GameSetup; 