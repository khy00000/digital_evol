// Lenis + ScrollTrigger 연동
const lenis = new Lenis();
lenis.on("scroll", ScrollTrigger.update);
// gsap 타이밍 lenis frame(raf) 동기화
gsap.ticker.add((time) => {
  lenis.raf(time * 1000);
});
// 더 정밀한 렌더링
gsap.ticker.lagSmoothing(0);

// three 기본 셋업 씬, 카메라, 렌더러
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfefdfd);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

// 캔버스 생성
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
});
// 배경 초기화
renderer.setClearColor(0xffffff, 1);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
// 그림자 활성화
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.physicallyCorrectLights = true;
// 물리적 조명 보정
renderer.toneMapping = THREE.ACESFilmicToneMapping;
// 밝기 조절
renderer.toneMappingExposure = 2.5;
document.querySelector(".model").appendChild(renderer.domElement);

// 조명 설정
// 씬을 균일하게 밝히는 환경광
const ambientLight = new THREE.AmbientLight(0xffffff, 3);
scene.add(ambientLight);

// 태양광같은 한 방향 주광
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7.5);
scene.add(mainLight);

// 반대쪽에서 보조해주는 보조광
const filllight = new THREE.DirectionalLight(0xffffff, 3);
filllight.position.set(-5, 0, -5);
scene.add(filllight);

// 하늘과 땅에서 동시에 오는 반구광(자연광 느낌)
const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 2);
hemiLight.position.set(0, 25, 0);
scene.add(hemiLight);

// 모델에 따라 밝기 조정 하기

// 기본 애니메이션 루프 (gltf 모델 로딩 전까지 화면이 렌더링되도록하는 임시 루프)
function basicAnimate() {
  renderer.render(scene, camera);
  requestAnimationFrame(basicAnimate);
}
basicAnimate();

// GLTFLoader 셋팅
let model;
const loader = new THREE.GLTFLoader();
loader.load("./assets/josta.glb", function (gltf) {
  model = gltf.scene;
  model.traverse((node) => {
    if (node.isMesh) {
      if (node.material) {
        node.material.metalness = 0.3;
        node.material.roughness = 0.4;
        node.material.envMapIntensity = 1.5;
      }
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  // 재질, 거칠기, 그림자 설정

  // 바운딩 박스 계산 모델 중심 배치
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.sub(center);
  scene.add(model);

  // 모델 크기를 기반으로 카메라 z축 거리 자동 조절
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  camera.position.z = maxDim * 1.5;

  // model.scale.set(0, 0, 0);
  // 초기 애니메이션 실행
  playInitialAnimaiton();

  // basicAnimate종료 메인 루프 전환
  cancelAnimationFrame(basicAnimate);
  animate();
});

// 초기 변수 설정
// 위아래 떠다니는 진폭
const floatAmplitude = 0.2;
const floatSpeed = 1.5;
const rotationSpeed = 0.3;
let isFloating = true;
let currentScroll = 0;

// 고정 영역 높이
const stickyHeight = window.innerHeight;
// 고정 섹션
const scannerSection = document.querySelector(".scanner");
// 스코롤 기준점
const scannerPosition = scannerSection.offsetTop;
const scanContainer = document.querySelector(".scan-container");
const scanSound = new Audio("./assets/scan.mp3");
// 기본적으로 컨테이너 숨겨놓음
gsap.set(scanContainer, { scale: 0 });

// 진입 애니메이션 모델, 스캔 컨테이너 스케일 1
function playInitialAnimaiton() {
  if (model) {
    gsap.to(model.scale, {
      x: 1,
      y: 1,
      z: 1,
      duration: 1,
      ease: "power2.out",
    });
  }
  gsap.to(scanContainer, {
    scale: 1,
    duration: 1,
    ease: "power2.out",
  });
}

// 상단으로 스코롤 복귀 시 초기화
ScrollTrigger.create({
  trigger: "body",
  start: "top top",
  end: "top -10",
  onEnterBack: () => {
    if (model) {
      gsap.to(model.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 1,
        ease: "power2.out",
      });
      isFloating = true;
    }
    gsap.to(scanContainer, {
      scale: 1,
      duration: 1,
      ease: "power2.out",
    });
  },
});

// 스캐너 섹션 고정 및 스캔 효과
ScrollTrigger.create({
  trigger: ".scanner",
  start: "top top",
  end: `${stickyHeight}px`,
  pin: true,
  onEnter: () => {
    if (model) {
      //둥둥 멈추고 초기 위치로 정렬
      isFloating = false;
      model.position.y = 0;

      setTimeout(() => {
        scanSound.currentTime = 0;
        scanSound.play();
      }, 500);
    }
    gsap.to(model.rotation, {
      // y축 한바퀴 회전 후 모델, 스캔컨테이너 사라짐
      y: model.rotation.y + Math.PI * 2,
      duration: 1,
      ease: "power2.inOut",
      onComplete: () => {
        gsap.to(model.scale, {
          x: 0,
          y: 0,
          z: 0,
          duration: 0.5,
          ease: "power2.in",
          onComplete: () => {
            gsap.to(scanContainer, {
              scale: 0,
              duration: 0.5,
              ease: "power2.in",
            });
          },
        });
      },
    });
  },
  onLeaveBack: () => {
    gsap.set(scanContainer, { scale: 0 });
    gsap.to(scanContainer, {
      scale: 1,
      duration: 1,
      ease: "power2.out",
    });
  },
});

// 현재 스코롤 위치 업데이트
lenis.on("scroll", (e) => {
  currentScroll = e.scroll;
});

// 위아래 둥둥 애니메이션 루프
function animate() {
  if (model) {
    if (isFloating) {
      const floatOffset =
        // 부드러운 곡선 형태 값 -0.2 ~ +0.2
        Math.sin(Date.now() * 0.001 * floatSpeed) * floatAmplitude;
      // 포지션 계속 바꾸며 y축 위아래로
      model.position.y = floatOffset;
    }

    // 스코롤 진행도(현재 스코롤 위치 기준 1(100%) 스코롤 진행 계산)
    const scrollProgress = Math.min(currentScroll / scannerPosition, 1);

    // 스코롤 진행도 100%이하 x축 1바퀴
    if (scrollProgress < 1) {
      model.rotation.x = scrollProgress * Math.PI * 2;
    }

    // 천천히 둥둥
    if (scrollProgress < 1) {
      model.rotation.y += 0.001 * rotationSpeed;
    }
  }

  // 장면 렌더링 업데이트 매끄러운 실시간 애니메이션
  renderer.render(scene, camera);
  // 다음 프레임 예약
  requestAnimationFrame(animate);
}
