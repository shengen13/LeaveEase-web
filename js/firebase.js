import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCYE50OgsSpeMfG8XcJfD7Z1YInJq-uS3A",
  authDomain: "leavetrack-def2a.firebaseapp.com",
  projectId: "leavetrack-def2a",
  storageBucket: "leavetrack-def2a.firebasestorage.app",
  messagingSenderId: "624926183807",
  appId: "1:624926183807:web:4d3fc14ee25c4fce074a4a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);