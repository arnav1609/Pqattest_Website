import room from './assets/room.webp';
import turn from './assets/turn.webp';
import flight from './assets/flight.webp';
import welcome from './assets/welcome.webp';
import './cleanroom.css';

const chapters = [
  ['The problem', 'Who gets to use shared memory?', 'Several processors share the same on-chip network. A message can reach a memory interface, but its arrival alone tells us little about the processor that sent it. Should that processor be allowed to write?', 'PQ-Attest explores how hardware can check a processor’s firmware before granting access. A root of trust asks for evidence, checks the response, then decides whether to open the processor’s gate.', 'See how it works', '#how'],
  ['The build', 'Six tiles, one trust decision', 'The prototype connects six tiles on an FPGA. A RISC-V processor on tile 3 answers a challenge from the root of trust. After a successful check, its network interface can forward a request to shared memory.', 'Select a block in the chip explorer to inspect its role and statistics. Follow a request through the routers, then follow the reply back to the processor.', 'Explore the architecture', '#architecture'],
  ['The tests', 'What happened at the gate?', 'The walkthroughs show a trusted processor accessing memory, an untrusted processor being stopped locally, and permission being revoked. A local refusal ends at the sending tile.', 'The results page ties measurements to the build that produced them. The forged-packet test belongs to simulation; the corresponding external port is tied off in the board image.', 'See measured results', '#results']
];
export function mountRoom() {
 const section=document.createElement('section');section.id='cleanroom';
 document.querySelector('main')!.prepend(section);
 section.innerHTML=`<div class="room-title"><p class="eyebrow">PQ-ATTEST / CONCEPT CLEANROOM</p><h1>Inside PQ-Attest</h1><p>Meet the engineer or step inside the six-tile chip.</p></div><div class="room-frame"><img class="room-base" alt="A suited engineer beside a lithography tool and a chip on an inspection bench"><img class="room-turn" alt=""><button class="room-person">Meet the engineer</button><a class="room-chip" href="#inspect">Explore the chip ↗</a></div>`;
 const frame=section.querySelector<HTMLElement>('.room-frame')!;
 section.querySelector<HTMLImageElement>('.room-base')!.src=room;
 section.querySelector<HTMLImageElement>('.room-turn')!.src=welcome;
 const flightFrames = new Image();
 let entering = false;
 const chip = frame.querySelector<HTMLAnchorElement>('.room-chip')!;
 chip.addEventListener('click', async event => {
   if (event.metaKey || event.ctrlKey || event.shiftKey || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   event.preventDefault();
   if (entering) return;
   entering = true;
   const startBox = frame.getBoundingClientRect();
   location.hash = 'inspect';
   const canvas = document.createElement('canvas');
   canvas.width = 480;
   canvas.height = 284;
   canvas.className = 'flight-frame';
   canvas.setAttribute('aria-hidden', 'true');
   try {
     flightFrames.src = flight;
     await flightFrames.decode();
     if (!['#explore','#inspect'].includes(location.hash)) return;
     const ctx = canvas.getContext('2d');
     if (!ctx) return;
     Object.assign(canvas.style,{position:'fixed',top:startBox.top+'px',left:startBox.left+'px',width:startBox.width+'px',height:startBox.height+'px',zIndex:'40'});
     document.body.append(canvas);
     const target=document.querySelector('#stage')!.getBoundingClientRect();
     canvas.animate([{transform:'none'},{transform:`translate(${target.x-startBox.x}px,${target.y-startBox.y}px) scale(${target.width/startBox.width},${target.height/startBox.height})`}],{duration:960,fill:'forwards',easing:'ease-in-out'});
     const start = performance.now();
     await new Promise<void>(resolve => {
       function draw(now: number) {
         const index = Math.min(24, Math.floor((now - start) / 40));
         ctx!.drawImage(flightFrames, index % 5 * 480, Math.floor(index / 5) * 284, 480, 284, 0, 0, 480, 284);
         if (index === 24 || !['#inspect','#explore'].includes(location.hash)) resolve();
         else requestAnimationFrame(draw);
       }
       draw(start);
     });
   } catch { /* The normal explorer route also works without the filmstrip. */ }
   finally {
     if (canvas.isConnected) await canvas.animate([{opacity:1},{opacity:0}],{duration:180}).finished;
     entering = false;
     requestAnimationFrame(() => canvas.remove());
   }
 });
 const dlg=document.createElement('dialog');dlg.className='room-guide';dlg.setAttribute('aria-labelledby','guide-title');document.body.append(dlg);
 function chapter(i:number){const [label,title,first,second,action,href]=chapters[i];
 dlg.innerHTML=`<button class="room-close" aria-label="Close guide">×</button><p class="eyebrow">ENGINEER’S GUIDE</p><nav aria-label="Guide chapters">${chapters.map(([name],j)=>`<button data-chapter="${j}" aria-pressed="${j===i}">${name}</button>`).join('')}</nav><p class="eyebrow">${label}</p><h2 id="guide-title" tabindex="-1">${title}</h2><p>${first}</p><p>${second}</p><a href="${href}">${action} →</a>`;
 dlg.querySelector('h2')!.focus();}
 dlg.onclick=(e)=>{const el=e.target as HTMLElement;if(el.dataset.chapter!==undefined)chapter(Number(el.dataset.chapter));else if(el.closest('a,.room-close')||el===dlg)dlg.close();};
 const turning = new Image();
 async function turnToVisitor(){
   if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
   turning.src = turn;
   try { await turning.decode(); } catch { return; }
   if (!dlg.open) return;
   const canvas = document.createElement('canvas');
   canvas.className = 'engineer-turn';
   canvas.width = 480;
   canvas.height = 284;
   const ctx = canvas.getContext('2d');
   if (!ctx) return;
   frame.append(canvas);
   const start = performance.now();
   function draw(now:number){
     const index = Math.min(11, Math.floor((now-start)/38));
     ctx!.drawImage(turning,index%4*480,Math.floor(index/4)*284,480,284,0,0,480,284);
     if (dlg.open && index < 11) requestAnimationFrame(draw);
     else canvas.remove();
   }
   draw(start);
 }
 function open(){
   frame.classList.add('welcoming');
   chapter(0);
   dlg.showModal();
   void turnToVisitor();
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
 const guide=document.createElement('button');guide.textContent='Engineer guide';document.querySelector('#nav')!.append(guide);guide.onclick=navigate;
 return (active:boolean)=>{section.hidden=!active;if(active&&!matchMedia('(prefers-reduced-motion: reduce)').matches){try{if(sessionStorage.getItem('room-seen'))return;sessionStorage.setItem('room-seen','1');}catch{return;}
 const cloud=document.createElement('div');cloud.className='cloud-curtain';cloud.innerHTML='<i></i><i></i><button>Skip intro</button>';document.body.append(cloud);cloud.onclick=()=>cloud.remove();setTimeout(()=>cloud.remove(),1150);}};
}
