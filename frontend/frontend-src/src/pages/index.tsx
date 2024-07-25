import { useState } from 'react';
import Image from 'next/image';
import Examples from '@/components/Examples';
import Transcribe from '@/components/Transcribe';
import Steps from '@/components/Steps';

export default function Home() {
  const [refeshIframe, setRefreshIframe] = useState<number>(0);
  const [iframeWidth, setIframeWidth] = useState(70);
  const [transcription, setTranscription] = useState<string>("");
  const [stepNotification, setStepNotification] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [dropdown, setDropdown] = useState(false);

  const handleResize = (mouseDownEvent: any) => {
    const startPosition = mouseDownEvent.pageX;

    const onMouseMove = (mouseMoveEvent: any) => {
      let newIframeWidth = iframeWidth + ((startPosition - mouseMoveEvent.pageX) / window.innerWidth) * 100;
      if (newIframeWidth < 0) {
        newIframeWidth = 0;
      } else if (newIframeWidth > 100) {
        newIframeWidth = 100;
      }
      setIframeWidth(newIframeWidth);
    }

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp, { once: true });
  };

  return (
    <main className="flex h-screen flex-row items-center justify-between">
      {/* {isRecording ? <iframe className="w-full h-1/2 border-4 border-red-300 bg-slate-50 resize-y overflow-auto" /> : <div className='w-full h-1/2 border-4 border-red-300 bg-slate-50 resize-y overflow-auto flex items-center justify-center'><Loader2 className='animate-spin'/></div>} */}
      <div className='h-full overflow-auto' style={{ width: `${100 - iframeWidth}%` }}>
        <div className='sticky top-0 bg-white flex flex-col items-center shadow w-full pt-6 z-10'>
          <Image src="/powered_by_aws.png" width={120} height={80} alt='image' />
          <Image src="/voicetocode-logo.png" width={300} height={200} alt='image' />
        </div>
        <div className='flex flex-col items-center p-10 space-y-6'>
          <Transcribe transcription={transcription} setTranscription={setTranscription} setRefreshIframe={setRefreshIframe} setStepNotification={setStepNotification} setStep={setStep} setDropdown={setDropdown} />
          <Steps step={step} stepNotification={stepNotification} dropdown={dropdown} setDropdown={setDropdown} />
          <Examples setTranscription={setTranscription} />
        </div>
      </div>
      <div className='flex items-center h-full bg-black p-1'>
        <button onMouseDown={handleResize} className='h-16 p-0.5 rounded bg-gray-400 cursor-ew-resize'></button>
      </div>
      {/* TODO Create a SSM Parameter redirecting to the cloudfront distribution */}
      <iframe src={`https://${process.env.NEXT_PUBLIC_DISTRIBUTION_NAME}/index0.html?id=${refeshIframe}`} className="h-full shadow overflow-auto" style={{ width: `${iframeWidth}%` }} key={refeshIframe} />
    </main>
  )
}
