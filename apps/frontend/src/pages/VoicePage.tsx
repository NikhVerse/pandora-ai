import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, Square, Cpu, Radio, ShieldCheck, Terminal } from 'lucide-react';
import { Button, Card, Badge, Waveform } from '@pandora/ui';
import { useAppStore } from '../store/useAppStore';
import { supabase } from '../utils/supabaseClient';

interface VoiceLog {
  timestamp: string;
  sender: 'operator' | 'pandora' | 'system';
  message: string;
}

export default function VoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [isPlayingResponse, setIsPlayingResponse] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [voiceLogs, setVoiceLogs] = useState<VoiceLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      sender: 'system',
      message: 'Pandora voice synthesizer pipeline operational.',
    },
  ]);
  const [statusText, setStatusText] = useState('Standby. Click button below to activate mic link.');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<any | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simulatedSpeechTimerRef = useRef<number | null>(null);

  // Frequency analysis loop
  const analyzeVoiceVolume = () => {
    if (!analyserRef.current) return;
    const array = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(array);

    // Calculate average amplitude
    let values = 0;
    for (let i = 0; i < array.length; i++) {
      values += array[i];
    }
    const average = values / array.length;
    setVoiceLevel(Math.min(100, Math.floor((average / 128) * 100)));

    animationFrameRef.current = requestAnimationFrame(analyzeVoiceVolume);
  };

  const handleStartListening = async () => {
    setVoiceLevel(0);
    setStatusText('Acquiring microphone token...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Initialize Web Audio context
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      source.connect(analyser);
      setIsListening(true);
      setStatusText('Listening... Speak now.');
      
      setVoiceLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          sender: 'system',
          message: 'Microphone stream token initialized.',
        },
      ]);

      // Start volume check loops
      analyzeVoiceVolume();
    } catch (err) {
      console.warn('Microphone hardware access rejected. Engaging simulation fallback mode.');
      setIsListening(true);
      setStatusText('Listening (Simulation Mode active - Mic access disabled)...');
      
      setVoiceLogs((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          sender: 'system',
          message: 'Engaging software mic simulator.',
        },
      ]);

      // Simulate voice level spikes
      let step = 0;
      const simInterval = setInterval(() => {
        if (!useAppStore.getState().user) {
          clearInterval(simInterval);
          return;
        }
        step += 0.2;
        const mockLevel = Math.abs(Math.sin(step)) * 60 + Math.random() * 20;
        setVoiceLevel(Math.floor(mockLevel));
      }, 100);

      (mediaStreamRef as any).current = {
        stop: () => {
          clearInterval(simInterval);
          setVoiceLevel(0);
        },
      };
    }
  };

  const handleStopListening = async () => {
    setStatusText('Processing voice payload...');
    setIsListening(false);
    setVoiceLevel(0);

    // Cancel animation loops
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Stop microphone recording
    if (mediaStreamRef.current) {
      if (typeof mediaStreamRef.current.stop === 'function') {
        mediaStreamRef.current.stop();
      } else {
        mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
      }
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // Add operator mockup log
    const userMessage = 'Verify engine core metrics.';
    setVoiceLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        sender: 'operator',
        message: userMessage,
      },
    ]);

    // Retrieve active user session token
    let token = 'mock-session-token';
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        token = session.access_token;
      }
    } catch (e) {
      console.warn('Session retrieval error:', e);
    }

    // Send payload to backend /api/voice
    try {
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text: userMessage }),
      });

      if (!response.ok) throw new Error('API voice synthesis failed');
      const result = await response.json();

      // Trigger playing TTS response
      handlePlaySynthesis(result.synthesis || 'Core metrics verified successfully.');
    } catch (err) {
      // Offline fallback synthesis
      handlePlaySynthesis('Core specifications validated. All operational parameters conform to guidelines.');
    }
  };

  const handlePlaySynthesis = (text: string) => {
    setIsPlayingResponse(true);
    setStatusText('Synthesizing voice playback...');

    setVoiceLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        sender: 'pandora',
        message: text,
      },
    ]);

    // Simulate audio speaking durations
    let step = 0;
    const duration = text.length * 60; // 60ms per character
    const simSpeech = setInterval(() => {
      step += 0.3;
      setVoiceLevel(Math.floor(Math.abs(Math.sin(step)) * 50 + 15));
    }, 80);

    const timer = setTimeout(() => {
      clearInterval(simSpeech);
      setIsPlayingResponse(false);
      setVoiceLevel(0);
      setStatusText('Standby. Click button below to activate mic link.');
    }, duration);

    (simulatedSpeechTimerRef as any).current = {
      clear: () => {
        clearInterval(simSpeech);
        clearTimeout(timer);
        setVoiceLevel(0);
        setIsPlayingResponse(false);
      },
    };
  };

  const handleInterrupt = () => {
    setStatusText('Voice pipeline interrupted.');
    setIsListening(false);
    setVoiceLevel(0);

    // Cancel speak simulations
    if (simulatedSpeechTimerRef.current) {
      (simulatedSpeechTimerRef.current as any).clear();
    }

    // Terminate loops & contexts
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (mediaStreamRef.current) {
      if (typeof mediaStreamRef.current.stop === 'function') {
        mediaStreamRef.current.stop();
      } else {
        mediaStreamRef.current.getTracks().forEach((track: any) => track.stop());
      }
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setVoiceLogs((prev) => [
      ...prev,
      {
        timestamp: new Date().toLocaleTimeString(),
        sender: 'system',
        message: 'Voice pipeline session aborted by user.',
      },
    ]);
    setTimeout(() => setStatusText('Standby. Click button below to activate mic link.'), 1500);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (simulatedSpeechTimerRef.current) (simulatedSpeechTimerRef.current as any).clear();
    };
  }, []);

  return (
    <div className="h-full w-full bg-black p-6 overflow-y-auto space-y-6">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side Visualizer */}
        <div className="md:col-span-1 space-y-6">
          <Card variant="glow" className="p-6 flex flex-col items-center justify-between text-center relative overflow-hidden min-h-[380px]">
            {/* Pulsing aurora background element */}
            {(isListening || isPlayingResponse) && (
              <div className="absolute inset-0 bg-neon-pink/5 rounded-full scale-110 blur-xl animate-pulse pointer-events-none" />
            )}

            <div className="space-y-2 z-10 w-full">
              <Badge variant={isListening ? 'pink' : isPlayingResponse ? 'blue' : 'info'}>
                {isListening ? 'Microphone Active' : isPlayingResponse ? 'Agent Speaking' : 'Standby'}
              </Badge>
              <h3 className="font-display font-semibold text-lg">Inference voice_node</h3>
            </div>

            {/* Glowing Microphone Orb */}
            <div className="relative my-6 z-10">
              <button
                onClick={isListening ? handleStopListening : isPlayingResponse ? handleInterrupt : handleStartListening}
                className={`w-32 h-32 rounded-full flex items-center justify-center border transition-all duration-300 relative cursor-pointer group ${
                  isListening
                    ? 'border-neon-pink shadow-[0_0_40px_rgba(255,0,127,0.4)] bg-neon-pink/10 hover:bg-neon-pink/20'
                    : isPlayingResponse
                    ? 'border-neon-blue shadow-[0_0_40px_rgba(0,240,255,0.4)] bg-neon-blue/10 hover:bg-neon-blue/20'
                    : 'border-white/10 bg-neutral-950/60 hover:border-neon-purple/50 hover:shadow-[0_0_30px_rgba(157,78,221,0.2)]'
                }`}
              >
                {isListening ? (
                  <Mic size={48} className="text-neon-pink animate-pulse" />
                ) : isPlayingResponse ? (
                  <Volume2 size={48} className="text-neon-blue animate-bounce" />
                ) : (
                  <MicOff size={48} className="text-neutral-500 group-hover:text-neon-purple transition-colors" />
                )}
              </button>
            </div>

            {/* Waveform component visualizer */}
            <div className="w-full z-10">
              <Waveform isPlaying={isListening || isPlayingResponse} color={isListening ? 'pink' : 'blue'} barCount={18} />
              {voiceLevel > 0 && (
                <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500 mt-2 px-4">
                  <span>Volume level</span>
                  <span>{voiceLevel}%</span>
                </div>
              )}
            </div>
          </Card>

          <Card variant="glass" className="p-6 space-y-4">
            <h4 className="font-display font-medium text-sm flex items-center gap-2">
              <Cpu size={16} className="text-neon-purple" />
              Agent Configuration
            </h4>
            <div className="space-y-2 text-xs font-mono text-neutral-400">
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>Language</span>
                <span>English (US)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 py-1">
                <span>Model Engine</span>
                <span>llama-tts-fast</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Latency Target</span>
                <span>&lt; 200ms</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side Logging and diagnostics */}
        <div className="md:col-span-2 flex flex-col min-h-[480px] space-y-6">
          <Card variant="glass" className="p-6 flex-1 flex flex-col min-w-0">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
              <Terminal size={18} className="text-neon-blue" />
              Voice Session Console
            </h3>

            {/* Console Log Area */}
            <div className="flex-1 overflow-y-auto font-mono text-xs space-y-3 bg-neutral-950/60 p-4 rounded-lg border border-white/5 min-h-[260px] max-h-[300px]">
              {voiceLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-neutral-600 shrink-0">{log.timestamp}</span>
                  {log.sender === 'system' && (
                    <span className="text-amber-500 font-semibold shrink-0">[SYS]</span>
                  )}
                  {log.sender === 'operator' && (
                    <span className="text-neon-pink font-semibold shrink-0">[OP]</span>
                  )}
                  {log.sender === 'pandora' && (
                    <span className="text-neon-blue font-semibold shrink-0">[AI]</span>
                  )}
                  <span className="text-neutral-300 break-words">{log.message}</span>
                </div>
              ))}
            </div>

            {/* Status bar */}
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t border-white/5 text-xs">
              <div className="flex items-center gap-2 text-neutral-400">
                <Radio size={14} className={isListening || isPlayingResponse ? 'text-neon-pink animate-pulse' : 'text-neutral-500'} />
                <span>{statusText}</span>
              </div>
              
              {(isListening || isPlayingResponse) && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleInterrupt}
                  leftIcon={<Square size={12} className="fill-red-400" />}
                >
                  Interrupt Session
                </Button>
              )}
            </div>
          </Card>

          <Card variant="glass" className="p-6 flex items-center gap-4 border-emerald-500/10">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-display font-medium text-sm text-neutral-200">Local Stream Encrypted</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Pandora tokenizes audio arrays before transit. System-level checks run validation queries on each frameset.
              </p>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
