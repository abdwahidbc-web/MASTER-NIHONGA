import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC6HhOYpLM9DSz4Bn2VaWizzFVahuzH3Rc",
  authDomain: "nihonga-master.firebaseapp.com",
  projectId: "nihonga-master",
  storageBucket: "nihonga-master.firebasestorage.app",
  messagingSenderId: "1009318835740",
  appId: "1:1009318835740:web:cc0f6e1f09ee51af7251d9",
  measurementId: "G-HNZ4DYY52C"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- UI TOGGLE LOGIC ---
const registerSection = document.getElementById('register-section');
const loginSection = document.getElementById('login-section');
const subtitle = document.getElementById('auth-subtitle');

document.getElementById('show-login').addEventListener('click', () => {
    registerSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    subtitle.textContent = "Log in to continue your training";
});

document.getElementById('show-register').addEventListener('click', () => {
    loginSection.classList.add('hidden');
    registerSection.classList.remove('hidden');
    subtitle.textContent = "Register to begin your journey";
});

// --- 1. REGISTRATION LOGIC ---
document.getElementById('register-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (username === "" || email === "" || password === "") {
        alert("Please fill in all fields.");
        return;
    }

    try {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const user = res.user;
        await updateProfile(user, { displayName: username });

        await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            username: username,
            email: email,
            isPro: false,
            progress: "Hiragana - Level 1",
            joinDate: new Date().toISOString()
        });

        localStorage.setItem('nihongoStudent', username);
        localStorage.setItem(`${username}_isPro`, 'false'); 
        
        alert(`✅ Cloud Registration Completed! Welcome, ${username}!`);
        window.location.href = 'courses.html';

    } catch (err) {
        alert("Registration Error: " + err.message);
    }
});

// --- 2. LOGIN LOGIC ---
document.getElementById('login-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    if (email === "" || password === "") {
        alert("Please enter both email and password.");
        return;
    }

    try {
        // 1. Sign them in with Firebase
        const res = await signInWithEmailAndPassword(auth, email, password);
        const user = res.user;

        // 2. Fetch their data from Firestore (so we know their username and Pro status)
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            
            // 3. Restore the local storage so the app knows who is logged in!
            localStorage.setItem('nihongoStudent', userData.username);
            localStorage.setItem(`${userData.username}_isPro`, userData.isPro ? 'true' : 'false');
            
            alert(`Welcome back, ${userData.username}!`);
            window.location.href = 'courses.html';
        } else {
            alert("❌ User data missing from database.");
        }

    } catch (err) {
        alert("Login Error: " + err.message);
    }
});
