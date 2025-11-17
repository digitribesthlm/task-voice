import { GoogleGenAI, Modality, Type } from '@google/genai';
import React, { useState, useRef, useCallback } from 'react';
import { MicIcon } from './Icons';

// --- Audio Helper Functions ---
function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// --- Component ---
const VoiceAssistant = ({ todayTasks, clients, clientsMap, addTask, updateTaskStatus, apiKey }) => {
    const [isListening, setIsListening] = useState(false);
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [isAssistantActive, setIsAssistantActive] = useState(false);

    const sessionRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const sourceNodeRef = useRef(null);

    const outputAudioContextRef = useRef(null);
    const nextStartTimeRef = useRef(0);
    const sourcesRef = useRef(new Set());

    const readTasksFunctionDeclaration = {
        name: 'readTasks',
        description: 'Reads out the list of today\'s critical tasks, including their completion status.',
        parameters: { type: Type.OBJECT, properties: {} }
    };
    const addTaskFunctionDeclaration = {
        name: 'addTask',
        description: 'Adds a new task to today\'s critical tasks list.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING, description: 'The title of the task.' },
                clientName: { type: Type.STRING, description: `The name of the client. Must be one of: ${clients.map(c => c.name).join(', ')}` }
            },
            required: ['title', 'clientName']
        }
    };
    const updateTaskStatusFunctionDeclaration = {
        name: 'updateTaskStatus',
        description: 'Marks a specific task as complete or incomplete.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                taskTitle: { type: Type.STRING, description: 'The title or keywords of the task to update.' },
                completed: { type: Type.BOOLEAN, description: 'Whether the task is completed or not.' }
            },
            required: ['taskTitle', 'completed']
        }
    };
    
    const handleFunctionCall = async (fc) => {
        let result = "Sorry, I can't do that.";
        if (fc.name === 'readTasks') {
            if (todayTasks.length === 0) {
                result = "There are no tasks for today.";
            } else {
                result = "Here are today's tasks: " + todayTasks.map(t => `${t.title} for ${clientsMap.get(t.clientId)?.name}, which is currently ${t.completed ? 'complete' : 'not complete'}`).join('. ');
            }
        } else if (fc.name === 'addTask' && fc.args.title && fc.args.clientName) {
            result = await addTask(fc.args.title, fc.args.clientName);
        } else if (fc.name === 'updateTaskStatus' && fc.args.taskTitle) {
            result = await updateTaskStatus(fc.args.taskTitle, fc.args.completed);
        }

        const session = await sessionRef.current;
        session?.sendToolResponse({
            functionResponses: [{ id : fc.id, name: fc.name, response: { result: result } }]
        });
    };

    const processMessage = async (message) => {
        // Transcription
        if (message.serverContent?.inputTranscription) {
            setUserTranscript(prev => prev + message.serverContent.inputTranscription.text);
        }
        if (message.serverContent?.outputTranscription) {
            setModelTranscript(prev => prev + message.serverContent.outputTranscription.text);
        }
        if(message.serverContent?.turnComplete) {
            setUserTranscript('');
            setModelTranscript('');
        }

        // Function Calling
        if (message.toolCall?.functionCalls) {
            for (const fc of message.toolCall.functionCalls) {
                await handleFunctionCall(fc);
            }
        }

        // Audio Output
        const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (base64Audio) {
            const outCtx = outputAudioContextRef.current;
            if (outCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.addEventListener('ended', () => { sourcesRef.current.delete(source); });
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
            }
        }
         if (message.serverContent?.interrupted) {
            for (const source of sourcesRef.current.values()) {
                source.stop();
                sourcesRef.current.delete(source);
            }
            nextStartTimeRef.current = 0;
        }
    };
    
    const startListening = async () => {
        try {
            if (!apiKey) {
                throw new Error('GEMINI_API_KEY is not defined');
            }
            const ai = new GoogleGenAI({ apiKey });
            
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            
            setUserTranscript('');
            setModelTranscript('');
            setIsAssistantActive(true);
            setIsListening(true);
            
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            sessionRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        if (!audioContextRef.current || !mediaStreamRef.current) return;
                        sourceNodeRef.current = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
                        scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (event) => {
                            const inputData = event.inputBuffer.getChannelData(0);
                            const pcmBlob = {
                                data: encode(new Uint8Array(new Int16Array(inputData.map(x => x * 32768)).buffer)),
                                mimeType: 'audio/pcm;rate=16000',
                            };
                            sessionRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        
                        sourceNodeRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(audioContextRef.current.destination);
                    },
                    onmessage: processMessage,
                    onerror: (e) => console.error("Gemini Error:", e),
                    onclose: () => console.log("Gemini connection closed."),
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' }}},
                    tools: [{ functionDeclarations: [readTasksFunctionDeclaration, addTaskFunctionDeclaration, updateTaskStatusFunctionDeclaration] }],
                     systemInstruction: "You are a helpful assistant for managing an SEO agency's tasks. Be concise and friendly."
                }
            });

        } catch (error) {
            console.error("Failed to start voice assistant:", error);
            setIsListening(false);
            setIsAssistantActive(false);
        }
    };
    
    const stopListening = useCallback(async () => {
        setIsListening(false);
        setIsAssistantActive(false);

        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if(scriptProcessorRef.current){
             scriptProcessorRef.current.disconnect();
             scriptProcessorRef.current = null;
        }
        if(sourceNodeRef.current){
            sourceNodeRef.current.disconnect();
            sourceNodeRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            await audioContextRef.current.close();
            audioContextRef.current = null;
        }
         if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            await outputAudioContextRef.current.close();
            outputAudioContextRef.current = null;
        }
        if (sessionRef.current) {
            const session = await sessionRef.current;
            session.close();
            sessionRef.current = null;
        }
    }, []);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };

    return (
        <>
            <button
                onClick={toggleListening}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-colors duration-300 z-50 ${isListening ? 'bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                aria-label={isListening ? 'Stop Listening' : 'Start Voice Assistant'}
            >
                <MicIcon className="w-8 h-8" />
            </button>

            {isAssistantActive && (
                <div className="fixed top-1/2 right-6 -translate-y-1/2 z-40 w-96 max-w-md">
                    <div className="bg-[#1B2234] rounded-xl p-6 text-white shadow-2xl border border-slate-700">
                        <p className="text-lg text-slate-400 min-h-[2.5rem]">
                            <span className="font-bold text-white">You: </span>{userTranscript}
                        </p>
                        <p className="text-lg mt-2 text-slate-300 min-h-[2.5rem]">
                            <span className="font-bold text-white">Assistant: </span>{modelTranscript}
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceAssistant;
