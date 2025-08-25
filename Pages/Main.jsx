
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '@/entities/User';
import { Withdrawal } from '@/entities/Withdrawal';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Gift, Clock, PlayCircle, Loader2, PartyPopper, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MAX_CREDITS = 80;
const MIN_WITHDRAWAL = 7;
const AD_REWARD = 0.5;
const AD_DURATION_MS = 3000;
const WITHDRAW_COOLDOWN_DAYS = 3;

export default function MainPage() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isWatchingAd, setIsWatchingAd] = useState(false);
    const [adProgress, setAdProgress] = useState(0);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const navigate = useNavigate();

    const fetchUser = async () => {
        try {
            const currentUser = await User.me();
            if (!currentUser.robloxUsername) {
                navigate(createPageUrl('RobloxLogin'));
                return;
            }
            setUser(currentUser);
        } catch (error) {
            navigate(createPageUrl('RobloxLogin'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [navigate]);

    const handleWatchAd = () => {
        if (isWatchingAd || (user && user.credits >= MAX_CREDITS)) return;
        
        setIsWatchingAd(true);
        setAdProgress(0);
        const interval = setInterval(() => {
            setAdProgress(prev => Math.min(prev + 100 / (AD_DURATION_MS / 100), 100));
        }, 100);

        setTimeout(async () => {
            clearInterval(interval);
            setAdProgress(100);
            
            const newCredits = Math.min((user.credits || 0) + AD_REWARD, MAX_CREDITS);
            await User.updateMyUserData({ credits: newCredits });
            
            setUser(prev => ({ ...prev, credits: newCredits }));
            setIsWatchingAd(false);
        }, AD_DURATION_MS);
    };
    
    const canWithdraw = () => {
        if (!user || !user.lastWithdrawalDate) return true;
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - WITHDRAW_COOLDOWN_DAYS);
        return new Date(user.lastWithdrawalDate) < threeDaysAgo;
    };

    const getCooldownTime = () => {
        if (!user || !user.lastWithdrawalDate || canWithdraw()) return '';
        const withdrawalDate = new Date(user.lastWithdrawalDate);
        const cooldownEndDate = new Date(withdrawalDate.setDate(withdrawalDate.getDate() + WITHDRAW_COOLDOWN_DAYS));
        return formatDistanceToNow(cooldownEndDate, { addSuffix: true });
    };

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);

        if (isNaN(amount) || amount <= 0) {
            setFeedback({ type: 'error', message: 'Please enter a valid amount.'});
            return;
        }
        if (amount < MIN_WITHDRAWAL) {
            setFeedback({ type: 'error', message: `Minimum withdrawal is ${MIN_WITHDRAWAL} credits.`});
            return;
        }
        if (amount > user.credits) {
            setFeedback({ type: 'error', message: 'You do not have enough credits.'});
            return;
        }
        if (!canWithdraw()) {
            setFeedback({ type: 'error', message: `You can withdraw again ${getCooldownTime()}.`});
            return;
        }
        
        setIsSubmitting(true);
        setFeedback({ type: '', message: '' });
        
        try {
            await Withdrawal.create({
                robloxUsername: user.robloxUsername,
                robloxUserId: user.robloxUserId,
                amount: amount,
            });

            const newCredits = user.credits - amount;
            const newWithdrawalDate = new Date().toISOString();
            await User.updateMyUserData({ credits: newCredits, lastWithdrawalDate: newWithdrawalDate });

            setUser(prev => ({ ...prev, credits: newCredits, lastWithdrawalDate: newWithdrawalDate }));
            setWithdrawAmount('');
            setFeedback({ type: 'success', message: `Successfully requested withdrawal of ${amount} credits!`});
        } catch (error) {
            setFeedback({ type: 'error', message: 'An error occurred. Please try again.'});
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !user) {
         return <div className="w-screen h-screen bg-gray-900 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-purple-500"></div></div>;
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Ad Watching Card */}
                <Card className="lg:col-span-2 bg-gray-800/50 border-gray-700 text-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                           <Gift className="text-purple-400"/> Earn Credits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center py-12 flex flex-col items-center justify-center space-y-6">
                        <div className="relative">
                            <Progress value={(user.credits / MAX_CREDITS) * 100} className="w-64 h-3 bg-gray-700 [&>*]:bg-purple-500"/>
                            <p className="text-2xl font-bold mt-2">{user.credits?.toFixed(1) || '0.0'} / {MAX_CREDITS} Credits</p>
                        </div>
                        <p className="text-gray-400 max-w-sm">
                            Click the button below to watch a short ad and earn {AD_REWARD} credits. You can accumulate up to {MAX_CREDITS} credits.
                        </p>
                        <Button
                            onClick={handleWatchAd}
                            disabled={isWatchingAd || user.credits >= MAX_CREDITS}
                            className="w-64 h-16 text-xl bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 transition-all duration-300 relative overflow-hidden"
                        >
                            <AnimatePresence>
                            {isWatchingAd && (
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '100%' }}
                                    exit={{ width: '100%' }}
                                    transition={{ duration: AD_DURATION_MS / 1000, ease: 'linear' }}
                                    className="absolute top-0 left-0 h-full bg-purple-700/50 z-0"
                                />
                            )}
                            </AnimatePresence>
                            <span className="relative z-10 flex items-center">
                                {isWatchingAd ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : <PlayCircle className="mr-2 h-6 w-6"/>}
                                {isWatchingAd ? 'Watching...' : 'Watch Ad'}
                            </span>
                        </Button>
                    </CardContent>
                </Card>

                {/* Withdrawal Card */}
                <Card className="bg-gray-800/50 border-gray-700 text-white shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <DollarSign className="text-green-400"/> Withdraw Credits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!canWithdraw() && (
                            <Alert variant="default" className="bg-yellow-500/10 border-yellow-400/30 text-yellow-300">
                                <Clock className="h-4 w-4 !text-yellow-300"/>
                                <AlertTitle>Cooldown Active</AlertTitle>
                                <AlertDescription>You can withdraw again {getCooldownTime()}.</AlertDescription>
                            </Alert>
                        )}
                        <AnimatePresence>
                        {feedback.message && (
                            <motion.div initial={{opacity: 0, y: -10}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -10}}>
                                <Alert variant={feedback.type === 'error' ? 'destructive' : 'default'} className={feedback.type === 'success' ? 'bg-green-500/10 border-green-400/30 text-green-300' : ''}>
                                    {feedback.type === 'success' ? <PartyPopper className="h-4 w-4"/> : <AlertTriangle className="h-4 w-4"/>}
                                    <AlertTitle>{feedback.type === 'success' ? 'Success!' : 'Oops!'}</AlertTitle>
                                    <AlertDescription>{feedback.message}</AlertDescription>
                                </Alert>
                            </motion.div>
                        )}
                        </AnimatePresence>

                        <div className="space-y-2">
                             <label htmlFor="withdraw" className="text-sm font-medium text-gray-400">Amount (Min: {MIN_WITHDRAWAL})</label>
                            <Input
                                id="withdraw"
                                type="number"
                                placeholder="e.g. 10"
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                disabled={!canWithdraw() || isSubmitting}
                                className="bg-gray-900 border-gray-600 h-12 text-lg"
                            />
                        </div>
                        <Button
                            onClick={handleWithdraw}
                            disabled={!canWithdraw() || isSubmitting || !withdrawAmount}
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-600 transition-all duration-300"
                        >
                           {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Request Withdrawal'}
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
