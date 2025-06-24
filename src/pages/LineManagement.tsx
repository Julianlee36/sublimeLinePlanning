import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import type { Player } from '../types/player';

interface Line {
  id: string;
  team_id: string;
  name: string;
  description: string;
  player_ids: string[];
  created_at: string;
}

const LineManagement = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [newLine, setNewLine] = useState({ name: '', description: '', playerIds: [] as string[] });
  const [editingLineId, setEditingLineId] = useState<string | null>(null);
  const [editLine, setEditLine] = useState({ name: '', description: '', playerIds: [] as string[] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchPlayers();
      fetchLines();
    }
    // eslint-disable-next-line
  }, [teamId]);

  const fetchPlayers = async () => {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId);
    if (!error) setPlayers(data || []);
  };

  const fetchLines = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lines')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });
    if (!error) setLines(data || []);
    setLoading(false);
  };

  // --- CREATE ---
  const handleNewLineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setNewLine({ ...newLine, [e.target.name]: e.target.value });
  };
  const handleNewLinePlayerToggle = (playerId: string) => {
    setNewLine((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(playerId)
        ? prev.playerIds.filter((id) => id !== playerId)
        : [...prev.playerIds, playerId],
    }));
  };
  const handleCreateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (!newLine.name.trim()) throw new Error('Line name is required');
      const { error } = await supabase.from('lines').insert({
        team_id: teamId,
        name: newLine.name,
        description: newLine.description,
        player_ids: newLine.playerIds,
      });
      if (error) throw error;
      setNewLine({ name: '', description: '', playerIds: [] });
      fetchLines();
    } catch (err: any) {
      setError(err.message || 'Failed to create line');
    } finally {
      setSubmitting(false);
    }
  };

  // --- EDIT ---
  const startEditLine = (line: Line) => {
    setEditingLineId(line.id);
    setEditLine({
      name: line.name,
      description: line.description,
      playerIds: line.player_ids || [],
    });
  };
  const handleEditLineChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditLine({ ...editLine, [e.target.name]: e.target.value });
  };
  const handleEditLinePlayerToggle = (playerId: string) => {
    setEditLine((prev) => ({
      ...prev,
      playerIds: prev.playerIds.includes(playerId)
        ? prev.playerIds.filter((id) => id !== playerId)
        : [...prev.playerIds, playerId],
    }));
  };
  const handleUpdateLine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLineId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!editLine.name.trim()) throw new Error('Line name is required');
      const { error } = await supabase.from('lines').update({
        name: editLine.name,
        description: editLine.description,
        player_ids: editLine.playerIds,
      }).eq('id', editingLineId);
      if (error) throw error;
      setEditingLineId(null);
      setEditLine({ name: '', description: '', playerIds: [] });
      fetchLines();
    } catch (err: any) {
      setError(err.message || 'Failed to update line');
    } finally {
      setSubmitting(false);
    }
  };
  const cancelEdit = () => {
    setEditingLineId(null);
    setEditLine({ name: '', description: '', playerIds: [] });
  };

  // --- DELETE ---
  const handleDeleteLine = async (id: string) => {
    if (!window.confirm('Delete this line?')) return;
    setSubmitting(true);
    setError(null);
    try {
      const { error } = await supabase.from('lines').delete().eq('id', id);
      if (error) throw error;
      fetchLines();
    } catch (err: any) {
      setError(err.message || 'Failed to delete line');
    } finally {
      setSubmitting(false);
    }
  };

  // --- HELPERS ---
  const getPlayerNames = (ids: string[]) =>
    players.filter((p) => ids.includes(p.id)).map((p) => `${p.name} #${p.jersey_number}`).join(', ');

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto p-4 space-y-10">
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">Line Management</h1>
        {/* Create New Line */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Create a New Line</h2>
          <form className="space-y-4" onSubmit={handleCreateLine}>
            <input
              type="text"
              name="name"
              placeholder="Line Name"
              value={newLine.name}
              className="w-full p-3 border border-gray-200 rounded-xl"
              required
              onChange={handleNewLineChange}
              disabled={submitting}
            />
            <textarea
              name="description"
              placeholder="Description (optional)"
              value={newLine.description}
              className="w-full p-3 border border-gray-200 rounded-xl"
              onChange={handleNewLineChange}
              disabled={submitting}
            />
            <div>
              <label className="block mb-2 font-semibold">Select Players</label>
              <div className="grid grid-cols-2 gap-2">
                {players.map((player) => (
                  <label key={player.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={player.id}
                      checked={newLine.playerIds.includes(player.id)}
                      onChange={() => handleNewLinePlayerToggle(player.id)}
                      disabled={submitting}
                    />
                    <span>{player.name} #{player.jersey_number}</span>
                  </label>
                ))}
              </div>
            </div>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-8 rounded-xl shadow hover:bg-blue-700 transition" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Line'}
            </button>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </form>
        </div>
        {/* Existing Lines */}
        <div className="bg-white rounded-2xl shadow-soft p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Edit Lines</h2>
          {loading ? (
            <p className="text-gray-500">Loading lines...</p>
          ) : lines.length === 0 ? (
            <p className="text-gray-500">No lines created yet.</p>
          ) : (
            <ul className="space-y-4">
              {lines.map((line) => (
                <li key={line.id} className="border rounded-xl p-4 flex flex-col">
                  {editingLineId === line.id ? (
                    <form className="space-y-2" onSubmit={handleUpdateLine}>
                      <input
                        type="text"
                        name="name"
                        value={editLine.name}
                        onChange={handleEditLineChange}
                        className="w-full p-2 border border-gray-200 rounded"
                        required
                        disabled={submitting}
                      />
                      <textarea
                        name="description"
                        value={editLine.description}
                        onChange={handleEditLineChange}
                        className="w-full p-2 border border-gray-200 rounded"
                        disabled={submitting}
                      />
                      <div>
                        <label className="block mb-2 font-semibold">Select Players</label>
                        <div className="grid grid-cols-2 gap-2">
                          {players.map((player) => (
                            <label key={player.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                value={player.id}
                                checked={editLine.playerIds.includes(player.id)}
                                onChange={() => handleEditLinePlayerToggle(player.id)}
                                disabled={submitting}
                              />
                              <span>{player.name} #{player.jersey_number}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <button type="submit" className="bg-green-600 text-white font-bold py-1 px-4 rounded shadow hover:bg-green-700 transition" disabled={submitting}>
                          {submitting ? 'Saving...' : 'Save'}
                        </button>
                        <button type="button" className="bg-gray-300 text-gray-800 font-bold py-1 px-4 rounded shadow hover:bg-gray-400 transition" onClick={cancelEdit} disabled={submitting}>
                          Cancel
                        </button>
                      </div>
                      {error && <div className="text-red-500 mt-2">{error}</div>}
                    </form>
                  ) : (
                    <>
                      <span className="font-bold text-lg">{line.name}</span>
                      <span className="text-gray-500 text-sm">{line.description}</span>
                      <span className="text-gray-700 text-sm mt-2">Players: {getPlayerNames(line.player_ids)}</span>
                      <div className="flex space-x-2 mt-2">
                        <button className="bg-yellow-400 text-gray-900 font-bold py-1 px-4 rounded shadow hover:bg-yellow-500 transition" onClick={() => startEditLine(line)} disabled={submitting}>
                          Edit
                        </button>
                        <button className="bg-red-600 text-white font-bold py-1 px-4 rounded shadow hover:bg-red-700 transition" onClick={() => handleDeleteLine(line.id)} disabled={submitting}>
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Analytics Placeholder */}
        <div className="bg-white rounded-2xl shadow-soft p-8">
          <h2 className="text-2xl font-bold mb-4">Line Analytics</h2>
          <p className="text-gray-500">Analytics for lines will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default LineManagement; 