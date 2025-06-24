import { Link, useParams } from 'react-router-dom';

const TeamMenu = () => {
  const { teamId } = useParams<{ teamId: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-soft p-10 text-center space-y-10">
        <h1 className="text-4xl font-extrabold mb-6 text-gray-900 tracking-tight">Team Menu</h1>
        <div className="space-y-8">
          {/* Line Management */}
          <Link
            to={`/team/${teamId}/lines`}
            className="block bg-blue-50 rounded-xl p-6 hover:bg-blue-100 transition"
          >
            <h2 className="text-2xl font-bold mb-2 text-blue-900">Line Management</h2>
          </Link>
          {/* Play a Tally Game */}
          <Link
            to={`/create-tally-game?teamId=${teamId}`}
            className="block bg-green-600 text-white font-bold py-3 px-8 rounded-xl shadow hover:bg-green-700 transition"
          >
            Play a Tally Game
          </Link>
          {/* Analyse Stats */}
          <Link
            to={`/team/${teamId}/analytics`}
            className="block bg-yellow-400 text-gray-900 font-bold py-3 px-8 rounded-xl shadow hover:bg-yellow-500 transition"
          >
            Analyse Stats
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamMenu; 