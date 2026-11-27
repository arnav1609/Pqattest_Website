import room from './assets/cleanroom-photo.webp';
import die from './assets/die-top.webp';
import './cleanroom.css';

const chapters = [
  ['The problem', 'Who gets to use shared memory?', 'Several processors share the same on-chip network. A message can reach a memory interface, but its arrival alone tells us little about the processor that sent it. Should that processor be allowed to write?', 'PQ-Attest explores how hardware can check a processor’s firmware before granting access. A root of trust asks for evidence, checks the response, then decides whether to open the processor’s gate.', 'See how it works', '#how'],
  ['The build', 'Six tiles, one trust decision', 'The prototype connects six tiles on an FPGA. A RISC-V processor on tile 3 answers a challenge from the root of trust. After a successful check, its network interface can forward a request to shared memory.', 'Select a block in the chip explorer to inspect its role and statistics. Follow a request through the routers, then follow the reply back to the processor.', 'Explore the architecture', '#architecture'],
  ['The tests', 'What happened at the gate?', 'The walkthroughs show a trusted processor accessing memory, an untrusted processor being stopped locally, and permission being revoked. A local refusal ends at the sending tile.', 'The results page ties measurements to the build that produced them. The forged-packet test belongs to simulation; the corresponding external port is tied off in the board image.', 'See measured results', '#results']
];
export function mountRoom(enterExplorer: () => DOMRect | undefined, finishEntrance: () => void) {
 const section=document.createElement('section');section.id='cleanroom';section.setAttribute('aria-label','PQ-Attest cleanroom introduction');
 document.querySelector('main')!.prepend(section);
 section.innerHTML=`<div class="room-frame"><div class="room-light"><img class="room-base" alt="A suited engineer beside a lithography tool and a chip on an inspection bench"></div><img class="tray-die" alt=""><span class="room-marker" aria-hidden="true"></span><button class="room-person">Meet the engineer</button><a class="room-chip" href="#inspect">Explore the chip ↗</a></div>`;
 const frame=section.querySelector<HTMLElement>('.room-frame')!;
 section.querySelector<HTMLImageElement>('.room-base')!.src=room;
 const photo=frame.querySelector<HTMLElement>('.room-light')!;
 const tile=frame.querySelector<HTMLImageElement>('.tray-die')!;
 tile.src=die;
 let entering=false;
 // Coordinates measured on the 1536 by 1024 opening photograph.
 const anchor={x:769/1536,y:677/1024};
 function pose(flat:number,zoom:number) {
   const w=frame.clientWidth,h=frame.clientHeight;
   const side=w*.065;
   const xAxis=[side*(1-flat)+side*flat, h*.006*(1-flat)];
   const yAxis=[-w*.028*(1-flat),h*.045*(1-flat)+side*.68*flat];
   const x=anchor.x*w, y=anchor.y*h;
   tile.style.transform=`matrix(${xAxis[0]*zoom/400},${xAxis[1]*zoom/400},${yAxis[0]*zoom/272},${yAxis[1]*zoom/272},${x-zoom*(xAxis[0]+yAxis[0])/2},${y-zoom*(xAxis[1]+yAxis[1])/2})`;
 }
 const observer=new ResizeObserver(()=>{if(!entering)pose(0,1)});
 observer.observe(frame);
 const chip=frame.querySelector<HTMLAnchorElement>('.room-chip')!;
 chip.onclick = async event => {
   if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
   event.preventDefault();
   if (entering) return;
   entering = true;
   if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
     enterExplorer();
     finishEntrance();
     return;
   }

   const source = frame.getBoundingClientRect();
   const tray = new DOMMatrix(getComputedStyle(tile).transform);
   const layer = document.createElement('div');
   layer.className = 'chip-handoff';
   layer.setAttribute('aria-hidden', 'true');
   const background = photo.cloneNode(true) as HTMLElement;
   Object.assign(background.style, {position:'absolute', left:source.x+'px', top:source.y+'px',
     width:source.width+'px', height:source.height+'px', maxWidth:'none', transformOrigin:'50.065% 66.113%'});
   layer.append(background);
   document.body.append(layer);
   const dieRect = enterExplorer();
   const canvas = document.querySelector<HTMLCanvasElement>('#stage canvas');
   if (!canvas || !dieRect || !dieRect.width) { layer.remove(); finishEntrance(); return; }

   // Project the real die onto the photographed tray, then animate that same
   // canvas to its native position. No bitmap enlargement or final image swap.
   const destination = canvas.getBoundingClientRect();
   const a = tray.a * 400 / dieRect.width, b = tray.b * 400 / dieRect.width;
   const c = tray.c * 272 / dieRect.height, d = tray.d * 272 / dieRect.height;
   const x = source.x + tray.e - a*dieRect.x - c*dieRect.y;
   const y = source.y + tray.f - b*dieRect.x - d*dieRect.y;
   const surface = document.createElement('div');
   Object.assign(surface.style,{position:'absolute',left:'0',top:'0',width:destination.width+'px',
     height:destination.height+'px',transformOrigin:'0 0',background:getComputedStyle(document.querySelector('#stage')!).backgroundImage+', var(--charcoal)'});
   const parent = canvas.parentNode!;
   const next = canvas.nextSibling;
   const style = canvas.style.cssText;
   Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});
   surface.append(canvas);
   layer.append(surface);
   layer.style.background='transparent';
   const timing = {duration:820,easing:'cubic-bezier(.23,.68,.26,1)',fill:'both' as FillMode};
   const crop = `inset(${dieRect.top}px ${destination.width-dieRect.right}px ${destination.height-dieRect.bottom}px ${dieRect.left}px)`;
   const motion = surface.animate([
     {transform:`matrix(${a},${b},${c},${d},${x},${y})`, clipPath:crop},
     {transform:`translate(${destination.left}px,${destination.top}px)`, clipPath:'inset(0px 0px 0px 0px)'}
   ],timing);
   background.animate([{transform:'scale(1)',opacity:1},{transform:'scale(1.22)',opacity:0}],timing);
   try {await motion.finished;} finally {
     canvas.style.cssText=style;
     parent.insertBefore(canvas,next);
     layer.remove();
     finishEntrance();
   }
 };
 const dlg=document.createElement('dialog');dlg.className='room-guide';dlg.setAttribute('aria-labelledby','guide-title');document.body.append(dlg);
 function chapter(i:number){const [label,title,first,second,action,href]=chapters[i];
 dlg.innerHTML=`<button class="room-close" aria-label="Close guide">×</button><p class="eyebrow">ENGINEER’S GUIDE</p><nav aria-label="Guide chapters">${chapters.map(([name],j)=>`<button data-chapter="${j}" aria-pressed="${j===i}">${name}</button>`).join('')}</nav><p class="eyebrow">${label}</p><h2 id="guide-title" tabindex="-1">${title}</h2><p>${first}</p><p>${second}</p>${section.isConnected ? '' : `<a href="${href}">${action} →</a>`}`;
 dlg.querySelector('h2')!.focus();}
 dlg.onclick=(e)=>{const el=e.target as HTMLElement;if(el.dataset.chapter!==undefined)chapter(Number(el.dataset.chapter));else if(el.closest('a,.room-close')||el===dlg)dlg.close();};
 function open(){
   frame.classList.add('welcoming');
   chapter(0);
   dlg.showModal();

 }
 function navigate(){
   dlg.innerHTML = `<button class="room-close" aria-label="Close guide">×</button>
     <p class="eyebrow">ENGINEER’S GUIDE</p><h2 id="guide-title">Where would you like to go?</h2>
     <p>Select a chip component to see its role and resource counts, or follow a request through the network.</p>
     <button data-chapter="0">Explain the project</button>
     <ul><li><a href="#explore/access">Follow a memory request</a></li>
     <li><a href="#results">See measured results</a></li><li><a href="#glossary">Look up a term</a></li></ul>`;
   dlg.showModal();
 }
 dlg.onclose=()=>frame.classList.remove('welcoming');
 section.querySelector('.room-person')!.addEventListener('click',open);
 frame.addEventListener('click',e=>{
   if(entering || (e.target as Element).closest('a,button'))return;
   const box=frame.getBoundingClientRect(), x=(e.clientX-box.left)/box.width, y=(e.clientY-box.top)/box.height;
   if(x>.43 && x<.58 && y>.61 && y<.72)chip.click();
   else if(x>.19 && x<.36 && y>.25 && y<.93)open();
 });
 const guide=document.createElement('button');guide.textContent='Engineer guide';document.querySelector('#nav')!.append(guide);guide.onclick=navigate;
 return (active:boolean)=>{document.body.classList.toggle('intro-only',active);section.hidden=!active;if(!active){observer.disconnect();section.remove();return;}if(active&&!matchMedia('(prefers-reduced-motion: reduce)').matches){try{if(sessionStorage.getItem('room-seen'))return;sessionStorage.setItem('room-seen','1');}catch{return;}
 const cloud=document.createElement('div');cloud.className='cloud-curtain';cloud.innerHTML='<i></i><i></i>';document.body.append(cloud);cloud.setAttribute('aria-hidden','true');setTimeout(()=>cloud.remove(),2650);}};
}
