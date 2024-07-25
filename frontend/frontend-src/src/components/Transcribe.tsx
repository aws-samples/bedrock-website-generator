import { Mic, PauseCircle, X } from 'lucide-react';
import { useState, useRef, useEffect } from "react";
import { startRecording, stopRecording } from '../lib/transcribe';

export default function Transcribe
  ({
    transcription,
    setTranscription,
    setRefreshIframe,
    setStepNotification,
    setStep,
    setDropdown
  }: { 
    transcription: string, 
    setTranscription: any, 
    setRefreshIframe: any, 
    setStepNotification: any, 
    setStep: any,
    setDropdown: any
  }) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const socket = useRef<WebSocket | null>(null);

  const handleInput = (event: any) => {
    setTranscription(event.target.value);
  }

  useEffect(() => {
    async function handleRecording() {
      if (isRecording) {
        await startRecording((text: string) => {
          setTranscription((prevTranscription: string) => { return prevTranscription + text; })
        });
      } else {
        stopRecording();
      }
    }
    handleRecording();
  }, [isRecording]);

  const handleValidate = async () => {
    try {
      await openWebSocketConnection();
      const bedrockApiUrl = process.env.NEXT_PUBLIC_BEDROCK_API_URL;
      setStepNotification("");
      setStep(0);
      setDropdown(true);
      await fetch(bedrockApiUrl as string, {
        method: 'POST',
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcription }),
      });
    } catch (error) {
      console.error(error);
    }
  }

  const handleReset = async () => {
    try {
      const bedrockApiUrl = process.env.NEXT_PUBLIC_BEDROCK_API_URL;
      await fetch(bedrockApiUrl as string, {
        method: 'DELETE',
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.error(error);
    }
    setRefreshIframe((prevRefreshIframe: number) => prevRefreshIframe + 1);
    setStep(0);
    setStepNotification("");
    setDropdown(false);
  }

  const openWebSocketConnection = async () => {
    if (socket.current?.readyState !== WebSocket.OPEN) {
      const webSocketApiUrl = process.env.NEXT_PUBLIC_WSS_API_URL;
      socket.current = new WebSocket(webSocketApiUrl as string);
      socket.current.addEventListener('open', () => {
        console.log('WebSocket connected');
      })
      socket.current.addEventListener('close', () => {
        console.log('WebSocket closed');
      })
      socket.current.addEventListener('message', (event) => {
        setStepNotification(event.data);
        setStep((prevStep: number) => prevStep + 1);
        if (event.data === "HTML file successfully updated in the S3 bucket.") {
          closeWebSocketConnection();
          setRefreshIframe((prevRefreshIframe: number) => prevRefreshIframe + 1);
        }
      })
    }
  };

  const closeWebSocketConnection = () => {
    socket.current?.close();
  };

  return (
    <div className="w-full flex flex-col items-center justify-center gap-8 p-8">
      <div className='flex gap-4 w-full'>
        <div className='relative w-full'>
          <input value={transcription} onChange={handleInput} className="block resize-none w-full p-4 pr-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500" placeholder="Describe the website you want to generate..." />
          <button onClick={() => setTranscription("")} className="absolute inset-y-0 end-0 text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-0 text-sm pe-3">{transcription && <X />}</button>
        </div>
        <button onClick={() => setIsRecording(prevIsRecording => !prevIsRecording)} className="text-white bg-red-700 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-full text-sm px-4 py-2 text-center">{isRecording ? <PauseCircle /> : <Mic />}</button>
      </div>
      <div className='flex flex-row gap-4'>
        {/* Two Buttons */}
        <button type="button" onClick={() => handleReset()} className="text-white text-lg bg-red-400 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium rounded-lg px-5 py-2.5 text-center hover:bg-white hover:text-red-400 border hover:border-red-400 transition-all">Reset</button>
        <button type="button" onClick={() => handleValidate()} className="text-white text-lg bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-lg px-5 py-2.5 text-center hover:bg-white hover:text-green-700 border hover:border-green-700 transition-all">Validate</button>
      </div>
    </div>
  )
}