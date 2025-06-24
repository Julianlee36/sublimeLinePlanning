import { Link, useParams } from 'react-router-dom';
import { FaListAlt, FaPlayCircle, FaChartBar } from 'react-icons/fa';

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
            className="flex items-center gap-3 bg-blue-50 rounded-2xl p-6 hover:bg-blue-100 transition shadow group cursor-pointer w-full text-lg font-bold justify-center transform hover:scale-105 focus:scale-105 active:scale-100 duration-150"
          >
            <FaListAlt className="text-blue-700 text-2xl" />
            <span className="text-blue-900">Line Management</span>
          </Link>
          {/* Play a Tally Game */}
          <Link
            to={`/create-tally-game?teamId=${teamId}`}
            className="flex items-center gap-3 bg-green-600 text-white rounded-2xl p-6 hover:bg-green-700 transition shadow group cursor-pointer w-full text-lg font-bold justify-center transform hover:scale-105 focus:scale-105 active:scale-100 duration-150"
          >
            <FaPlayCircle className="text-white text-2xl" />
            <span>Play a Tally Game</span>
          </Link>
          {/* Analyse Stats */}
          <Link
            to={`/team/${teamId}/analytics`}
            className="flex items-center gap-3 bg-yellow-400 text-gray-900 rounded-2xl p-6 hover:bg-yellow-500 transition shadow group cursor-pointer w-full text-lg font-bold justify-center transform hover:scale-105 focus:scale-105 active:scale-100 duration-150"
          >
            <FaChartBar className="text-gray-900 text-2xl" />
            <span>Analyse Stats</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamMenu; 