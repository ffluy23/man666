import { auth, db } from "./firebase.js";

import {
onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
doc,
getDoc,
updateDoc,
collection,
getDocs,
increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {

  if (!user) {
    alert("로그인 필요");
    location.href = "index.html";
    return;
  }

  const userRef = doc(db,"users",user.uid);
  const snap = await getDoc(userRef);

  if (snap.data().role !== "admin") {
    alert("관리자만 접근 가능");
    location.href = "profile.html";
    return;
  }

  loadUsers();

});

async function loadUsers(){

  const list = document.getElementById("userList");
  list.innerHTML = "";

  const querySnapshot = await getDocs(collection(db,"users"));

  querySnapshot.forEach((docSnap)=>{

    const data = docSnap.data();
    const uid = docSnap.id;

    if(data.role === "admin") return;

    const div = document.createElement("div");

    const nickname = document.createElement("div");
    nickname.innerText = `${data.nickname} (H:${data.coin || 0})`;

    const inventoryDiv = document.createElement("div");

    const inventory = data.inventory || {};

const entries = Object.entries(inventory).filter(([id,count]) => count > 0);

if(entries.length === 0){

    inventoryDiv.innerText = "아이템: 없음";

}else{

    const itemNames = entries.map(([id,count])=>{
        const name = items[id]?.name || id;
        return `${name} x${count}`;
    });

    inventoryDiv.innerText = "아이템: " + itemNames.join(" ");
}

    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "코인";

    const giveBtn = document.createElement("button");
    giveBtn.innerText = "지급";

    giveBtn.onclick = ()=>{
        const amount = Number(input.value);
        if(!amount) return;
        changeCoin(uid,amount);
    }

    const takeBtn = document.createElement("button");
    takeBtn.innerText = "회수";

    takeBtn.onclick = ()=>{
        const amount = Number(input.value);
        if(!amount) return;
        changeCoin(uid,-amount);
    }

    div.appendChild(nickname);
    div.appendChild(inventoryDiv);
    div.appendChild(input);
    div.appendChild(giveBtn);
    div.appendChild(takeBtn);

    list.appendChild(div);

  });

}
async function changeCoin(uid,amount){

  await updateDoc(doc(db,"users",uid),{
    coin: increment(amount)
  });

  loadUsers();

}

const items = {
  potion:{ name:"사식", price:10 },
  beer:{ name:"논알콜 맥주", price:20 },
  cloth:{ name:"교도관장 옷장털이", price:40 }
};
