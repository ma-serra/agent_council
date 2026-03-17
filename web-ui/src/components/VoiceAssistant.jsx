import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { agentCouncilAPI } from '../api';

const WAKE_WORDS = ['oi james', 'olá james', 'hey james', 'e aí james', 'james'];

export const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [status, _setStatus] = useState('idle'); // idle, listening_wake, listening_command, processing, speaking
  const [transcript, setTranscript] = useState('');

  const statusRef = useRef('idle');
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const audioRef = useRef(new Audio());
  const navigate = useNavigate();

  const setStatus = (newStatus) => {
    statusRef.current = newStatus;
    _setStatus(newStatus);
  };

  // Initialize Speech Recognition
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'pt-BR';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setTranscript(currentText.toLowerCase());

      if (finalTranscript) {
        handleFinalTranscript(finalTranscript.toLowerCase().trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current.onend = () => {
      // Automatically restart if we are supposed to be listening and not speaking/processing
      if (isListeningRef.current && statusRef.current !== 'speaking' && statusRef.current !== 'processing') {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore, might already be started
        }
      }
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Sync ref with state
  useEffect(() => {
    isListeningRef.current = isListening;
    if (isListening) {
      if (statusRef.current === 'idle') {
        setStatus('listening_wake');
      }
      try {
        recognitionRef.current.start();
      } catch (e) {}
    } else {
      setStatus('idle');
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  }, [isListening]);

  const speakText = async (text, onEndCallback) => {
    try {
      setStatus('speaking');

      // Stop recognition while speaking so he doesn't hear himself
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch(e){}
      }

      const response = await fetch(agentCouncilAPI.getTTSUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      if (!response.ok) throw new Error('TTS failed');

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      audioRef.current.src = audioUrl;
      audioRef.current.onended = async () => {
        if (onEndCallback) {
          await onEndCallback();
        } else {
          // Resume listening if it was active
          if (isListeningRef.current && statusRef.current !== 'processing') {
            setStatus('listening_wake');
            try {
              recognitionRef.current.start();
            } catch(e){}
          }
        }
      };
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing TTS:', error);
      if (onEndCallback) {
        await onEndCallback();
      } else {
        if (isListeningRef.current) {
          setStatus('listening_wake');
          try { recognitionRef.current.start(); } catch(e){}
        }
      }
    }
  };

  const handleFinalTranscript = async (text) => {
    const currentStatus = statusRef.current;

    if (currentStatus === 'listening_wake') {
      const isWakeWord = WAKE_WORDS.some(word => text.includes(word));
      if (isWakeWord) {
        console.log('Wake word detected!');
        setStatus('speaking'); // prevent re-triggering
        await speakText("Olá. O que deseja que o conselho resolva?", () => {
          setStatus('listening_command');
          if (isListeningRef.current) {
             try { recognitionRef.current.start(); } catch(e){}
          }
        });
      }
    } else if (currentStatus === 'listening_command') {
      // They just gave us the command
      if (text.length > 5) {
        console.log('Command received:', text);
        setStatus('processing');
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch(e){}
        }

        await speakText("Certo. Estou reunindo o conselho para analisar isso. Um momento.", async () => {
            await processCouncilFlow(text);
        });
      }
    }
  };

  // The full automated flow
  const processCouncilFlow = async (question) => {
    try {
      setStatus('processing');
      // 1. Create Session
      console.log('Creating session...');
      const sessionResult = await agentCouncilAPI.createSession(question, []);
      const sessionId = sessionResult.session_id;

      // Navigate to the view so the user can see it happening
      navigate(`/sessions/${sessionId}/execute`);

      // 2. Build Council
      console.log('Building council...');
      const councilConfig = await agentCouncilAPI.buildCouncil(sessionId);

      // We accept the default council and move to update
      await agentCouncilAPI.updateCouncil(sessionId, councilConfig);

      // 3. Execute
      console.log('Executing council...');
      await agentCouncilAPI.executeCouncil(sessionId);
      await pollUntil(sessionId, 'execution_complete');

      // 4. Peer Review
      console.log('Running peer review...');
      await agentCouncilAPI.startPeerReview(sessionId);
      await pollUntil(sessionId, 'review_complete');

      // 5. Synthesize (James's verdict)
      console.log('Synthesizing...');
      const verdictResult = await agentCouncilAPI.synthesize(sessionId);
      const verdict = verdictResult.verdict;

      console.log('Done!');
      // Navigate to final step
      navigate(`/sessions/${sessionId}/synthesize`);

      // Read the verdict aloud
      await speakText(`O conselho terminou a análise. Aqui está o meu veredito: ${verdict}`, () => {
         if (isListeningRef.current) {
           setStatus('listening_wake');
           try { recognitionRef.current.start(); } catch(e){}
         } else {
           setStatus('idle');
         }
      });

    } catch (error) {
      console.error("Council Auto-Flow Error:", error);
      await speakText("Desculpe, ocorreu um erro ao tentar processar o seu pedido com o conselho.", () => {
         if (isListeningRef.current) {
           setStatus('listening_wake');
           try { recognitionRef.current.start(); } catch(e){}
         } else {
           setStatus('idle');
         }
      });
    }
  };

  // Helper to wait for background tasks
  const pollUntil = async (sessionId, targetStatus) => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(async () => {
        try {
          const res = await agentCouncilAPI.getStatus(sessionId);
          if (res.status === targetStatus) {
            clearInterval(interval);
            resolve(res);
          } else if (res.status.includes('error')) {
            clearInterval(interval);
            reject(new Error(res.error || 'Unknown error'));
          }
        } catch (err) {
          clearInterval(interval);
          reject(err);
        }
      }, 3000);
    });
  };

  const toggleListening = () => {
    setIsListening(!isListening);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {isListening && (
        <div className="bg-white rounded-full px-4 py-2 shadow-lg border border-gray-200 flex items-center gap-3 animate-fade-in-up">
          <div className="flex flex-col">
             <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
               {status === 'listening_wake' && "Aguardando 'Oi James'"}
               {status === 'listening_command' && "Ouvindo sua pergunta..."}
               {status === 'processing' && "James está trabalhando..."}
               {status === 'speaking' && "James está falando..."}
             </span>
             <span className="text-sm text-gray-800 max-w-[200px] truncate" title={transcript}>
               {transcript || '...'}
             </span>
          </div>
          {status === 'processing' && <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />}
        </div>
      )}

      <button
        onClick={toggleListening}
        className={`p-4 rounded-full shadow-xl transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30'
        }`}
        title={isListening ? "Desativar Mãos Livres (James)" : "Ativar Mãos Livres (James)"}
      >
        {isListening ? (
          <div className="relative">
            <Mic className="w-6 h-6 animate-pulse" />
            <span className="absolute top-0 right-0 -mr-1 -mt-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-100"></span>
            </span>
          </div>
        ) : (
          <MicOff className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};
