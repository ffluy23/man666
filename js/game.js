import { auth, db } from "./firebase.js";

import {
doc,
getDoc,
updateDoc,
addDoc,
collection,
increment,
serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


function safeNumber(v){
const n = Number(v);
return isNaN(n) ? 0 : n;
}


// 코인 가져오기
export async function getCoin(){

const user = auth.currentUser;
if(!user) return 0;

try{

const snap = await getDoc(doc(db,"users",user.uid));

if(!snap.exists()) return 0;

return safeNumber(snap.data().coin);

}catch(e){
console.error("getCoin error:", e);
return 0;
}

}


// 베팅하기
export async function placeBet(){

const user = auth.currentUser;

if(!user){
alert("로그인 필요");
return;
}

const amount = safeNumber(document.getElementById("betAmount").value);

if(amount > 20){
alert("최대 베팅은 20H 입니다");
return;
}

if(amount <= 0){
alert("베팅 금액 오류");
return;
}

try{

const ref = doc(db,"users",user.uid);
const snap = await getDoc(ref);

if(!snap.exists()){
alert("유저 데이터 없음");
return;
}

const data = snap.data();

const coin = safeNumber(data.coin);
const pendingBet = safeNumber(data.pendingBet);

if(pendingBet > 0){
alert("이미 베팅함");
return;
}

if(coin < amount){
alert("혼이 부족함");
return;
}

await updateDoc(ref,{
coin: increment(-amount),
pendingBet: amount
});

document.getElementById("currentBet").textContent = amount;

if(window.updateCoinDisplay){
await window.updateCoinDisplay();
}

}catch(e){
console.error("placeBet error:", e);
}

}


// 베팅 취소
export async function cancelBet(){

if(window.gameRunning){
alert("게임 진행 중에는 베팅 취소 불가");
return;
}

const user = auth.currentUser;
if(!user) return;

try{

const ref = doc(db,"users",user.uid);
const snap = await getDoc(ref);

if(!snap.exists()) return;

const pending = safeNumber(snap.data().pendingBet);

if(pending <= 0){
alert("취소할 베팅 없음");
return;
}

await updateDoc(ref,{
coin: increment(pending),
pendingBet: 0
});

document.getElementById("currentBet").textContent = 0;

if(window.updateCoinDisplay){
await window.updateCoinDisplay();
}

}catch(e){
console.error("cancelBet error:", e);
}

}


// 게임 시작
export async function startGame(){

const user = auth.currentUser;
if(!user) return null;

try{

const ref = doc(db,"users",user.uid);
const snap = await getDoc(ref);

if(!snap.exists()) return null;

const bet = safeNumber(snap.data().pendingBet);

if(bet <= 0){
alert("베팅 없음");
return null;
}

return bet;

}catch(e){
console.error("startGame error:", e);
return null;
}

}


// 게임 종료
export async function finishGame(gameType, betAmount, reward){

const user = auth.currentUser;
if(!user) return;

betAmount = safeNumber(betAmount);
reward = safeNumber(reward);

try{

const ref = doc(db,"users",user.uid);

await updateDoc(ref,{
coin: increment(reward),
pendingBet: 0
});

// 로그 저장
await addDoc(collection(db,"game_logs"),{
uid: user.uid,
gameType: gameType,
betAmount: betAmount,
reward: reward,
createdAt: serverTimestamp()
});

document.getElementById("currentBet").textContent = 0;

if(window.updateCoinDisplay){
await window.updateCoinDisplay();
}

}catch(e){
console.error("finishGame error:", e);
}

}


// 전역 사용
window.placeBet = placeBet;
window.cancelBet = cancelBet;
window.startGame = startGame;
