import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

const firebaseConfig = {
  apiKey: "AIzaSyBLLHSFby9Z9lk9XTkRip0Ei5bG-7Ljzxs",
  authDomain: "test-1725f.firebaseapp.com",
  projectId: "test-1725f",
  appId: "1:298113537232:web:c4a1f4a3837e0faaa7bad5"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
