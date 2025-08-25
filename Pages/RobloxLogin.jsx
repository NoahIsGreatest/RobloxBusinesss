
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Gamepad2, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

// Switched to a more reliable public proxy to fix the "Failed to fetch" error.
const ROBLOX_API_PROXY = 'https://users.roproxy.com/v1/usernames/users';
const ROBLOX_AVATAR_API_PROXY = 'https://thumbnails.roproxy.com/v1/users/avatar-headshot';


export default function RobloxLoginPage() {
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            try {
                const user = await User.me();
                if (user && user.robloxUsername) {
                    navigate(createPageUrl('Main'));
                }
            } catch (e) {
                // Not logged in, stay on this page.
            }
        };
        checkUser();
    }, [navigate]);

    const handleLogin = async () => {
        if (!username) {
            setError('Please enter a Roblox username.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            // Step 1: Get User ID from Username
            const userResponse = await fetch(ROBLOX_API_PROXY, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ usernames: [username], excludeBannedUsers: true }),
            });

            if (!userResponse.ok) throw new Error('Network error when fetching user ID.');
            
            const userData = await userResponse.json();
            
            if (!userData.data || userData.data.length === 0) {
                throw new Error('Roblox user not found. Please check the username.');
            }
            const robloxUser = userData.data[0];

            // Step 2: Get Avatar URL from User ID
            const avatarResponse = await fetch(`${ROBLOX_AVATAR_API_PROXY}?userIds=${robloxUser.id}&size=150x150&format=Png&isCircular=false`);

            if (!avatarResponse.ok) throw new Error('Network error when fetching avatar.');

            const avatarData = await avatarResponse.json();

            if (!avatarData.data || avatarData.data.length === 0) {
                throw new Error('Could not fetch Roblox avatar.');
            }
            const avatarUrl = avatarData.data[0].imageUrl;

            // Step 3: Update Base44 User
            await User.updateMyUserData({
                robloxUsername: robloxUser.name,
                robloxUserId: robloxUser.id.toString(),
                robloxAvatarUrl: avatarUrl,
                credits: 0,
            });

            navigate(createPageUrl('Main'));

        } catch (err) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-screen flex flex-col items-center justify-center p-4 bg-grid-gray-700/[0.2]">
            <motion.div
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Gamepad2 className="inline-block text-purple-400 w-16 h-16 mb-4" />
                    <h1 className="text-4xl font-bold tracking-tighter">Welcome to RobuxRewards</h1>
                    <p className="text-gray-400 mt-2">Enter your Roblox username to begin.</p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-2xl p-8 backdrop-blur-sm">
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        <Input
                            type="text"
                            placeholder="Your Roblox Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                            className="bg-gray-900 border-gray-600 h-12 text-lg"
                            disabled={isLoading}
                        />
                        <Button
                            onClick={handleLogin}
                            disabled={isLoading}
                            className="w-full h-12 text-lg bg-purple-600 hover:bg-purple-700 transition-all duration-300"
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Continue <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                 <p className="text-xs text-center text-gray-500 mt-6">
                    We use public Roblox APIs to display your profile. We do not store your password.
                </p>
            </motion.div>
        </div>
    );
}
