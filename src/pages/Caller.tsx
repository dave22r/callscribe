import { useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLiveScribe } from '@/hooks/useLiveScribe';
import { useCalls } from '@/hooks/useCalls';
import LiveTranscript from '@/components/LiveTranscript';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, ArrowLeft, HeartPulse, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Caller = () => {
    const { callId } = useParams<{ callId: string }>();
    const { getCall, getPartial, loading: callsLoading } = useCalls();

    const liveScribe = useLiveScribe({ fixedRole: 'caller' });

    const currentCall = getCall(callId || null);

    const displayCall = useMemo(() => {
        if (!currentCall) return null;
        const transcript = [...currentCall.transcript];

        const remotePartial = getPartial(currentCall.id);
        if (remotePartial) {
            transcript.push(remotePartial);
        }

        if (liveScribe.partialTranscript?.trim()) {
            transcript.push({
                speaker: liveScribe.role,
                text: liveScribe.partialTranscript,
                timestamp: '--:--',
            });
        }

        return {
            ...currentCall,
            transcript,
        };
    }, [currentCall, liveScribe.partialTranscript, liveScribe.role, getPartial]);

    const handleUnmute = useCallback(async () => {
        if (!callId) return;
        await liveScribe.unmute(callId);
    }, [callId, liveScribe]);

    const handleMute = useCallback(() => {
        liveScribe.mute();
    }, [liveScribe]);

    if (callsLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-slate-950 text-white gap-4">
                <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
                <p className="text-slate-400 font-medium font-mono animate-pulse">Initializing Secure Session...</p>
            </div>
        );
    }

    if (!currentCall) {
        return (
            <div className="h-screen flex items-center justify-center flex-col gap-6 bg-slate-950 text-white p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                    <HeartPulse className="w-8 h-8 text-slate-700" />
                </div>
                <div>
                    <h1 className="text-xl font-bold mb-2">Session Not Found</h1>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">This link may have expired or the call has already ended.</p>
                </div>
                <Link to="/">
                    <Button variant="outline" className="border-slate-800 text-slate-400 hover:bg-slate-900">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>
        );
    }

    const isLive = liveScribe.isConnected;

    return (
        <div className="h-screen flex flex-col bg-slate-950 text-white overflow-hidden p-4 font-sans">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <motion.div
                        animate={isLive ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shadow-lg shadow-red-900/40"
                    >
                        <HeartPulse className="w-6 h-6 text-white" />
                    </motion.div>
                    <div>
                        <h1 className="font-bold text-lg leading-tight uppercase tracking-tight">Emergency Support</h1>
                        <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">Encrypted Connection</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AnimatePresence mode="wait">
                        {isLive ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest border border-green-500/30"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                Mic Live
                            </motion.div>
                        ) : (
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-700">
                                Muted
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Main Transcript Display */}
            <div className="flex-1 min-h-0 bg-slate-900/30 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col mb-8 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-950/50 pointer-events-none" />
                <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-6">
                    <LiveTranscript call={displayCall} />
                </div>

                <AnimatePresence>
                    {isLive && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 h-8 px-4 rounded-full bg-red-600/20 border border-red-600/30 backdrop-blur-md"
                        >
                            {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [8, 16, 8] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                                    className="w-1 bg-red-400 rounded-full"
                                />
                            ))}
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest ml-2">Speaking...</span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Control Area */}
            <div className="shrink-0 flex flex-col items-center gap-4 pb-10">
                <div className="flex items-center gap-3">
                    <Button
                        onClick={handleUnmute}
                        disabled={liveScribe.isConnecting || isLive || liveScribe.isPlaying}
                        className="bg-red-500 hover:bg-red-600 relative overflow-hidden"
                    >
                        <Mic className="w-4 h-4 mr-2" />
                        {liveScribe.isPlaying ? 'Receiving...' : 'Unmute'}
                        {liveScribe.isPlaying && (
                            <span className="absolute inset-0 bg-blue-500/20 animate-pulse" />
                        )}
                    </Button>
                    <Button
                        onClick={handleMute}
                        disabled={!isLive}
                        variant="outline"
                        className="border-slate-800 text-slate-300"
                    >
                        <MicOff className="w-4 h-4 mr-2" />
                        Mute
                    </Button>
                </div>

                <div className="text-center space-y-1">
                    <p className={`text-sm font-bold transition-colors ${isLive ? 'text-red-500' : liveScribe.isPlaying ? 'text-blue-400' : 'text-slate-300'}`}>
                        {isLive ? 'Your mic is LIVE' : liveScribe.isPlaying ? 'Receiving Audio...' : 'Mic is muted'}
                    </p>
                    <p className="text-slate-500 text-[10px] max-w-[240px] uppercase font-bold tracking-tight">
                        You control when audio is shared
                    </p>
                </div>
            </div>

            {liveScribe.error && (
                <div className="fixed bottom-4 left-4 right-4 bg-red-600/90 backdrop-blur-md text-white px-4 py-3 rounded-2xl text-[11px] text-center font-bold uppercase tracking-wider shadow-2xl border border-white/10">
                    {liveScribe.error}
                </div>
            )}
        </div>
    );
};

export default Caller;
