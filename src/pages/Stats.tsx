import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Game } from '../types/game';
import type { Player } from '../types/player';
import type { Event } from '../types/event';

interface PlayerStats {
    goals: number;
    assists: number;
    turnovers: number;
}

interface Connection {
    thrower: string;
    receiver: string;
    count: number;
}

const Stats = () => {
    const [games, setGames] = useState<Game[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [selectedGameId, setSelectedGameId] = useState<string>('');
    const [gameEvents, setGameEvents] = useState<Event[]>([]);
    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const { data: gamesData, error: gamesError } = await supabase
                    .from('games')
                    .select('*')
                    .order('game_date', { ascending: false });
                if (gamesError) throw gamesError;
                setGames(gamesData || []);

                const { data: playersData, error: playersError } = await supabase
                    .from('players')
                    .select('*');
                if (playersError) throw playersError;
                setPlayers(playersData || []);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedGameId) {
            setGameEvents([]);
            return;
        }

        const fetchGameEvents = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .eq('game_id', selectedGameId);
            
            if (error) {
                console.error("Error fetching game events:", error);
                setGameEvents([]);
            } else {
                setGameEvents(data || []);
            }
            setLoading(false);
        };

        fetchGameEvents();
    }, [selectedGameId]);

    useEffect(() => {
        if (gameEvents.length === 0) {
            setPlayerStats({});
            setConnections([]);
            return;
        }

        const stats: Record<string, PlayerStats> = {};
        const connectionMap: Record<string, number> = {};

        players.forEach(p => {
            stats[p.id] = { goals: 0, assists: 0, turnovers: 0 };
        });

        gameEvents.forEach(event => {
            if (event.result === 'Goal') {
                if (event.receiver_id) {
                    stats[event.receiver_id].goals++;
                }
                if (event.thrower_id) {
                    stats[event.thrower_id].assists++;
                }
                 if (event.thrower_id && event.receiver_id) {
                    const key = `${event.thrower_id}->${event.receiver_id}`;
                    connectionMap[key] = (connectionMap[key] || 0) + 1;
                }
            } else if (event.result === 'Turnover') {
                if (event.thrower_id) {
                    stats[event.thrower_id].turnovers++;
                }
            }
        });

        setPlayerStats(stats);
        
        const sortedConnections = Object.entries(connectionMap)
            .map(([key, count]) => {
                const [throwerId, receiverId] = key.split('->');
                const throwerName = players.find(p => p.id === throwerId)?.name || 'Unknown';
                const receiverName = players.find(p => p.id === receiverId)?.name || 'Unknown';
                return { thrower: throwerName, receiver: receiverName, count };
            })
            .sort((a, b) => b.count - a.count);

        setConnections(sortedConnections);

    }, [gameEvents, players]);

    const getTopPlayers = (stat: keyof PlayerStats) => {
        return Object.entries(playerStats)
            .map(([playerId, stats]) => ({
                name: players.find(p => p.id === playerId)?.name || 'Unknown',
                stat: stats[stat]
            }))
            .filter(p => p.stat > 0)
            .sort((a, b) => b.stat - a.stat)
            .slice(0, 5);
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Game Statistics</h1>

            <div className="mb-6">
                <label htmlFor="game-select" className="block text-sm font-medium text-gray-700">Select a Game</label>
                <select
                    id="game-select"
                    value={selectedGameId}
                    onChange={(e) => setSelectedGameId(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                >
                    <option value="" disabled>-- Select a game --</option>
                    {games.map(game => (
                        <option key={game.id} value={game.id}>
                            {game.game_date} - vs. {game.opponent}
                        </option>
                    ))}
                </select>
            </div>

            {loading && <p>Loading stats...</p>}

            {!loading && selectedGameId && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Goals Leaderboard */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">Goals</h2>
                        <ul>{getTopPlayers('goals').map(p => <li key={p.name} className="flex justify-between py-1"><span>{p.name}</span><span className="font-bold">{p.stat}</span></li>)}</ul>
                    </div>
                    {/* Assists Leaderboard */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">Assists</h2>
                        <ul>{getTopPlayers('assists').map(p => <li key={p.name} className="flex justify-between py-1"><span>{p.name}</span><span className="font-bold">{p.stat}</span></li>)}</ul>
                    </div>
                    {/* Turnovers */}
                    <div className="bg-white p-4 rounded-lg shadow">
                        <h2 className="text-xl font-semibold mb-2">Turnovers</h2>
                         <ul>{getTopPlayers('turnovers').map(p => <li key={p.name} className="flex justify-between py-1"><span>{p.name}</span><span className="font-bold">{p.stat}</span></li>)}</ul>
                    </div>
                    {/* Top Connections */}
                    <div className="bg-white p-4 rounded-lg shadow md:col-span-2">
                        <h2 className="text-xl font-semibold mb-2">Top Connections (Goals)</h2>
                        <ul>
                            {connections.slice(0, 5).map(c => (
                                <li key={`${c.thrower}-${c.receiver}`} className="flex justify-between py-1">
                                    <span>{c.thrower} → {c.receiver}</span>
                                    <span className="font-bold">{c.count}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stats; 