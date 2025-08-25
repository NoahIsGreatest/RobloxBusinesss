
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Gamepad2, LogOut, ShieldCheck } from 'lucide-react';

export default function Layout({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await User.me();
                setUser(currentUser);
            } catch (error) {
                // Not logged in
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [location.key]);

    const handleLogout = async () => {
        await User.logout();
        navigate(createPageUrl('RobloxLogin'));
    };

    const isLoginPage = location.pathname === createPageUrl('RobloxLogin');

    if (isLoading) {
        return <div className="w-screen h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white font-sans">
            {!isLoginPage && user && (
                <header className="fixed top-0 left-0 right-0 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-50">
                    <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                        <Link to={createPageUrl('Main')} className="flex items-center gap-2">
                            <Gamepad2 className="text-purple-400 w-8 h-8" />
                            <span className="text-xl font-bold tracking-tighter">RobuxRewards</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to={createPageUrl('Admin')} className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                                <ShieldCheck className="w-4 h-4" />
                                <span>Admin</span>
                            </Link>
                             <div className="flex items-center gap-3 bg-gray-800/50 rounded-full pl-2 pr-4 py-1">
                                <img src={user.robloxAvatarUrl} alt="Roblox Avatar" className="w-8 h-8 rounded-full border-2 border-purple-400 object-cover" />
                                <div className="hidden sm:block">
                                    <p className="font-semibold text-sm">{user.robloxUsername}</p>
                                    <p className="text-xs text-gray-400">{user.credits?.toFixed(1) || '0.0'} Credits</p>
                                </div>
                            </div>
                            <button onClick={handleLogout} className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/40 transition-colors">
                                <LogOut className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    </nav>
                </header>
            )}
            <main className={!isLoginPage ? 'pt-24' : ''}>
                {children}
            </main>
        </div>
    );
}
