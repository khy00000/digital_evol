const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
});
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.tonemMappingExposure = 2.5;
document.querySelector(".model").appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);

const filllight = new THREE.DirectionalLight(0xffffff, 3);
filllight.position.set(-5, 0, -5);
scene.add(filllight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

//모델에 따라 밝기 조정

// 기본 애니메이션
function basicAnimate() {
    renderer.render(scene, camera);
    requestAnimationFrame(basicAnimate);
}
basicAnimate();

// 모델 로더 셋팅
let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/josta.glb", function (gltf) {
    model = gltf.scene;
    model.traverse((node) => {
        if(node.isMesh){
            if (node.material){
                node.material.metalness = 0.3;
                node.material.roughness = 0.4;
                node.material.envMapIntensity = 1.5;
            }
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    scene.add(model);

    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    camera.position.z = maxDim * 1.5;

    // model.scale.set(0, 0, 0);
    playInitialAnimaiton();

    cancelAnimationFrame(basicAnimate);
    animate();
});