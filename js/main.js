import { auth, db } from "./firebase.js";

import {
signInWithEmailAndPassword,
signOut,
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
getDoc,
updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
collection,
getDocs,
increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// =====================
// 로그인
// =====================

window.login = async function(){

    const id = document.getElementById("login-id").value;
    const pw = document.getElementById("login-pw").value;

    try{

        const userCredential = await signInWithEmailAndPassword(auth,id,pw);
        const user = userCredential.user;

        const docRef = doc(db,"users",user.uid);
        const docSnap = await getDoc(docRef);

        if(docSnap.exists()){

            const data = docSnap.data();
            localStorage.setItem("nickname",data.nickname);

        }

        alert("로그인 성공");
        window.location.href="profile.html";

    }catch(e){

        alert("아이디 또는 비밀번호 틀림");

    }

}


// =====================
// 로그인 체크
// =====================

window.checkLogin = function(){

    onAuthStateChanged(auth,(user)=>{

        const page = window.location.pathname;

        if(!user && !page.includes("index.html")){

            window.location.href = "index.html";

        }

    });

}


// =====================
// 로그아웃
// =====================

window.logout = function(){

    signOut(auth).then(()=>{

        localStorage.clear();
        alert("로그아웃");
        window.location.href="index.html";

    });

}

//닉네임

function loadNickname(){

    const nickname = localStorage.getItem("nickname");

    const el = document.getElementById("nickname");

    if(el && nickname){
        el.innerText = nickname;
    }

}

window.updateCoinDisplay = async function(){

    const coin = await getCoin();

    document.querySelectorAll(".coin").forEach(el=>{
        el.innerText = coin;
    });

}

// =====================
// 아이템 데이터
// =====================

const items = {

    potion:{ name:"사식", price:10 },
    beer:{ name:"논알콜 맥주", price:20 },
    cloth:{ name:"교도관장 옷장털이", price:40 }

};


// =====================
// 코인 가져오기
// =====================

async function getCoin(){

    const user = auth.currentUser;

    const docSnap = await getDoc(doc(db,"users",user.uid));

    if(docSnap.exists()){
        return docSnap.data().coin || 0;
    }

    return 0;

}


// =====================
// 코인 표시
// =====================

async function updateCoinDisplay(){

    const coin = await getCoin();

    document.querySelectorAll(".coin").forEach(el=>{
        el.innerText = coin;
    });

}


// =====================
// 코인 추가
// =====================

window.addCoin = async function(amount){

    const user = auth.currentUser;

    await updateDoc(doc(db,"users",user.uid),{
        coin: increment(amount)
    });

    updateCoinDisplay();

}

// =====================
// 코인 사용
// =====================

async function useCoin(amount){

    const user = auth.currentUser;

    let coin = await getCoin();

    if(coin < amount){
        alert("코인이 부족함");
        return false;
    }

    await updateDoc(doc(db,"users",user.uid),{
        coin: increment(-amount)
    });

    updateCoinDisplay();

    return true;

}


// =====================
// 인벤토리 가져오기
// =====================

async function getInventory(){

    const user = auth.currentUser;

    const docSnap = await getDoc(doc(db,"users",user.uid));

    if(docSnap.exists()){
        return docSnap.data().inventory || {};
    }

    return {};

}



// =====================
// 아이템 추가
// =====================

async function addItem(itemId){

    const user = auth.currentUser;

    await updateDoc(doc(db,"users",user.uid),{
        ["inventory."+itemId]: increment(1)
    });

}


// =====================
// 아이템 구매
// =====================

window.buyItem = async function(itemId){

    const item = items[itemId];

    if(!item){

        alert("아이템 없음");
        return;

    }

    const success = await useCoin(item.price);

    if(success){

        await addItem(itemId);

        renderInventory();

        alert(item.name+" 구매 완료");

    }

}


// =====================
// 인벤토리 표시
// =====================

async function renderInventory(){

    const inventory = await getInventory();

    const container = document.getElementById("inventory");

    if(!container) return;

    container.innerHTML="";

    Object.entries(inventory).forEach(([itemId,count])=>{

        if(count <= 0) return; // 0개면 표시 안함

        const item = items[itemId];

        if(!item) return;

        const div = document.createElement("div");

        div.innerText = item.name + " x" + count;

        container.appendChild(div);

    });

}
///아이템 사용
async function useItem(itemId){

    const user = auth.currentUser;

    const inventory = await getInventory();

    if(!inventory[itemId] || inventory[itemId] <= 0){
        alert("아이템 없음");
        return false;
    }

    await updateDoc(doc(db,"users",user.uid),{
        ["inventory."+itemId]: increment(-1)
    });

    return true;

}


// =====================
// 로그인 상태 확인
// =====================

onAuthStateChanged(auth,(user)=>{

    if(user){
		loadNickname();    
        updateCoinDisplay();
        renderInventory();

    }

});

document.addEventListener("DOMContentLoaded", () => {

    checkLogin();

});
