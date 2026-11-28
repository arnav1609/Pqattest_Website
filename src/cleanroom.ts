import room from './assets/cleanroom-photo.webp';
import die from './assets/die-top.webp';
import './cleanroom.css';

const researchQuestions = [
  ['When does a revoked permission actually stop a write?',
   'Tile 4 can cancel Tile 3’s grant while a write is already travelling to Tile 2. The question is which clock edge at shared memory decides whether that write may commit. The walkthrough shows the simpler case of a new request after revocation.'],
  ['Does sharing the authentication engine delay revocation?',
   'KMAC checks messages on the authenticated link. The first task is to trace whether REVOKE actually uses that engine. If it does, the study compares dedicated and shared engines under the same traffic and measures the time from Tile 4’s decision to effective denial at memory.'],
  ['What does each design cost in silicon?',
   'A shared engine could save area but introduce waiting or a longer timing path. The planned ASIC comparison measures area, timing and routing under matched conditions. The current FPGA results provide a baseline for the prototype.'],
];

const chapters = [
  {
    label: 'The problem', title: 'What problem are we solving?',
    paragraphs: [
      'How quickly can a chip withdraw permission to change shared memory? PQ-Attest starts with a six-tile network. Tile 4 checks Tile 3’s firmware and grants access to memory on Tile 2. The harder case comes when Tile 4 cancels permission while work is already in flight.',
    ], action: 'See how it works', href: '#how',
  },
  {
    label: 'The build', title: 'How does the six-tile chip enforce that decision?',
    paragraphs: [
      'The prototype is a 3 × 2 network of tiles implemented on an Artix-7 FPGA. Tile 3 hashes its entire 16 KiB instruction memory with SHA3-256. That fingerprint gives Tile 4 a way to check which firmware image was measured.',
      'Tile 4 sends a fresh challenge. Tile 3 returns its measurement and a KMAC128 tag made with a shared key. Tile 4 checks the response against the expected measurement and issues GRANT if it matches. The fresh challenge prevents an old reply from being reused.',
      'Once authorized, Tile 3 can send a write through routers 3 → 4 → 5 → 2. Tile 2 stores the number and sends a receipt, labeled ACK, back to Tile 3. This is the exchange you can follow in the explorer.',
    ], action: 'Explore the architecture', href: '#architecture',
  },
  {
    label: 'The tests', title: 'What happened at the gate?',
    paragraphs: [
      'In the authorized case, Tile 3 writes 0xC0DE5A5A and receives an ACK. It then reads the address back. Only when the returned value matches does the firmware print T3 PASS. The short demo shows the write and receipt. The full walkthrough includes the readback.',
      'Tile 0 tries the same address with 0xB0B0B0B0. Its bridge refuses the request locally, so no write packet enters the mesh. A separate revocation test shows that Tile 3 also loses access when its grant is withdrawn.',
      'These behaviors were checked in simulation. The 15 November Revision 10 FPGA build met its 50 MHz timing target after routing. A board pass was reported for the earlier 7 November image. Board testing of Revision 10 is still pending.',
    ], action: 'See measured results', href: '#results',
  },
];
export function mountRoom(enterExplorer: () => DOMRect | undefined, finishEntrance: () => void) {
 const section=document.createElement('section');section.id='cleanroom';section.setAttribute('aria-label','PQ-Attest cleanroom introduction');
 document.querySelector('main')!.prepend(section);
 section.innerHTML=`<div class="room-frame"><div class="room-light"><img class="room-base" alt="A suited engineer beside a lithography tool and a chip on an inspection bench"></div><img class="tray-die" alt=""><span class="room-marker" aria-hidden="true"></span><p class="room-note">Illustrative cleanroom · Artix-7 FPGA prototype</p><button class="room-person">Meet the engineer</button><a class="room-chip" href="#inspect">Explore the chip ↗</a></div>`;
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
   const centerX = dieRect.x + dieRect.width / 2;
   const centerY = dieRect.y + dieRect.height / 2;
   const trayX = source.x + tray.e + tray.a * 200 + tray.c * 136;
   const trayY = source.y + tray.f + tray.b * 200 + tray.d * 136;
   const toX = destination.left + centerX - trayX;
   const toY = destination.top + centerY - trayY;
   const surface = document.createElement('div');
   Object.assign(surface.style,{position:'absolute',left:'0',top:'0',width:destination.width+'px',
     height:destination.height+'px',transformOrigin:`${centerX}px ${centerY}px`,background:getComputedStyle(document.querySelector('#stage')!).backgroundImage+', var(--charcoal)'});
   const parent = canvas.parentNode!;
   const next = canvas.nextSibling;
   const style = canvas.style.cssText;
   Object.assign(canvas.style,{display:'block',width:'100%',height:'100%'});
   surface.append(canvas);
   layer.append(surface);
   const zoom = Math.min(2.05, Math.max(1.18, .85 / a));
   const pan = .32;
   const timing = {duration:2280, fill:'both' as FillMode};
   const approachEnd = 1060 / timing.duration;
   const liftEnd = 2120 / timing.duration;
   const travel = 'cubic-bezier(.34,0,.68,.76)';
   const settle = 'cubic-bezier(.29,.42,.23,1)';
   const crop = `inset(${dieRect.top}px ${destination.width-dieRect.right}px ${destination.height-dieRect.bottom}px ${dieRect.left}px)`;
   const trayPose = (scale:number, progress:number) =>
     `translate(${trayX-centerX+toX*progress}px,${trayY-centerY+toY*progress}px) matrix(${a*scale},${b*scale},${c*scale},${d*scale},0,0)`;
   const overhead = `translate(${destination.left}px,${destination.top}px) matrix(1,0,0,1,0,0)`;
   const motion = surface.animate([
     {offset:0, transform:trayPose(1,0), clipPath:crop, easing:travel},
     {offset:approachEnd, transform:trayPose(zoom,pan), clipPath:crop, easing:settle},
     {offset:liftEnd, transform:overhead, clipPath:crop, easing:'ease-out'},
     {offset:1, transform:overhead, clipPath:'inset(0px 0px 0px 0px)'}
   ],timing);
   // Lock the photographic tray and projected chip together during the push-in.
   background.style.transformOrigin = `${trayX-source.x}px ${trayY-source.y}px`;
   const roomPose = (scale:number, progress:number) =>
     `translate(${toX*progress}px,${toY*progress}px) scale(${scale})`;
   background.animate([
     {offset:0, transform:roomPose(1,0), opacity:1, easing:travel},
     {offset:approachEnd, transform:roomPose(zoom,pan), opacity:1, easing:settle},
     {offset:liftEnd, transform:roomPose(zoom*1.15,1), opacity:0},
     {offset:1, transform:roomPose(zoom*1.15,1), opacity:0}
   ],timing);
   const charcoal = getComputedStyle(layer).backgroundColor;
   layer.animate([{backgroundColor:charcoal}, {offset:liftEnd,backgroundColor:charcoal},
     {backgroundColor:'transparent'}],timing);
   const finishTimer = window.setTimeout(() => motion.finish(), timing.duration + 150);
   try {await motion.finished;} finally {
     clearTimeout(finishTimer);
     canvas.style.cssText=style;
     parent.insertBefore(canvas,next);
     layer.remove();
     finishEntrance();
   }
 };
 const dlg=document.createElement('dialog');dlg.className='room-guide';dlg.setAttribute('aria-labelledby','guide-title');document.body.append(dlg);
 function chapter(i:number){const {title,paragraphs,action,href}=chapters[i];
 const research = i === 0 ? `<ol class="research-questions">${researchQuestions.map(([question, explanation]) => `<li><h3>${question}</h3><p>${explanation}</p></li>`).join('')}</ol>` : '';
 dlg.innerHTML=`<button class="room-close" aria-label="Close guide">×</button><p class="eyebrow">ENGINEER’S GUIDE</p><nav aria-label="Guide chapters">${chapters.map(({label:name},j)=>`<button data-chapter="${j}" aria-pressed="${j===i}">${name}</button>`).join('')}</nav><h2 id="guide-title" tabindex="-1">${title}</h2>${paragraphs.map(text => `<p>${text}</p>`).join('')}${research}${section.isConnected ? '' : `<a href="${href}">${action} →</a>`}`;
 dlg.querySelector('h2')!.focus();}
 dlg.onclick=(e)=>{const el=e.target as HTMLElement;if(el.dataset.chapter!==undefined)chapter(Number(el.dataset.chapter));else if(el.closest('a,.room-close')||el===dlg)dlg.close();};
 function open(){
   if (entering || dlg.open) return;
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
 section.querySelector('.room-person')!.addEventListener('click',open);
 frame.addEventListener('click',e=>{
   if(entering || (e.target as Element).closest('a,button'))return;
   const box=frame.getBoundingClientRect(), x=(e.clientX-box.left)/box.width, y=(e.clientY-box.top)/box.height;
   if(x>.43 && x<.58 && y>.61 && y<.72)chip.click();
   else if(x>.19 && x<.36 && y>.25 && y<.93)open();
 });
 const guide=document.createElement('button');guide.textContent='Engineer guide';document.querySelector('#nav')!.append(guide);guide.onclick=navigate;
 return (active:boolean)=>{document.body.classList.toggle('intro-only',active);section.hidden=!active;if(!active){observer.disconnect();section.remove();document.querySelector('.cloud-curtain')?.remove();return;}if(active&&!matchMedia('(prefers-reduced-motion: reduce)').matches){try{if(sessionStorage.getItem('room-seen'))return;sessionStorage.setItem('room-seen','1');}catch{return;}
 const cloud=document.createElement('div');cloud.className='cloud-curtain';cloud.innerHTML='<i></i><i></i>';document.body.append(cloud);cloud.setAttribute('aria-hidden','true');cloud.addEventListener('animationend',()=>cloud.remove(),{once:true});}};
}
