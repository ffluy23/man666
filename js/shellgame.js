import { startGame, finishGame } from "./game.js";

const CONFIG = {
      revealMs: 900,
      coverDelayMs: 250,
      shuffleMoves: 8,
      swapMs: 300,
      betweenSwapsMs: 120,
    };

const MULTIPLIERS = [1, 1.2, 1.5, 1.7, 2];
const MAX_ROUND = 5;

const lane = document.getElementById('lane');
const startBtn = document.getElementById('startBtn');
const phaseEl = document.getElementById('phase');
const msgEl = document.getElementById('msg');
const roundEl = document.getElementById('round');

let currentBet = 0;
let totalWin = 0;

let phase = 'idle';
let round = 0;

const SLOT_X = [60, 300, 540];
const cups = [];
let ballCupId = 0;
let allowClick = false;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function setPhase(p, message){
  phase = p;
  phaseEl.textContent = ({
    idle:'대기', reveal:'확인', cover:'덮는 중', shuffle:'섞는 중', guess:'맞추기', result:'결과'
  }[p] || p);

  if(message) msgEl.textContent = message;

  startBtn.disabled = !(p === 'idle' || p === 'result');
}

function renderCounters(){
  roundEl.textContent = String(round);
}

function createCup(id, slot){
  const el = document.createElement('div');
  el.className = 'cup covered';
  el.dataset.id = String(id);
  el.dataset.slot = String(slot);

  const ball = document.createElement('div');
  ball.className = 'ball';

  const lid = document.createElement('div');
  lid.className = 'lid';

  el.appendChild(ball);
  el.appendChild(lid);

  el.style.transform = `translateX(${SLOT_X[slot]}px)`;

  el.addEventListener('click', () => onCupClick(id));

  lane.appendChild(el);

  return { id, slot, el, ball };
}

function init(){
  lane.innerHTML = '';
  cups.length = 0;

  for(let i=0;i<3;i++){
    cups.push(createCup(i, i));
  }

  ballCupId = Math.floor(Math.random()*3);

  allowClick = false;

  setPhase('idle', '게임 시작');

  renderCupsCover(true);
  showBall(ballCupId, false);

  renderCounters();
}

function renderCupsCover(covered){
  for(const c of cups){
    c.el.classList.toggle('covered', covered);
  }
}

function showBall(cupId, show){
  for(const c of cups){
    c.el.classList.remove('show-ball');

    if(show && c.id === cupId){
      c.el.classList.add('show-ball');
    }
  }
}

function revealBall(cupId){
  for(const c of cups){
    c.el.classList.remove('reveal');
  }

  const c = cups.find(x => x.id === cupId);

  if(c) c.el.classList.add('reveal');
}

function disableCups(disabled){
  for(const c of cups){
    c.el.classList.toggle('disabled', disabled);
  }
}

function setCupSlot(id, newSlot){
  const c = cups.find(x=>x.id===id);

  c.slot = newSlot;
  c.el.dataset.slot = String(newSlot);
  c.el.style.transform = `translateX(${SLOT_X[newSlot]}px)`;
}

function swapSlots(slotA, slotB){
  const cupA = cups.find(c => Number(c.el.dataset.slot) === slotA);
  const cupB = cups.find(c => Number(c.el.dataset.slot) === slotB);

  if(!cupA || !cupB) return;

  setCupSlot(cupA.id, slotB);
  setCupSlot(cupB.id, slotA);
}

function currentBallSlot(){
  return Number(cups.find(c=>c.id===ballCupId).el.dataset.slot);
}

function resetCupState(){
  for(const c of cups){
    c.el.classList.remove('reveal','show-ball','flash','bad');
    c.el.classList.add('covered');
  }
}

async function runRound(){

  resetCupState(); 

  if(round >= MAX_ROUND){
    await finishGame("shellgame", currentBet, totalWin);
    setPhase('idle','게임 종료');
    return;
  }

  round += 1;
  renderCounters();

  allowClick = false;
  disableCups(true);

  ballCupId = Math.floor(Math.random()*3);

  setPhase('reveal','공의 위치를 기억하세요.');

  renderCupsCover(false);
  showBall(ballCupId, true);

  await sleep(CONFIG.revealMs);

  setPhase('cover');

  showBall(ballCupId, false);
  await sleep(CONFIG.coverDelayMs);

  renderCupsCover(true);

  setPhase('shuffle','섞는 중');

  await shuffleSequence(CONFIG.shuffleMoves);

  setPhase('guess','컵 선택');

  allowClick = true;
  disableCups(false);
}

async function shuffleSequence(moves){

  const PAIRS = [[0,1],[1,2],[0,2]];

  for(let i=0;i<moves;i++){

    const [a,b] = PAIRS[Math.floor(Math.random()*PAIRS.length)];

    swapSlots(a,b);

    await sleep(CONFIG.swapMs + CONFIG.betweenSwapsMs);
  }
}

async function onCupClick(cupId){

  if(!allowClick || phase !== 'guess') return;

  allowClick = false;
  disableCups(true);

  const chosenSlot = Number(cups.find(c=>c.id===cupId).el.dataset.slot);
  const realSlot = currentBallSlot();

setPhase('result','결과 공개');

renderCupsCover(false);
showBall(ballCupId, true);   
revealBall(ballCupId);

  const ok = chosenSlot === realSlot;

  if(!ok){


    msgEl.textContent = `틀림! 전부 잃었습니다.`;

    await finishGame("shellgame", currentBet, 0);

    renderCounters();

    return;
  }


  const multiplier = MULTIPLIERS[round-1];

  totalWin = Math.floor(currentBet * multiplier);

  msgEl.textContent = `성공! x${multiplier}`;

  renderCounters();

  if(round >= MAX_ROUND){

    await finishGame("shellgame", currentBet, totalWin);

    msgEl.textContent += " 최종 성공!";

    return;
  }

  const go = confirm(`현재 상금 ${totalWin}\n계속 하시겠습니까?`);

  if(go){

    await sleep(800);

    runRound();

  }else{

    await finishGame("shellgame", currentBet, totalWin);

    msgEl.textContent = `STOP! ${totalWin} 획득`;
  }
}

startBtn.addEventListener('click', async () => {

  if(!(phase === 'idle' || phase === 'result')) return;

  const bet = await startGame();

  if(!bet) return;

  currentBet = bet;
  totalWin = 0;
  round = 0;

  runRound();
});

init();
