import { startGame, finishGame, placeBet, cancelBet } from "./game.js";

/* 게임 상태 */
window.gameRunning = false;

/* 확률 릴 */
const reel = [
"🍒","🍒","🍒","🍒","🍒","🍒",
"🍋","🍋","🍋","🍋","🍋",
"🍇","🍇","🍇","🍇",
"🍉","🍉","🍉",
"🔔","🔔",
"⭐",
"7️⃣"
]

function spin(){
return reel[Math.floor(Math.random()*reel.length)]
}

const SYMBOLS = ["🍒","🍋","🍇","🍉","🔔","⭐","7️⃣"]

const ITEM_HEIGHT = 140
const SPIN_ITEMS = 20

function randSymbol(){
return SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]
}

/* 릴 생성 */
function buildStrip(strip, finalSymbol){

strip.innerHTML=""

for(let i=0;i<SPIN_ITEMS;i++){
const d=document.createElement("div")
d.className="symbol"
d.textContent=randSymbol()
strip.appendChild(d)
}

const last=document.createElement("div")
last.className="symbol"
last.textContent=finalSymbol
strip.appendChild(last)

}

/* easing */
function easeOut(t){
return 1-Math.pow(1-t,3)
}

/* 현재 translateY */
function getTranslate(el){

let st=getComputedStyle(el).transform

if(st==="none") return 0

let m=st.match(/matrix([^)]+)/)

return m?parseFloat(m[1].split(",")[5]):0

}

/* 릴 애니메이션 */
function animate(strip,distance,duration){

return new Promise(resolve=>{

let start=performance.now()
let from=getTranslate(strip)

function frame(now){

let t=Math.min(1,(now-start)/duration)
let y=from+(distance-from)*easeOut(t)

strip.style.transform = `translateY(${y}px)`

if(t<1) requestAnimationFrame(frame)
else resolve()

}

requestAnimationFrame(frame)

})

}

async function startSlot(){

/* 게임 중 감지 */
if(window.gameRunning) return

const bet=await startGame()
if(!bet) return

window.gameRunning = true

document.getElementById("multiplier").textContent="-"
document.getElementById("reward").textContent="-"

const strips=[
document.getElementById("strip0"),
document.getElementById("strip1"),
document.getElementById("strip2")
]

/* 위치 초기화 */
strips.forEach(strip=>{
strip.style.transform="translateY(0)"
})

/* 결과 결정 */
const results=[
spin(),
spin(),
spin()
]

console.log("result:",results)

/* 릴 생성 */
buildStrip(strips[0],results[0])
buildStrip(strips[1],results[1])
buildStrip(strips[2],results[2])

const dist = -(ITEM_HEIGHT * SPIN_ITEMS)

const spin1 = animate(strips[0], dist, 1200)
const spin2 = animate(strips[1], dist, 1500)
const spin3 = animate(strips[2], dist, 1800)

await spin1
await animate(strips[0], dist - 12, 120)
await animate(strips[0], dist, 120)

await spin2
await animate(strips[1], dist - 12, 120)
await animate(strips[1], dist, 120)

await spin3
await animate(strips[2], dist - 12, 120)
await animate(strips[2], dist, 120)

await new Promise(r=>setTimeout(r,50))

/* 배수 계산 */
let multiplier = 0

const cherryCount = results.filter(s => s === "🍒").length

if (cherryCount > 0) {

if (cherryCount === 3) multiplier = 5
else if (cherryCount === 2) multiplier = 1
else if (cherryCount === 1) multiplier = 0.5

}

else if(results[0]===results[1] && results[1]===results[2]){

const s=results[0]

if(s==="🍋") multiplier=6
else if(s==="🍇") multiplier=10
else if(s==="🍉") multiplier=18
else if(s==="🔔") multiplier=35
else if(s==="⭐") multiplier=70
else if(s==="7️⃣") multiplier=120

}

const reward=bet*multiplier

document.getElementById("multiplier").textContent=multiplier
document.getElementById("reward").textContent=reward

console.log("bet:",bet)
console.log("multiplier:",multiplier)
console.log("reward:",reward)

await finishGame("slot",bet,reward)

/* 게임 종료 */
window.gameRunning = false

}

document.addEventListener("DOMContentLoaded",()=>{

document.getElementById("betBtn").addEventListener("click",placeBet)

/* 게임 중 취소 방지 */
document.getElementById("cancelBtn").addEventListener("click",()=>{

if(window.gameRunning){
alert("게임 진행 중에는 취소 불가")
return
}

cancelBet()

})

document.getElementById("startBtn").addEventListener("click",startSlot)

})
