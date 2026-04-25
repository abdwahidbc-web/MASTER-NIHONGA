import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

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
const db = getFirestore(app);
const auth = getAuth(app); 

const myAdminEmail = "admin@nihongomaster.com"; 

// --- LOGIN LOGIC ---
const loginBtn = document.getElementById('admin-login-btn');
if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-password').value;
        try {
            await signInWithEmailAndPassword(auth, email, pass);
        } catch (error) {
            alert("❌ Firebase Login Failed: " + error.message);
        }
    });
}

document.getElementById('admin-logout-btn').addEventListener('click', () => {
    signOut(auth);
});

// --- THE DIGITAL BOUNCER ---
onAuthStateChanged(auth, (user) => {
    if (user && user.email === myAdminEmail) {
        document.getElementById('admin-login-box').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        document.body.style.display = 'block'; 
        loadStudents(); 
    } else {
        document.getElementById('admin-login-box').classList.remove('hidden');
        document.getElementById('admin-dashboard').classList.add('hidden');
    }
});

// --- FETCH ALL STUDENTS ---
async function loadStudents() {
    const userList = document.getElementById('user-list');
    const totalUsersUI = document.getElementById('total-users');
    const proUsersUI = document.getElementById('pro-users');
    
    userList.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">Loading students from Firebase...</td></tr>';
    
    const querySnapshot = await getDocs(collection(db, "users"));
    let total = 0;
    let pros = 0;
    userList.innerHTML = '';

    querySnapshot.forEach((docSnap) => {
        const user = docSnap.data();
        const userId = docSnap.id;
        total++;
        if (user.isPro) pros++;

        const tierBadge = user.isPro 
            ? `<span style="background:#ffcc00; color:#000; padding:5px 10px; border-radius:20px; font-weight:bold; font-size:0.8rem;">PRO</span>`
            : `<span style="background:#444; color:#fff; padding:5px 10px; border-radius:20px; font-weight:bold; font-size:0.8rem;">FREE</span>`;
        
        const actionBtn = user.isPro
            ? `<button onclick="toggleSubscription('${userId}', ${user.isPro})" style="background:#444; color:#fff; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">Revoke Pro</button>`
            : `<button onclick="toggleSubscription('${userId}', ${user.isPro})" style="background:#00d2ff; color:#000; border:none; padding:8px 12px; border-radius:5px; cursor:pointer; font-weight:bold;">Grant Pro</button>`;

        const row = document.createElement('tr');
        row.style.borderBottom = "1px solid #333";
        row.innerHTML = `
            <td style="padding: 15px;">
                <div style="font-weight: bold; color: white;">${user.username || 'Student'}</div>
                <div style="color: #888; font-size: 0.85rem;">${user.email}</div>
            </td>
            <td style="padding: 15px; color: #00d2ff; font-weight: bold;">${user.progress || 'Beginning'}</td>
            <td style="padding: 15px;">${tierBadge}</td>
            <td style="padding: 15px;">${actionBtn}</td>
        `;
        userList.appendChild(row);
    });

    totalUsersUI.textContent = total;
    proUsersUI.textContent = pros;
}

// --- GRANT/REVOKE SUBSCRIPTION ---
window.toggleSubscription = async (userId, currentStatus) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
        isPro: !currentStatus
    });
    loadStudents(); 
};