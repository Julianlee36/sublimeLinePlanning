import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './lib/supabaseClient';
import { createRouter } from './router';
import './index.css';

const AppContainer = () => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const router = createRouter(session);

  return <RouterProvider router={router} />;
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppContainer />
  </React.StrictMode>
);
