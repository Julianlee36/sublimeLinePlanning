import { createBrowserRouter } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";

import App from "../App";
import AuthPage from "../pages/AuthPage";
import Layout from "../components/Layout";
import Home from "../pages/Home.tsx";
import PrivateRoute from "./PrivateRoute";
import AdminDashboard from "../pages/AdminDashboard";
import TeamRoster from "../pages/TeamRoster";
import ErrorPage from "../pages/ErrorPage";

export const createRouter = (session: Session | null) => {
    return createBrowserRouter([
        {
            path: "/",
            element: <App />,
            errorElement: <ErrorPage />,
            children: [
                {
                    path: "auth",
                    element: <AuthPage />,
                },
                {
                    element: <PrivateRoute session={session} />,
                    children: [
                        {
                            element: <Layout />,
                            children: [
                                {
                                    path: "",
                                    element: <Home />,
                                },
                                {
                                    path: "admin",
                                    element: <AdminDashboard />,
                                },
                                {
                                    path: "admin/team/:teamId",
                                    element: <TeamRoster />,
                                },
                            ],
                        },
                    ],
                },
            ],
        },
    ]);
}; 