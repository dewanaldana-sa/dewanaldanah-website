"use client";

import { useEffect, useRef } from "react";

// Building parameters
const FLOORS = 22;
const FLOOR_HEIGHT = 3.5;
const BUILDING_SIZE = 28;
const CORE_SIZE = 8;

// Color palette
const COLORS = {
  darkBlue: 0x0a1628,
  royalBlue: 0x122c52,
  accentBlue: 0x234b7a,
  lightBlue: 0x3a6499,
};

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || isInitialized.current) return;

    isInitialized.current = true;

    const initThree = async () => {
      try {
        const THREE = await import("three");
        const canvas = canvasRef.current;
        if (!canvas) return;

        const isMobile = window.innerWidth < 768;

        // Scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(COLORS.darkBlue);
        scene.fog = new THREE.FogExp2(COLORS.darkBlue, 0.008);

        // Camera
        const camera = new THREE.PerspectiveCamera(
          55,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.set(35, 80, 35);

        // Renderer
        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias: !isMobile,
          powerPreference: "high-performance",
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x1a2a4a, 0.4);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.7);
        sunLight.position.set(60, 100, 40);
        scene.add(sunLight);

        const accentLight1 = new THREE.PointLight(COLORS.accentBlue, 1.5, 150);
        accentLight1.position.set(-40, 60, 40);
        scene.add(accentLight1);

        const accentLight2 = new THREE.PointLight(COLORS.accentBlue, 1, 120);
        accentLight2.position.set(40, 40, -40);
        scene.add(accentLight2);

        // Ground
        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({
          color: 0x050a12,
          roughness: 0.95,
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        scene.add(ground);

        // Grid
        const grid = new THREE.GridHelper(200, 40, COLORS.accentBlue, COLORS.darkBlue);
        grid.position.y = -0.4;
        (grid.material as THREE.Material).opacity = 0.12;
        (grid.material as THREE.Material).transparent = true;
        scene.add(grid);

        // Materials
        const concreteMat = new THREE.MeshStandardMaterial({
          color: COLORS.darkBlue,
          roughness: 0.8,
          metalness: 0.1,
        });

        const glassMat = new THREE.MeshPhysicalMaterial({
          color: COLORS.lightBlue,
          transparent: true,
          opacity: 0.7,
          roughness: 0.15,
          metalness: 0.3,
        });

        const metalMat = new THREE.MeshStandardMaterial({
          color: 0xc0c0c0,
          roughness: 0.5,
          metalness: 0.7,
        });

        // Building Core
        const coreGeo = new THREE.BoxGeometry(CORE_SIZE, FLOORS * FLOOR_HEIGHT, CORE_SIZE);
        const core = new THREE.Mesh(coreGeo, concreteMat);
        core.position.y = (FLOORS * FLOOR_HEIGHT) / 2;
        scene.add(core);

        // Floor Slabs (Instanced)
        const slabGeo = new THREE.BoxGeometry(BUILDING_SIZE, 0.4, BUILDING_SIZE);
        const slabs = new THREE.InstancedMesh(slabGeo, concreteMat, FLOORS);
        const dummySlab = new THREE.Object3D();
        for (let i = 0; i < FLOORS; i++) {
          dummySlab.position.set(0, i * FLOOR_HEIGHT, 0);
          dummySlab.updateMatrix();
          slabs.setMatrixAt(i, dummySlab.matrix);
        }
        slabs.instanceMatrix.needsUpdate = true;
        scene.add(slabs);

        // Columns (Instanced)
        const gridSize = 5;
        const totalCols = FLOORS * gridSize * gridSize;
        const colGeo = new THREE.BoxGeometry(0.7, FLOOR_HEIGHT, 0.7);
        const columns = new THREE.InstancedMesh(colGeo, metalMat, totalCols);
        const dummyCol = new THREE.Object3D();
        const spacing = (BUILDING_SIZE - 2) / (gridSize - 1);
        const startX = -(BUILDING_SIZE - 2) / 2;
        const startZ = -(BUILDING_SIZE - 2) / 2;

        let colIndex = 0;
        for (let floor = 0; floor < FLOORS; floor++) {
          const y = floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
          for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
              dummyCol.position.set(startX + col * spacing, y, startZ + row * spacing);
              dummyCol.updateMatrix();
              columns.setMatrixAt(colIndex++, dummyCol.matrix);
            }
          }
        }
        columns.instanceMatrix.needsUpdate = true;
        scene.add(columns);

        // Glass Facade
        const facadeOffset = BUILDING_SIZE / 2 + 0.15;
        const windowWidth = 1.8;
        const windowHeight = 2.4;
        const windowsPerSide = Math.floor(BUILDING_SIZE / (windowWidth + 0.1));
        const windowGeo = new THREE.BoxGeometry(windowWidth, windowHeight, 0.05);
        const totalWindows = FLOORS * windowsPerSide * 4;
        const windows = new THREE.InstancedMesh(windowGeo, glassMat, totalWindows);
        const dummyWindow = new THREE.Object3D();
        let windowIndex = 0;

        for (let floor = 0; floor < FLOORS; floor++) {
          const y = floor * FLOOR_HEIGHT + FLOOR_HEIGHT / 2;
          for (let side = 0; side < 4; side++) {
            for (let w = 0; w < windowsPerSide; w++) {
              const offset = (w - windowsPerSide / 2 + 0.5) * (windowWidth + 0.1);
              let x = 0, z = 0;
              switch (side) {
                case 0: x = offset; z = facadeOffset; break;
                case 1: x = facadeOffset; z = offset; break;
                case 2: x = -offset; z = -facadeOffset; break;
                case 3: x = -facadeOffset; z = offset; break;
              }
              dummyWindow.position.set(x, y, z);
              dummyWindow.rotation.y = side * Math.PI / 2;
              dummyWindow.updateMatrix();
              windows.setMatrixAt(windowIndex++, dummyWindow.matrix);
            }
          }
        }
        windows.instanceMatrix.needsUpdate = true;
        scene.add(windows);

        // Particles
        const particleCount = isMobile ? 60 : 150;
        const particlePositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
          particlePositions[i * 3] = (Math.random() - 0.5) * 100;
          particlePositions[i * 3 + 1] = Math.random() * FLOORS * FLOOR_HEIGHT;
          particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        const particleGeo = new THREE.BufferGeometry();
        particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
        const particleMat = new THREE.PointsMaterial({
          size: 0.15,
          color: COLORS.accentBlue,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const particles = new THREE.Points(particleGeo, particleMat);
        scene.add(particles);

        // Camera target
        const cameraTarget = new THREE.Vector3(0, 40, 0);

        // Scroll-based camera animation
        const handleScroll = () => {
          const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight);
          const t = Math.max(0, Math.min(1, scrollPercent));

          // Phase 1-5 camera positions based on scroll
          if (t < 0.2) {
            // Phase 1: Exterior approach
            const p = t / 0.2;
            camera.position.x = 35 - (35 - 18) * p;
            camera.position.y = 80 - (80 - 35) * p;
            camera.position.z = 35 - (35 - 18) * p;
            cameraTarget.y = 40 - (40 - 30) * p;
          } else if (t < 0.4) {
            // Phase 2: Approach facade
            const p = (t - 0.2) / 0.2;
            camera.position.x = 18 - (18 - 8) * p;
            camera.position.y = 35 - (35 - 28) * p;
            camera.position.z = 18 - (18 - 8) * p;
            cameraTarget.y = 30 + (35 - 30) * p;
          } else if (t < 0.6) {
            // Phase 3: Enter building
            const p = (t - 0.4) / 0.2;
            camera.position.x = 8 - (8 + 5) * p;
            camera.position.y = 28 + (55 - 28) * p;
            camera.position.z = 8 - (8 + 5) * p;
            cameraTarget.y = 35 + (60 - 35) * p;
          } else {
            // Phase 4-5: Exit and reveal
            const p = (t - 0.6) / 0.4;
            camera.position.x = -5 + (45 + 5) * p;
            camera.position.y = 55 - (55 - 50) * p;
            camera.position.z = -5 + (50 + 5) * p;
            cameraTarget.y = 60 - (60 - 35) * p;
          }
        };

        window.addEventListener("scroll", handleScroll);

        // Animation loop
        const clock = new THREE.Clock();
        let animationId: number;

        const animate = () => {
          animationId = requestAnimationFrame(animate);
          const elapsed = clock.getElapsedTime();

          camera.lookAt(cameraTarget);

          // Animate particles
          const positions = particles.geometry.attributes.position.array as Float32Array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i + 1] += Math.sin(elapsed * 0.3 + i) * 0.008;
            positions[i] += Math.cos(elapsed * 0.2 + i * 0.5) * 0.005;
            if (positions[i + 1] > FLOORS * FLOOR_HEIGHT) {
              positions[i + 1] = 0;
            }
          }
          particles.geometry.attributes.position.needsUpdate = true;
          particles.rotation.y = elapsed * 0.001;

          // Animate lights
          accentLight1.intensity = 1.5 + Math.sin(elapsed * 0.5) * 0.3;
          accentLight2.intensity = 1 + Math.cos(elapsed * 0.7) * 0.2;

          renderer.render(scene, camera);
        };

        animate();

        // Resize handler
        const onResize = () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener("resize", onResize);

        console.log("✨ DEWAN AL DANAH - 3D SCENE LOADED");

        return () => {
          window.removeEventListener("scroll", handleScroll);
          window.removeEventListener("resize", onResize);
          cancelAnimationFrame(animationId);
          renderer.dispose();
          scene.clear();
        };
      } catch (error) {
        console.error("Three.js initialization error:", error);
      }
    };

    initThree();
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1,
        pointerEvents: "none",
      }}
    />
  );
}
