import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Game } from '../types/game';
import type { Player } from '../types/player';
import type { Event } from '../types/event';

// Helper: get player name by id
const getPlayerName = (players: Player[], id: string | null) => {
  const p = players.find((pl) => pl.id === id);
  return p ? p.name : 'Unknown';
};

const AnalyticsDashboard = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [tallyOpen, setTallyOpen] = useState(false);
  const [lineups, setLineups] = useState<Record<string, { Dark: string[]; Light: string[] }>>({});
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [chemistryOpen, setChemistryOpen] = useState(false);

  // Fetch data for dashboard
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: gamesData, error: gamesError } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .order('game_date', { ascending: false });
      if (gamesError) throw gamesError;
      setGames(gamesData || []);

      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId);
      if (playersError) throw playersError;
      setPlayers(playersData || []);

      const gameIds = (gamesData || []).map((g: Game) => g.id);
      let eventsData: Event[] = [];
      if (gameIds.length > 0) {
        const { data: eventsRaw, error: eventsError } = await supabase
          .from('events')
          .select('*')
          .in('game_id', gameIds);
        if (eventsError) throw eventsError;
        eventsData = eventsRaw || [];
      }
      setEvents(eventsData);

      // Fetch lineups for these games
      if (gameIds.length > 0) {
        const { data: lineupsRaw, error: lineupsError } = await supabase
          .from('lineups')
          .select('game_id, team, player_ids')
          .in('game_id', gameIds);
        if (lineupsError) throw lineupsError;
        // Organize as { [game_id]: { Dark: [...], Light: [...] } }
        const lineupMap: Record<string, { Dark: string[]; Light: string[] }> = {};
        (lineupsRaw || []).forEach((row: any) => {
          if (!lineupMap[row.game_id]) lineupMap[row.game_id] = { Dark: [], Light: [] };
          if (row.team === 'Dark') lineupMap[row.game_id].Dark = row.player_ids || [];
          if (row.team === 'Light') lineupMap[row.game_id].Light = row.player_ids || [];
        });
        setLineups(lineupMap);
      } else {
        setLineups({});
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  // --- Analytics Calculations ---
  // 1. Top-Level Metrics (last 5 games)
  const last5Games = useMemo(() => games.slice(0, 5), [games]);
  const last5GameIds = useMemo(() => last5Games.map((g) => g.id), [last5Games]);
  const last5Events = useMemo(() => events.filter((e) => last5GameIds.includes(e.game_id)), [events, last5GameIds]);

  // Team Completion % and Turnover Rate
  const completionStats = useMemo(() => {
    const completions = last5Events.filter((e) => e.result === 'completion').length;
    const turnovers = last5Events.filter((e) => e.result === 'turnover').length;
    const totalThrows = completions + turnovers;
    return {
      completionPct: totalThrows > 0 ? Math.round((completions / totalThrows) * 100) : 0,
      turnoverRate: totalThrows > 0 ? Math.round((turnovers / totalThrows) * 100) : 0,
      completions,
      turnovers,
      totalThrows,
    };
  }, [last5Events]);

  // Trend indicators (compare last 5 vs previous 5)
  const prev5Games = useMemo(() => games.slice(5, 10), [games]);
  const prev5GameIds = useMemo(() => prev5Games.map((g) => g.id), [prev5Games]);
  const prev5Events = useMemo(() => events.filter((e) => prev5GameIds.includes(e.game_id)), [events, prev5GameIds]);

  // 2. Player Spotlight
  const playerStats = useMemo(() => {
    // For each player, calculate completions, turnovers, goals, assists
    const stats: Record<string, any> = {};
    players.forEach((p) => {
      stats[p.id] = {
        name: p.name,
        completions: 0,
        turnovers: 0,
        goals: 0,
        assists: 0,
      };
    });
    events.forEach((e) => {
      if (e.result === 'completion' && e.thrower_id && e.thrower_id in stats) stats[e.thrower_id].completions++;
      if (e.result === 'turnover' && e.thrower_id && e.thrower_id in stats) stats[e.thrower_id].turnovers++;
      if (e.result === 'goal' && e.receiver_id && e.receiver_id in stats) stats[e.receiver_id].goals++;
      if (e.result === 'goal' && e.thrower_id && e.thrower_id in stats) stats[e.thrower_id].assists++;
    });
    return stats;
  }, [players, events]);

  // 3. Chemistry Heat Map (player-pair completions)
  const chemistryMatrix = useMemo(() => {
    // Matrix: thrower_id -> receiver_id -> completions
    const matrix: Record<string, Record<string, number>> = {};
    players.forEach((p1) => {
      matrix[p1.id] = {};
      players.forEach((p2) => {
        matrix[p1.id][p2.id] = 0;
      });
    });
    events.forEach((e) => {
      if (e.result === 'completion' && e.thrower_id && e.receiver_id) {
        matrix[e.thrower_id][e.receiver_id]++;
      }
    });
    return matrix;
  }, [players, events]);

  // 4. Line Performance Analysis (placeholder, as lineups table is not yet used)
  // 5. Quick Insights (simple suggestions)
  const quickInsights = useMemo(() => {
    const insights: string[] = [];
    // Example: find best player pair
    let bestPair = { ids: [null as string | null, null as string | null], value: 0 };
    players.forEach((p1) => {
      players.forEach((p2) => {
        if (p1.id !== p2.id && chemistryMatrix[p1.id] && chemistryMatrix[p1.id][p2.id] > bestPair.value) {
          bestPair = { ids: [p1.id, p2.id], value: chemistryMatrix[p1.id][p2.id] };
        }
      });
    });
    if (bestPair.ids[0] && bestPair.ids[1] && bestPair.value > 0) {
      insights.push(`Consider pairing ${getPlayerName(players, bestPair.ids[0])} with ${getPlayerName(players, bestPair.ids[1])} more often.`);
    }
    // Example: player with most completions
    const mostCompletions = Object.values(playerStats).sort((a: any, b: any) => b.completions - a.completions)[0];
    if (mostCompletions && mostCompletions.completions > 0) {
      insights.push(`${mostCompletions.name} is excelling at completions.`);
    } else if (insights.length === 0) {
      insights.push('No completion data available yet.');
    }
    return insights;
  }, [players, chemistryMatrix, playerStats]);

  // Player Spotlight: running totals for last 5 games
  const playerSpotlightStats = useMemo(() => {
    const stats: Record<string, { name: string; completions: number; turnovers: number; goals: number; assists: number }> = {};
    players.forEach((p) => {
      stats[p.id] = { name: p.name, completions: 0, turnovers: 0, goals: 0, assists: 0 };
    });
    last5Events.forEach((e) => {
      if (e.result === 'completion' && e.thrower_id) stats[e.thrower_id].completions++;
      if (e.result === 'turnover' && e.thrower_id) stats[e.thrower_id].turnovers++;
      if (e.result === 'goal' && e.receiver_id) stats[e.receiver_id].goals++;
      if (e.result === 'goal' && e.thrower_id) stats[e.thrower_id].assists++;
    });
    return stats;
  }, [players, last5Events]);

  // Player Tally: count wins for each player in all games using lineups
  const playerTally = useMemo(() => {
    const tallies: Record<string, { id: string; name: string; tally: number }> = {};
    players.forEach((p) => {
      tallies[p.id] = { id: p.id, name: p.name, tally: 0 };
    });
    games.forEach((g) => {
      if (
        g.final_score_us != null &&
        g.final_score_them != null &&
        lineups[g.id]
      ) {
        let winner: 'Dark' | 'Light' | null = null;
        if (g.final_score_us > g.final_score_them) winner = 'Dark';
        else if (g.final_score_them > g.final_score_us) winner = 'Light';
        if (winner) {
          (lineups[g.id][winner] || []).forEach((pid) => {
            if (tallies[pid]) tallies[pid].tally++;
          });
        }
      }
    });
    return Object.values(tallies).sort((a, b) => b.tally - a.tally);
  }, [players, games, lineups]);

  // --- UI ---
  const hasData = (completionStats.totalThrows > 0 || events.length > 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-10">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-10 text-center tracking-tight">Analytics Dashboard</h1>
        {loading && <div className="text-center text-lg">Loading analytics...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {!loading && !error && (
          <>
            {/* 1. Top-Level Metrics Section */}
            {/* removed top-level metrics section as requested */}

            {/* 2. Player Spotlight Section */}
            {hasData ? (
              <section className="bg-white rounded-lg shadow p-6 mt-8">
                <button
                  className="w-full text-left font-bold text-xl mb-4 flex items-center justify-between"
                  onClick={() => setSpotlightOpen((open) => !open)}
                >
                  Player Spotlight (Last 5 Games)
                  <span>{spotlightOpen ? '▲' : '▼'}</span>
                </button>
                {spotlightOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.values(playerSpotlightStats).map((stat) => (
                      <div key={stat.name} className="bg-gray-100 rounded p-4 text-center">
                        <div className="text-lg font-semibold text-gray-800">{stat.name}</div>
                        <div className="text-sm text-gray-700">Completions: {stat.completions}</div>
                        <div className="text-sm text-gray-700">Turnovers: {stat.turnovers}</div>
                        <div className="text-sm text-gray-700">Goals: {stat.goals}</div>
                        <div className="text-sm text-gray-700">Assists: {stat.assists}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-white rounded-lg shadow p-6 mt-8 flex flex-col items-center">
                <div className="text-lg text-gray-500">No player stats available yet.</div>
              </section>
            )}

            {/* 3. Player Tally Section */}
            {hasData ? (
              <section className="bg-white rounded-lg shadow p-6 mt-8">
                <button
                  className="w-full text-left font-bold text-xl mb-4 flex items-center justify-between"
                  onClick={() => setTallyOpen((open) => !open)}
                >
                  Player Tally
                  <span>{tallyOpen ? '▲' : '▼'}</span>
                </button>
                {tallyOpen && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-center">
                      <thead>
                        <tr>
                          <th className="p-2 border-b">Rank</th>
                          <th className="p-2 border-b">Player</th>
                          <th className="p-2 border-b">Tally Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {playerTally.map((p, i) => (
                          <tr key={p.name} className={i === 0 ? 'bg-green-100 font-bold' : ''}>
                            <td className="p-2 border-b">{i + 1}</td>
                            <td className="p-2 border-b">{p.name}</td>
                            <td className="p-2 border-b">{p.tally}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-white rounded-lg shadow p-6 mt-8 flex flex-col items-center">
                <div className="text-lg text-gray-500">No tally data available yet.</div>
              </section>
            )}

            {/* 4. Chemistry Heat Map */}
            {hasData ? (
              <section className="bg-white rounded-lg shadow p-6 mt-8">
                <button
                  className="w-full text-left font-bold text-xl mb-4 flex items-center justify-between"
                  onClick={() => setChemistryOpen((open) => !open)}
                >
                  Chemistry Heat Map
                  <span>{chemistryOpen ? '▲' : '▼'}</span>
                </button>
                {chemistryOpen && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-center">
                      <thead>
                        <tr>
                          <th className="p-2 border-b"></th>
                          {players.map((p) => (
                            <th key={p.id} className="p-2 border-b">{p.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {players.map((rowP) => (
                          <tr key={rowP.id}>
                            <td className="p-2 border-b font-semibold">{rowP.name}</td>
                            {players.map((colP) => {
                              if (rowP.id === colP.id) {
                                return <td key={colP.id} className="bg-gray-100">-</td>;
                              }
                              const value = chemistryMatrix[rowP.id][colP.id];
                              let color = '';
                              if (value >= 10) color = 'bg-green-200';
                              else if (value >= 5) color = 'bg-yellow-200';
                              else if (value > 0) color = 'bg-red-200';
                              return (
                                <td key={colP.id} className={`${color} cursor-pointer`}>{value}</td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-2 text-sm text-gray-500">Top 3 partnerships highlighted</div>
                  </div>
                )}
              </section>
            ) : (
              <section className="bg-white rounded-lg shadow p-6 mt-8 flex flex-col items-center">
                <div className="text-lg text-gray-500">No chemistry data available yet.</div>
              </section>
            )}

            {/* Game History Section */}
            <section className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Game History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full border text-center">
                  <thead>
                    <tr>
                      <th className="p-2 border-b">Date</th>
                      <th className="p-2 border-b">Score</th>
                      <th className="p-2 border-b">Winner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...games].sort((a, b) => {
                      const dateA = a.game_date ? new Date(a.game_date).getTime() : 0;
                      const dateB = b.game_date ? new Date(b.game_date).getTime() : 0;
                      return dateB - dateA;
                    }).map((g) => {
                      let winner = '-';
                      if (g.final_score_us != null && g.final_score_them != null) {
                        if (g.final_score_us > g.final_score_them) winner = 'Dark';
                        else if (g.final_score_them > g.final_score_us) winner = 'Light';
                        else winner = 'Tie';
                      }
                      return (
                        <tr key={g.id}>
                          <td className="p-2 border-b">{g.game_date ? new Date(g.game_date).toLocaleDateString() : '-'}</td>
                          <td className="p-2 border-b">{g.final_score_us != null && g.final_score_them != null ? `${g.final_score_us} - ${g.final_score_them}` : '-'}</td>
                          <td className="p-2 border-b">{winner}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {games.length === 0 && <div className="text-gray-500 mt-2">No games played yet.</div>}
              </div>
            </section>

            {/* 5. Line Performance Analysis (placeholder) */}
            {hasData ? (
              <section className="bg-white rounded-lg shadow p-6 mt-8">
                <h2 className="text-xl font-bold mb-4">Line Performance Analysis</h2>
                <div className="text-gray-500">Lineup analytics coming soon.</div>
              </section>
            ) : (
              <section className="bg-white rounded-lg shadow p-6 mt-8 flex flex-col items-center">
                <div className="text-lg text-gray-500">No line performance data available yet.</div>
              </section>
            )}

            {/* 6. Quick Insights/Action Items */}
            {hasData ? (
              <section className="bg-white rounded-lg shadow p-6 mt-8">
                <h2 className="text-xl font-bold mb-4">Quick Insights & Action Items</h2>
                <ul className="list-disc pl-6 space-y-2 text-left">
                  {quickInsights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </section>
            ) : (
              <section className="bg-white rounded-lg shadow p-6 mt-8 flex flex-col items-center">
                <div className="text-lg text-gray-500">No insights available yet.</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 