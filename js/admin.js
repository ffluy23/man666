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

    // 닉네임 + 코인
    const nickname = document.createElement("div");
    nickname.innerText = `${data.nickname} (H:${data.coin})`;

    // inventory
    const inventoryDiv = document.createElement("div");
    const inventory = data.inventory || [];

    if(inventory.length === 0){
        inventoryDiv.innerText = "아이템: 없음";
    } else {

        const itemNames = inventory.map(id=>{
            return items[id]?.name || id;
        });

        inventoryDiv.innerText = "아이템: " + itemNames.join(" ");
    }

    // 코인 입력
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "코인";

    // 지급 버튼
    const giveBtn = document.createElement("button");
    giveBtn.innerText = "지급";

    giveBtn.onclick = ()=>{
        const amount = Number(input.value);
        if(!amount) return;
        changeCoin(uid,amount);
    }

    // 회수 버튼
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
