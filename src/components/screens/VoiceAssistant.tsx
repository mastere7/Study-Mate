import React, { useState } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, RefreshCw, Radio } from "lucide-react";
import { apiService } from "../../services/api";
import { audioSynth } from "../../services/audioSynth";

export const VoiceAssistant: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiSpeechText, setAiSpeechText] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleStartListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const currentText = event.results[0][0].transcript;
        setTranscript(currentText);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleProcessVoiceQuestion = async (text?: string) => {
    const query = text || transcript;
    if (!query.trim() || isGenerating) return;

    setIsGenerating(true);
    setAiSpeechText(null);

    try {
      const result = await apiService.generateVoiceExplanation(query);
      setAiSpeechText(result);
      setIsSpeaking(true);
      audioSynth.speak(result, () => setIsSpeaking(false));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStopAudio = () => {
    audioSynth.stopSpeaking();
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Radio className="w-6 h-6 text-rose-500 animate-pulse" />
          <span>Hands-Free Voice Learning Assistant</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Speak your questions out loud and listen to instant concise audio explanations
        </p>
      </div>

      {/* Main Interactive Mic Circle Box */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 shadow-xl text-center space-y-8 flex flex-col items-center justify-center min-h-[400px]">
        {/* Animated Microphone Sphere */}
        <div className="relative">
          <button
            onClick={handleStartListening}
            className={`w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all transform shadow-2xl ${
              isListening
                ? "bg-rose-500 text-white scale-110 shadow-rose-500/40 ring-8 ring-rose-500/20 animate-pulse"
                : isSpeaking
                ? "bg-amber-500 text-white scale-105 shadow-amber-500/40 ring-8 ring-amber-500/20"
                : "bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-105 shadow-indigo-500/30"
            }`}
          >
            {isListening ? (
              <MicOff className="w-12 h-12" />
            ) : isSpeaking ? (
              <Volume2 className="w-12 h-12 animate-bounce" />
            ) : (
              <Mic className="w-12 h-12" />
            )}
          </button>
        </div>

        <div className="space-y-2 max-w-lg">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {isListening
              ? "Listening... Speak your question now"
              : isSpeaking
              ? "StudyMate is speaking answer..."
              : "Tap microphone to start voice query"}
          </h3>
          <p className="text-xs text-slate-500">
            {transcript
              ? `You said: "${transcript}"`
              : "Try asking: 'Explain the OSI model layers' or 'What is photosynthesis?'"}
          </p>
        </div>

        {transcript && !isListening && (
          <button
            onClick={() => handleProcessVoiceQuestion()}
            disabled={isGenerating}
            className="px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? "Generating Voice Answer..." : "Get Voice Explanation"}</span>
          </button>
        )}

        {/* AI Answer Text Readout */}
        {aiSpeechText && (
          <div className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                AI Voice Explanation
              </span>
              {isSpeaking ? (
                <button
                  onClick={handleStopAudio}
                  className="flex items-center gap-1 text-xs text-amber-500 font-bold"
                >
                  <VolumeX className="w-4 h-4" /> Stop Audio
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsSpeaking(true);
                    audioSynth.speak(aiSpeechText, () => setIsSpeaking(false));
                  }}
                  className="flex items-center gap-1 text-xs text-indigo-600 font-bold"
                >
                  <Volume2 className="w-4 h-4" /> Replay Audio
                </button>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
              {aiSpeechText}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
