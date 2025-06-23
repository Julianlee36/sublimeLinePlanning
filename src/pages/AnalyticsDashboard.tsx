import React, { useEffect, useState, useMemo } from 'react';
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

  useEffect(() => {
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
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    if (teamId) fetchData();
  }, [teamId]);

  // --- Analytics Calculations ---
  // 1. Top-Level Metrics (last 5 games)
  const last5Games = useMemo(() => games.slice(0, 5), [games]);
  const last5GameIds = useMemo(() => last5Games.map((g) => g.id), [last5Games]);
  const last5Events = useMemo(() => events.filter((e) => last5GameIds.includes(e.game_id)), [events, last5GameIds]);

  // Win/Loss
  const winLoss = useMemo(() => {
    let wins = 0, losses = 0;
    last5Games.forEach((g) => {
      if (g.final_score_us != null && g.final_score_them != null) {
        if (g.final_score_us > g.final_score_them) wins++;
        else losses++;
      }
    });
    return { wins, losses };
  }, [last5Games]);

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
  const prevCompletionStats = useMemo(() => {
    const completions = prev5Events.filter((e) => e.result === 'completion').length;
    const turnovers = prev5Events.filter((e) => e.result === 'turnover').length;
    const totalThrows = completions + turnovers;
    return {
      completionPct: totalThrows > 0 ? Math.round((completions / totalThrows) * 100) : 0,
      turnoverRate: totalThrows > 0 ? Math.round((turnovers / totalThrows) * 100) : 0,
    };
  }, [prev5Events]);

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

  // MVP: highest sum of goals+assists+completions, improvement/concern: compare last 3 vs previous 3 games
  const playerTrends = useMemo(() => {
    const last3Games = games.slice(0, 3);
    const prev3Games = games.slice(3, 6);
    const last3Ids = last3Games.map((g) => g.id);
    const prev3Ids = prev3Games.map((g) => g.id);
    const last3Events = events.filter((e) => last3Ids.includes(e.game_id));
    const prev3Events = events.filter((e) => prev3Ids.includes(e.game_id));
    const stats: Record<string, any> = {};
    players.forEach((p) => {
      const last3Completions = last3Events.filter((e) => e.thrower_id === p.id && e.result === 'completion').length;
      const prev3Completions = prev3Events.filter((e) => e.thrower_id === p.id && e.result === 'completion').length;
      const last3Turnovers = last3Events.filter((e) => e.thrower_id === p.id && e.result === 'turnover').length;
      const prev3Turnovers = prev3Events.filter((e) => e.thrower_id === p.id && e.result === 'turnover').length;
      stats[p.id] = {
        name: p.name,
        completionChange: prev3Completions > 0 ? Math.round(((last3Completions - prev3Completions) / prev3Completions) * 100) : 0,
        turnoverChange: prev3Turnovers > 0 ? Math.round(((last3Turnovers - prev3Turnovers) / prev3Turnovers) * 100) : 0,
      };
    });
    return stats;
  }, [players, games, events]);

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
    if (bestPair.ids[0] && bestPair.ids[1]) {
      insights.push(`Consider pairing ${getPlayerName(players, bestPair.ids[0])} with ${getPlayerName(players, bestPair.ids[1])} more often.`);
    }
    // Example: player with most completions
    const mostCompletions = Object.values(playerStats).sort((a: any, b: any) => b.completions - a.completions)[0];
    if (mostCompletions) {
      insights.push(`${mostCompletions.name} is excelling at completions.`);
    }
    return insights;
  }, [players, chemistryMatrix, playerStats]);

  // --- UI ---
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6 text-center">Analytics Dashboard</h1>
        {loading && <div className="text-center text-lg">Loading analytics...</div>}
        {error && <div className="text-center text-red-600">{error}</div>}
        {!loading && !error && (
          <>
            {/* 1. Top-Level Metrics Section */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-2">Win/Loss (Last 5 Games)</h2>
                <div className="text-3xl font-bold text-green-600">{winLoss.wins}-{winLoss.losses}</div>
                <div className="text-sm text-gray-500 mt-2">
                  {completionStats.completionPct > prevCompletionStats.completionPct ? 'Trending Up' : 'Trending Down'}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-2">Team Completion %</h2>
                <div className="text-3xl font-bold text-blue-600">{completionStats.completionPct}%</div>
                <div className="text-sm text-gray-500 mt-2">
                  {completionStats.completionPct - prevCompletionStats.completionPct >= 0 ? '+' : ''}
                  {completionStats.completionPct - prevCompletionStats.completionPct}% vs previous
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <h2 className="text-lg font-semibold mb-2">Turnover Rate</h2>
                <div className="text-3xl font-bold text-red-600">{completionStats.turnoverRate}%</div>
                <div className="text-sm text-gray-500 mt-2">
                  {completionStats.turnoverRate - prevCompletionStats.turnoverRate >= 0 ? '+' : ''}
                  {completionStats.turnoverRate - prevCompletionStats.turnoverRate}% vs previous
                </div>
              </div>
            </section>

            {/* 2. Player Spotlight Section */}
            <section className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Player Spotlight</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* MVP */}
                {(() => {
                  const mvp = Object.values(playerStats).sort((a: any, b: any) => (b.goals + b.assists + b.completions) - (a.goals + a.assists + a.completions))[0];
                  return mvp ? (
                    <div className="bg-green-100 rounded p-4 text-center">
                      <div className="text-lg font-semibold text-green-800">MVP: {mvp.name}</div>
                      <div className="text-sm text-gray-700">{mvp.goals} goals, {mvp.assists} assists, {mvp.completions} completions</div>
                    </div>
                  ) : null;
                })()}
                {/* Improvement */}
                {(() => {
                  const improving = Object.values(playerTrends).sort((a: any, b: any) => b.completionChange - a.completionChange)[0];
                  return improving && improving.completionChange > 0 ? (
                    <div className="bg-yellow-100 rounded p-4 text-center">
                      <div className="text-lg font-semibold text-yellow-800">Improvement: {improving.name}</div>
                      <div className="text-sm text-gray-700">Completion rate up {improving.completionChange}% last 3 games</div>
                    </div>
                  ) : null;
                })()}
                {/* Concern */}
                {(() => {
                  const concern = Object.values(playerTrends).sort((a: any, b: any) => a.completionChange - b.completionChange)[0];
                  return concern && concern.completionChange < 0 ? (
                    <div className="bg-red-100 rounded p-4 text-center">
                      <div className="text-lg font-semibold text-red-800">Concern: {concern.name}</div>
                      <div className="text-sm text-gray-700">Completion rate down {Math.abs(concern.completionChange)}%</div>
                    </div>
                  ) : null;
                })()}
              </div>
            </section>

            {/* 3. Chemistry Heat Map */}
            <section className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Chemistry Heat Map</h2>
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
            </section>

            {/* 4. Line Performance Analysis (placeholder) */}
            <section className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Line Performance Analysis</h2>
              <div className="text-gray-500">Lineup analytics coming soon.</div>
            </section>

            {/* 5. Quick Insights/Action Items */}
            <section className="bg-white rounded-lg shadow p-6 mt-8">
              <h2 className="text-xl font-bold mb-4">Quick Insights & Action Items</h2>
              <ul className="list-disc pl-6 space-y-2 text-left">
                {quickInsights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 