import { Link, useParams } from 'react-router-dom';

const TeamMenu = () => {
  const { teamId } = useParams<{ teamId: string }>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-lg shadow p-8 text-center space-y-8">
        <h1 className="text-3xl font-bold mb-4 text-gray-900">Team Menu</h1>
        <div className="space-y-6">
          {/* Line Management */}
          <div className="bg-blue-100 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2 text-blue-800">Line Management</h2>
            <p className="text-gray-600">(Coming soon)</p>
          </div>
          {/* Play a Tally Game */}
          <Link
            to={`/create-tally-game?teamId=${teamId}`}
            className="block bg-green-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-700 transition"
          >
            Play a Tally Game
          </Link>
          {/* Analyse Stats */}
          <Link
            to={`/team/${teamId}/analytics`}
            className="block bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-yellow-600 transition"
          >
            Analyse Stats
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamMenu; 