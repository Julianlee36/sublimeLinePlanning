import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabaseClient';

const AuthPage = () => {
    return (
        <div className="relative min-h-screen flex items-center justify-center bg-background overflow-hidden">
            {/* Video Background */}
            <video
                className="fixed inset-0 w-full h-full object-cover z-0"
                src="/flying discs.mov"
                autoPlay
                loop
                muted
                playsInline
                poster="/clouds-fallback.jpg" // fallback image, optional
                preload="auto"
                style={{ pointerEvents: 'none' }}
            >
                Sorry, your browser does not support embedded videos.
            </video>
            {/* Overlay */}
            <div className="fixed inset-0 bg-black bg-opacity-60 z-10 pointer-events-none" />
            {/* Content */}
            <div className="w-full max-w-md p-10 space-y-10 bg-white rounded-2xl shadow-soft relative z-20" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
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