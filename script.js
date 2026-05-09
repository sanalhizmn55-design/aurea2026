// 1. Sahne ve Kamera Kurulumu
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Gündüz gökyüzü

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. Işıklandırma (Güneş Etkisi)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Genel aydınlık
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 1);
sunLight.position.set(10, 20, 10);
scene.add(sunLight);

// 3. Harita: Lüks Şehir Zemini (Asfalt)
const groundGeometry = new THREE.PlaneGeometry(200, 200);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Gri asfalt
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2; // Yere yatır
scene.add(ground);

// 4. Kamera Pozisyonu
camera.position.set(0, 5, 10);
camera.lookAt(0, 0, 0);

// Render Döngüsü
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Ekran boyutuna göre güncelleme
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
