import { Loader2, ChevronDown } from "lucide-react"
import { useState } from "react"

export default function Steps
  ({
    step,
    stepNotification,
    dropdown,
    setDropdown
  }: {
    step: number,
    stepNotification: string,
    dropdown: boolean,
    setDropdown: any
  }) {

  const handleDropdown = () => {
    setDropdown(!dropdown);
  }

  return (
    <div className='p-4 px-10 transition-all w-full'>
      <button onClick={handleDropdown} className={`flex items-center justify-center w-full border h-10 ${dropdown ? 'rounded-t-lg': 'rounded-lg'} transition-all shadow gap-2`}>Progession<ChevronDown className={dropdown ? 'rotate-180 transition-all': 'transition-all'}/></button>
      {dropdown && <div className='border w-full rounded-b-lg shadow'>
        <div className='flex flex-col justify-center items-center p-6 w-full space-y-4'>
          <div className="w-full bg-gray-200 rounded-full dark:bg-gray-700">
            <div className="bg-blue-600 text-xs font-medium text-blue-100 text-center p-0.5 leading-none rounded-full transition-all" style={{ width: `${(step/3 * 100) <= 100 ? step/3 * 100 : 100 }%` }}>{Math.floor(step/3 * 100) <= 100 ? Math.floor(step/3 * 100) : 100 } %</div>
          </div>
          {stepNotification && <div className='flex justify-center items-center gap-6 border rounded-lg overflow-auto bg-gray-50 p-4 w-full'>{step < 3 && <Loader2 className='animate-spin w-8 h-8 m-2' />}{stepNotification}</div>}
        </div>
      </div>}
    </div>
  )

}