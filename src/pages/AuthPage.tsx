import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient';

const AuthPage = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="w-full max-w-md p-10 space-y-10 bg-white rounded-2xl shadow-soft">
                <h1 className="text-4xl font-extrabold text-center text-gray-900 tracking-tight">Ultimate Stats Tracker</h1>
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    providers={['google', 'github']}
                    theme="dark"
                />
            </div>
        </div>
    );
};

export default AuthPage; 