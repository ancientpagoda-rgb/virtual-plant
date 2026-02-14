/* Virtual Plant — single-file logic
   - Stores state in localStorage
   - Growth is time-based with simple hydration/health dynamics
*/

const LS_KEY = 'virtualPlant.v1';

const STAGES = [
  { name: 'Seed',        need: 0 },
  { name: 'Sprout',      need: 15 },
  { name: 'Stem',        need: 45 },
  { name: 'Leaves',      need: 90 },
  { name: 'Bushy',       need: 150 },
  { name: 'Flower',      need: 230 },
];

// Default: growth points per hour at perfect conditions.
// Fast mode multiplies time (demo).
const BASE_GROWTH_PER_HOUR = 6;

function nowMs(){ return Date.now(); }
function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return null;
    return JSON.parse(raw);
  }catch{ return null; }
}

function saveState(state){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

function newPlant(){
  const t = nowMs();
  return {
    createdAt: t,
    lastTickAt: t,
    growth: 0,          // growth points
    hydration: 70,      // 0..100
    health: 85,         // 0..100
    lastActionAt: t,
    sunlightBoostUntil: 0,
  };
}

function stageFromGrowth(growth){
  let idx = 0;
  for(let i=0;i<STAGES.length;i++) if(growth >= STAGES[i].need) idx = i;
  return idx;
}

function nextStageNeed(growth){
  const idx = stageFromGrowth(growth);
  return STAGES[Math.min(idx+1, STAGES.length-1)].need;
}

function fmtDuration(ms){
  const s = Math.floor(ms/1000);
  const m = Math.floor(s/60);
  const h = Math.floor(m/60);
  const d = Math.floor(h/24);
  if(d>0) return `${d}d ${h%24}h`;
  if(h>0) return `${h}h ${m%60}m`;
  if(m>0) return `${m}m`;
  return `${s}s`;
}

function setMsg(text){
  const el = document.getElementById('msg');
  el.textContent = text || '';
}

function tick(state, timeScale=1){
  const t = nowMs();
  const dtMs = Math.max(0, t - state.lastTickAt) * timeScale;
  state.lastTickAt = t;

  const hours = dtMs / (1000*60*60);

  // Hydration decays with time
  state.hydration = clamp(state.hydration - (hours * 8), 0, 100);

  // Health trends toward hydration
  const hydrationTarget = state.hydration;
  // If too dry, health drops; if hydrated, health recovers a bit
  const delta = (hydrationTarget - 55) / 55; // -1..+1-ish
  state.health = clamp(state.health + (hours * (delta*10)), 0, 100);

  // Sunlight boost temporarily speeds growth
  const sunBoost = (t < state.sunlightBoostUntil) ? 1.35 : 1.0;

  // Growth depends on health and hydration
  const hydrationFactor = clamp(state.hydration/80, 0, 1.2); // 0..1.2
  const healthFactor = clamp(state.health/85, 0, 1.2);       // 0..1.2
  const rate = BASE_GROWTH_PER_HOUR * hydrationFactor * healthFactor * sunBoost;

  state.growth = Math.max(0, state.growth + hours * rate);

  // Cosmetic: if totally neglected, growth slows to crawl (but doesn't reverse)
  if(state.hydration < 10 || state.health < 15){
    // nothing extra; rate already near zero
  }

  return state;
}

function render(state){
  const stageIdx = stageFromGrowth(state.growth);
  const stage = STAGES[stageIdx];

  document.getElementById('stage').textContent = `${stageIdx+1}/${STAGES.length} — ${stage.name}`;
  document.getElementById('age').textContent = fmtDuration(nowMs() - state.createdAt);
  document.getElementById('hydration').textContent = `${Math.round(state.hydration)}%`;
  document.getElementById('health').textContent = `${Math.round(state.health)}%`;

  const nextNeed = nextStageNeed(state.growth);
  const remaining = Math.max(0, nextNeed - state.growth);

  // Estimate time to next stage assuming current conditions hold
  const hydrationFactor = clamp(state.hydration/80, 0, 1.2);
  const healthFactor = clamp(state.health/85, 0, 1.2);
  const sunBoost = (nowMs() < state.sunlightBoostUntil) ? 1.35 : 1.0;
  const rate = BASE_GROWTH_PER_HOUR * hydrationFactor * healthFactor * sunBoost;
  const hoursToNext = rate > 0.2 ? (remaining / rate) : Infinity;
  const eta = hoursToNext === Infinity ? '— (needs care)' : fmtDuration(hoursToNext * 3600 * 1000);
  document.getElementById('next').textContent = (stageIdx === STAGES.length-1) ? 'Max stage' : eta;

  drawPlant(stageIdx, state);
}

function drawPlant(stageIdx, state){
  const plant = document.getElementById('plant');
  plant.innerHTML = '';

  // Color shifts based on health
  const health = clamp(state.health, 0, 100);
  const green = health > 60 ? '#68e36b' : (health > 35 ? '#b6df5a' : '#d6c56b');
  const dark = health > 60 ? '#2ea84a' : (health > 35 ? '#7aa63b' : '#9a8e39');
  const flower = '#ff7ad9';

  // Helper to place pixel blocks
  const px = (x,y,color)=>{
    const d=document.createElement('div');
    d.className='pixel';
    d.style.left = `${x*10}px`;
    d.style.top = `${y*10}px`;
    d.style.background = color;
    plant.appendChild(d);
  };

  // Grid 22x20 roughly
  // Pot
  const potColor = '#c56b3c';
  const potDark = '#9f4d24';
  for(let x=7;x<=14;x++) for(let y=15;y<=16;y++) px(x,y,potColor);
  for(let x=6;x<=15;x++) px(x,17,potDark);
  for(let x=7;x<=14;x++) px(x,18,potDark);

  // Stem base
  const stemX = 11;
  const stemTop = 14 - Math.min(stageIdx*2, 10);
  for(let y=14;y>=stemTop;y--) px(stemX,y,dark);

  // Leaves by stage
  const addLeaf = (cx, cy, dir=1)=>{
    const c1 = green;
    px(cx + 0*dir, cy, c1);
    px(cx + 1*dir, cy, c1);
    px(cx + 2*dir, cy+1, c1);
    px(cx + 1*dir, cy+1, c1);
  };

  if(stageIdx >= 2){
    addLeaf(stemX, 12, -1);
    addLeaf(stemX, 11,  1);
  }
  if(stageIdx >= 3){
    addLeaf(stemX, 10, -1);
    addLeaf(stemX, 9,   1);
  }
  if(stageIdx >= 4){
    addLeaf(stemX, 8,  -1);
    addLeaf(stemX, 7,   1);
  }

  // Flower
  if(stageIdx >= 5){
    const topY = stemTop;
    px(stemX, topY-1, flower);
    px(stemX-1, topY, flower);
    px(stemX+1, topY, flower);
    px(stemX, topY+1, flower);
  }

  // Tiny sparkle if very healthy
  if(state.health > 90 && state.hydration > 70){
    px(3,3,'#ffffff');
    px(4,3,'#6bd7ff');
    px(3,4,'#6bd7ff');
  }
}

function main(){
  const waterBtn = document.getElementById('waterBtn');
  const sunBtn = document.getElementById('sunBtn');
  const resetBtn = document.getElementById('resetBtn');
  const fastMode = document.getElementById('fastMode');

  let state = loadState() || newPlant();

  const doTick = ()=>{
    const scale = fastMode.checked ? 60 : 1; // 1 minute IRL = 1 hour in demo
    state = tick(state, scale);
    saveState(state);
    render(state);
  };

  waterBtn.addEventListener('click', ()=>{
    state.hydration = clamp(state.hydration + 25, 0, 100);
    state.health = clamp(state.health + 4, 0, 100);
    state.lastActionAt = nowMs();
    setMsg('Watered.');
    doTick();
  });

  sunBtn.addEventListener('click', ()=>{
    state.sunlightBoostUntil = nowMs() + 1000*60*30; // 30 minutes
    state.health = clamp(state.health + 2, 0, 100);
    state.lastActionAt = nowMs();
    setMsg('Sunlight boost for 30 minutes.');
    doTick();
  });

  resetBtn.addEventListener('click', ()=>{
    if(!confirm('Reset your plant?')) return;
    state = newPlant();
    saveState(state);
    setMsg('New seed planted.');
    render(state);
  });

  // Initial render + periodic ticks
  doTick();
  setInterval(doTick, 10_000); // refresh often; growth is time-based anyway
}

main();
