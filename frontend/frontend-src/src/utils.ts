export function handleResize(mouseDownEvent: any, iframeWidth: any, setIframeWidth: any){
  const startPosition = mouseDownEvent.pageX;
  
  const onMouseMove = (mouseMoveEvent: any) => {
    let newIframeWidth = iframeWidth + ((startPosition - mouseMoveEvent.pageX)/window.innerWidth)*100;
    if(newIframeWidth < 0) {
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