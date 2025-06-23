import { createBrowserRouter } from "react-router-dom";
import Home from "../pages/Home";
import PlayerRoster from "../pages/PlayerRoster";
import GameSetup from "../pages/GameSetup";
import LiveGame from "../pages/LiveGame";
import Stats from "../pages/Stats";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Home />,
    },
    {
        path: "/roster",
        element: <PlayerRoster />,
    },
    {
        path: "/game/new",
        element: <GameSetup />,
    },
    {
        path: "/game/live/:id",
        element: <LiveGame />,
    },
    {
        path: "/stats",
        element: <Stats />,
    }
]);

export default router; 