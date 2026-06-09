import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Senin Özel Firebase Yapılandırman Entegre Edildi
const firebaseConfig = {
    apiKey: "AIzaSyDI2UQjIjXWOnWAV613bs1Qr0-6pL5n_wo",
    authDomain: "devaokey101.firebaseapp.com",
    projectId: "devaokey101",
    storageBucket: "devaokey101.firebasestorage.app",
    messagingSenderId: "405865743713",
    appId: "1:405865743713:web:5b60bab107a5a5114f7120",
    measurementId: "G-9PGEFYYQH9",
    databaseURL: "https://devaokey101-default-rtdb.firebaseio.com/"
};

// Firebase Başlatılıyor
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// DOM Elemanları
const authContainer = document.getElementById('auth-container');
const gameContainer = document.getElementById('game-container');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const btnLogout = document.getElementById('btn-logout');
const authError = document.getElementById('auth-error');
const displayName = document.getElementById('display-name');
const btnFindMatch = document.getElementById('btn-find-match');
const lobbyStatus = document.getElementById('lobby-status');
const lobbyPanel = document.getElementById('lobby-panel');
const okeyTable = document.getElementById('okey-table');
const myIstaka = document.getElementById('my-istaka');

let currentUser = null;
let currentRoomId = null;
let myPlayerSlot = null; 

// 1. KAYIT OLMA SİSTEMİ
btnRegister.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if(!username || !password) {
        authError.innerText = "Lütfen alanları doldurun.";
        return;
    }
    
    const fakeEmail = `${username}@deva101.com`;
    
    createUserWithEmailAndPassword(auth, fakeEmail, password)
        .then((userCredential) => {
            authError.innerText = "Kayıt Başarılı! Giriş yapılıyor...";
            set(ref(database, 'users/' + userCredential.user.uid), {
                username: username,
                gold: 10000 
            });
        })
        .catch((error) => {
            authError.innerText = "Kayıt hatası: Bu kullanıcı adı alınmış olabilir.";
        });
});

// 2. GİRİŞ YAPMA SİSTEMİ
btnLogin.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    
    if(!username || !password) {
        authError.innerText = "Lütfen alanları doldurun.";
        return;
    }
    
    const fakeEmail = `${username}@deva101.com`;
    
    signInWithEmailAndPassword(auth, fakeEmail, password)
        .catch(error => {
            authError.innerText = "Hatalı kullanıcı adı veya şifre!";
        });
});

// 3. ÇIKIŞ YAPMA
btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// 4. OTURUM DURUMU KONTROLÜ
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        authContainer.classList.add('hidden');
        gameContainer.classList.remove('hidden');
        
        onValue(ref(database, 'users/' + user.uid), (snapshot) => {
            const data = snapshot.val();
            if(data) displayName.innerText = data.username;
        });
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        gameContainer.classList.add('hidden');
        okeyTable.classList.add('hidden');
        lobbyPanel.classList.remove('hidden');
        myIstaka.innerHTML = "";
    }
});

// 5. ONLINE EŞLEŞME (LOBİ) MOTORU
btnFindMatch.addEventListener('click', () => {
    lobbyStatus.innerText = "Boş VIP masalar aranıyor...";
    const roomsRef = ref(database, 'rooms');
    
    onValue(roomsRef, (snapshot) => {
        const rooms = snapshot.val();
        let foundRoom = null;
        
        if (rooms) {
            for (let id in rooms) {
                if (rooms[id].playerCount < 4 && rooms[id].status === "waiting") {
                    foundRoom = id;
                    break;
                }
            }
        }
        
        if (foundRoom) {
            joinRoom(foundRoom);
        } else {
            createNewRoom();
        }
    }, { onlyOnce: true });
});

function createNewRoom() {
    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    currentRoomId = newRoomRef.key;
    myPlayerSlot = "player1";
    
    const roomData = {
        playerCount: 1,
        status: "waiting",
        players: {
            player1: auth.currentUser.uid
        }
    };
    
    set(newRoomRef, roomData).then(() => {
        listenRoom(currentRoomId);
    });
}

function joinRoom(roomId) {
    currentRoomId = roomId;
    const roomRef = ref(database, `rooms/${roomId}`);
    
    onValue(roomRef, (snapshot) => {
        const room = snapshot.val();
        if(room) {
            const nextSlotNum = room.playerCount + 1;
            myPlayerSlot = "player" + nextSlotNum;
            
            let updates = {};
            updates[`/players/${myPlayerSlot}`] = auth.currentUser.uid;
            updates['/playerCount'] = nextSlotNum;
            
            if(nextSlotNum === 4) {
                updates['/status'] = "dağıtılıyor";
            }
            
            update(roomRef, updates).then(() => {
                listenRoom(currentRoomId);
            });
        }
    }, { onlyOnce: true });
}

function listenRoom(roomId) {
    lobbyPanel.classList.add('hidden');
    okeyTable.classList.remove('hidden');
    
    onValue(ref(database, `rooms/${roomId}`), (snapshot) => {
        const room = snapshot.val();
        if(!room) return;
        
        lobbyStatus.innerText = `VIP Masa Oyuncuları bekleniyor (${room.playerCount}/4)`;
        
        if(room.status === "dağıtılıyor" && myPlayerSlot === "player1") {
            dagitTaslari(roomId);
        }
        
        if(room.status === "playing" && room.dagitilanTaslar && room.dagitilanTaslar[myPlayerSlot]) {
            lobbyStatus.innerText = "Deva 101 VIP El Başladı!";
            renderIstaka(room.dagitilanTaslar[myPlayerSlot]);
        }
    });
}

// 6. TAŞ DAĞITMA SİSTEMİ
function dagitTaslari(roomId) {
    let renkler = ['kirmizi', 'mavi', 'siyah', 'sari'];
    let deste = [];
    
    renkler.forEach(renk => {
        for(let i=1; i<=13; i++) {
            deste.push({ renk: renk, sayi: i });
            deste.push({ renk: renk, sayi: i });
        }
    });
    deste.push({ renk: 'joker', sayi: 0 });
    deste.push({ renk: 'joker', sayi: 0 });
    
    for (let i = deste.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deste[i], deste[j]] = [deste[j], deste[i]];
    }
    
    let dagitilan = {
        player1: deste.slice(0, 22),
        player2: deste.slice(22, 43),
        player3: deste.slice(43, 64),
        player4: deste.slice(64, 85)
    };
    
    let kalanDeste = deste.slice(85);
    let okeyTasi = kalanDeste.pop();
    
    update(ref(database, `rooms/${roomId}`), {
        status: "playing",
        dagitilanTaslar: dagitilan,
        kalanDeste: kalanDeste,
        okeyBelirleyici: okeyTasi,
        siraKimde: "player1"
    });
}

// 7. ISTAKAYI OLUŞTURMA
function renderIstaka(taslar) {
    myIstaka.innerHTML = "";
    taslar.sort((a, b) => a.sayi - b.sayi);
    
    taslar.forEach(tas => {
        const tasDiv = document.createElement('div');
        tasDiv.classList.add('tas', tas.renk);
        
        if(tas.renk === 'joker') {
            tasDiv.innerText = "J";
            tasDiv.style.background = "#ffeb3b";
        } else {
            tasDiv.innerText = tas.sayi;
        }
        
        myIstaka.appendChild(tasDiv);
    });
}
