// --- 1. KURULUM VE SAHNE ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Açık mavi gündüz gökyüzü

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Işıklar
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(50, 100, 50);
scene.add(sunLight);

// Zemin (Asfalt)
const groundGeo = new THREE.PlaneGeometry(1000, 1000);
const groundMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// --- 2. MERCEDES S-CLASS TASARIMI ---
const carGroup = new THREE.Group();
scene.add(carGroup);

const bodyMat = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.1 });

// Ana Gövde
const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 4.5), bodyMat);
body.position.y = 0.6;
carGroup.add(body);

// Üst Kabin
const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.5), bodyMat);
cabin.position.set(0, 1.1, -0.2);
carGroup.add(cabin);

// Tekerlekler
const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
const wheels = [];
const wheelPos = [[1,1.5], [-1,1.5], [1,-1.5], [-1,-1.5]];
wheelPos.forEach(pos => {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI/2;
    w.position.set(pos[0], 0.4, pos[1]);
    carGroup.add(w);
    wheels.push(w);
});

// --- 3. BOTLAR (İNSANLAR) VE SKOR ---
let score = 0;
const bots = [];
const botGeo = new THREE.CapsuleGeometry(0.3, 1, 4, 8);
const botMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });

function spawnBot() {
    const bot = new THREE.Mesh(botGeo, botMat);
    bot.position.set(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
    scene.add(bot);
    bots.push(bot);
}
for(let i=0; i<30; i++) spawnBot(); // 30 tane bot oluştur

// --- 4. KONTROLLER ---
let velocity = 0;
let angle = 0;
const keys = { forward: false, backward: false, left: false, right: false };

// Mobil Buton Eventleri
const setupBtn = (id, key) => {
    const el = document.getElementById(id);
    el.addEventListener('touchstart', (e) => { e.preventDefault(); keys[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); keys[key] = false; });
    // Mouse desteği (test için)
    el.addEventListener('mousedown', () => keys[key] = true);
    el.addEventListener('mouseup', () => keys[key] = false);
};

setupBtn('btnGas', 'forward');
setupBtn('btnBrake', 'backward');
setupBtn('btnLeft', 'left');
setupBtn('btnRight', 'right');

// --- 5. OYUN DÖNGÜSÜ ---
function animate() {
    requestAnimationFrame(animate);

    // Hareket Fiziği
    if (keys.forward) velocity += 0.015;
    if (keys.backward) velocity -= 0.015;
    velocity *= 0.97; // Sürtünme

    if (Math.abs(velocity) > 0.1) {
        if (keys.left) angle += 0.03;
        if (keys.right) angle -= 0.03;
    }

    carGroup.rotation.y = angle;
    carGroup.position.x += Math.sin(angle) * velocity;
    carGroup.position.z += Math.cos(angle) * velocity;

    // Bot Çarpışma Kontrolü
    bots.forEach((bot, index) => {
        const dist = carGroup.position.distanceTo(bot.position);
        if (dist < 2) {
            scene.remove(bot);
            bots.splice(index, 1);
            score += 100;
            document.getElementById('scoreVal').innerText = score;
            spawnBot(); // Yeni bot çıkar
        }
    });

    // Kamera Takibi
    const camOffset = new THREE.Vector3(0, 5, -10).applyQuaternion(carGroup.quaternion);
    camera.position.copy(carGroup.position).add(camOffset);
    camera.lookAt(carGroup.position);

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
