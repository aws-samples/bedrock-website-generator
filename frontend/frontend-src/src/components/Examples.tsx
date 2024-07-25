export default function Examples({ setTranscription } : { setTranscription: any }) {
  const examples = [
    'Add a navigation bar',
    'Make this website look like a ecommerce platform',
    'Propose me an alternative version of the website',
  ];
  
  return (
    < div className = "flex flex-col p-8 px-10 w-full gap-3" >
    {examples.map((example, index) =>
        <button key={index} onClick={() => setTranscription(example)} className='border py-8 rounded-lg ring-2 ring-orange-400/50 text-sm italic opacity-50 bg-orange-200 w-full hover:bg-orange-300'>{example}</button>
      )
    }
    </div >
  )
}