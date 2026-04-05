Here is the completely upgraded `WebGLCanvas.tsx` component. I have rewritten the building generation logic to implement the realistic architectural facade, window system, and interior depth while preserving the camera animation and scroll systems exactly as requested.

```tsx
"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !canvasRef.current || isInitialized.current) return;

    isInitialized.current = true;
    let animationId: number;

    // =========================================================================
    // LENIS SMOOTH SCROLL (PRESERVED)
    // =========================================================================
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;
    lenis.on("scroll", ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // =========================================================================
    // THREE.JS SCENE - REALISTIC ARCHITECTURAL TOWER
    // =========================================================================
    const initScene = async () => {
      const THREE = await import("three");

      const canvas = canvasRef.current;
      if (!canvas) return;

      // =========================================================================
      // 1. BASIC SETUP (PRESERVED)
      // =========================================================================
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050a15);
      scene.fog = new THREE.FogExp2(0x050a15, 0.006);

      const isMobile = window.innerWidth < 768;

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );

      // Building parameters
      const floors = 25;
      const floorHeight = 3.5;
      const buildingSize = 24;
      const coreSize = 8;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !isMobile,
        alpha: false,
        powerPreference: "high-performance",
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.0;

      // =========================================================================
      // 2. LIGHTING UPGRADE (PHASE 6)
      // =========================================================================
      // Soft ambient (subtle blue)
      const ambientLight = new THREE.AmbientLight(0x4466aa, 0.4);
      scene.add(ambientLight);

      // Main directional (sun)
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(50, 100, 50);
      scene.add(dirLight);

      // Interior warm lights
      const interiorLight = new THREE.PointLight(0xffaa55, 1.5, 150);
      interiorLight.position.set(0, floors * floorHeight / 2, 0);
      scene.add(interiorLight);

      // Exterior accent (subtle cyan, distant)
      const accentLight = new THREE.PointLight(0x00e5ff, 0.6, 300);
      accentLight.position.set(-60, 80, -60);
      scene.add(accentLight);

      // =========================================================================
      // 3. MATERIALS REBUILD (PHASE 4)
      // =========================================================================
      
      // Primary Structural Material (Used for Core, Floor Slabs, Mullions)
      // We keep 'solidMat' name so existing GSAP timeline works on it.
      const solidMat = new THREE.MeshStandardMaterial({
        color: 0x1a2744, // Concrete dark blue
        roughness: 0.7,
        metalness: 0.1,
        transparent: true,
        opacity: 0 // Animated by GSAP
      });

      // Metal Frame Material (For Mullions/Spandrels)
      const metalMat = new THREE.MeshStandardMaterial({
        color: 0x8a9bb0, // Silver/Grey metal
        roughness: 0.4,
        metalness: 0.8,
        transparent: true,
        opacity: 0 // Animated by GSAP
      });

      // Glass Material
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88ccff,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.9, // Real glass effect
        transparent: true,
        opacity: 0, // Animated manually
        thickness: 0.5
      });

      // Window "Light" Material (InstancedMesh color will override)
      const windowLightMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0
      });

      // =========================================================================
      // 4. BUILDING CORE (PHASE 5)
      // =========================================================================
      const coreGeo = new THREE.BoxGeometry(coreSize, floors * floorHeight, coreSize);
      const coreMesh = new THREE.Mesh(coreGeo, solidMat);
      coreMesh.position.y = (floors * floorHeight) / 2;
      scene.add(coreMesh);

      // =========================================================================
      // 5. FACADE SYSTEM (PHASE 2 & 8)
      // =========================================================================
      
      // Configuration
      const panelsPerSide = isMobile ? 4 : 6;
      const panelWidth = buildingSize / panelsPerSide;
      const mullionWidth = 0.12;
      const spandrelHeight = 0.8;
      const windowDepth = 0.15; // Slight extrusion

      // Counts
      const totalMullions = (panelsPerSide + 1) * 4 * floors;
      const totalSpandrels = panelsPerSide * 4 * floors;
      const totalWindows = panelsPerSide * 4 * floors;

      // Geometries
      const mullionGeo = new THREE.BoxGeometry(mullionWidth, floorHeight, 0.3);
      const spandrelGeo = new THREE.BoxGeometry(panelWidth, spandrelHeight, 0.25);
      const windowGeo = new THREE.BoxGeometry(panelWidth - 0.1, floorHeight - spandrelHeight - 0.2, 0.1);
      
      // InstancedMeshes
      const mullionMesh = new THREE.InstancedMesh(mullionGeo, metalMat, totalMullions);
      const spandrelMesh = new THREE.InstancedMesh(spandrelGeo, metalMat, totalSpandrels);
      const windowMesh = new THREE.InstancedMesh(windowGeo, glassMat, totalWindows); // Glass shell
      const lightMesh = new THREE.InstancedMesh(windowGeo, windowLightMat, totalWindows); // Interior light

      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      // Warm and Cool colors for windows
      const warmColor = new THREE.Color(0xFFD9A0);
      const coolColor = new THREE.Color(0x3A6499);
      const offColor = new THREE.Color(0x000000);

      let mullionIndex = 0;
      let panelIndex = 0;

      // Iterate Floors
      for (let f = 0; f < floors; f++) {
        const yBase = f * floorHeight;

        // Iterate Sides (4 sides)
        for (let s = 0; s < 4; s++) {
          // Calculate side offset/rotation logic
          // We manually position things on the perimeter
          
          // Helper to get position based on side and step
          const getPos = (step: number) => {
            const x = step * panelWidth - buildingSize / 2 + panelWidth / 2;
            const offset = buildingSize / 2;
            
            // Side 0: Front (z+)
            // Side 1: Right (x+)
            // Side 2: Back (z-)
            // Side 3: Left (x-)
            
            if (s === 0) return { x: x, z: offset };
            if (s === 1) return { x: offset, z: -x }; // Rotate 90
            if (s === 2) return { x: -x, z: -offset }; // Rotate 180
            return { x: -offset, z: x }; // Rotate 270
          };

          // 1. Place Mullions (Vertical columns)
          for (let m = 0; m <= panelsPerSide; m++) {
            const pos = getPos(m - 0.5); // Offset by half panel
            dummy.position.set(
              pos.x,
              yBase + floorHeight / 2,
              pos.z
            );
            
            // Rotate mullion to face outward
            if (s === 1) dummy.rotation.y = Math.PI / 2;
            else if (s === 2) dummy.rotation.y = Math.PI;
            else if (s === 3) dummy.rotation.y = -Math.PI / 2;
            else dummy.rotation.y = 0;

            dummy.updateMatrix();
            mullionMesh.setMatrixAt(mullionIndex++, dummy.matrix);
          }

          // 2. Place Spandrels (Bottom horizontal metal strip)
          for (let p = 0; p < panelsPerSide; p++) {
            const pos = getPos(p);
            dummy.position.set(
              pos.x,
              yBase + spandrelHeight / 2,
              pos.z
            );
            
            if (s === 1) dummy.rotation.y = Math.PI / 2;
            else if (s === 2) dummy.rotation.y = Math.PI;
            else if (s === 3) dummy.rotation.y = -Math.PI / 2;
            else dummy.rotation.y = 0;

            dummy.updateMatrix();
            spandrelMesh.setMatrixAt(panelIndex, dummy.matrix);

            // 3. Place Windows & Lights
            // Window position (above spandrel)
            dummy.position.set(
              pos.x,
              yBase + spandrelHeight + (floorHeight - spandrelHeight) / 2,
              pos.z + 0.05 // Slight extrusion
            );
            dummy.updateMatrix();
            windowMesh.setMatrixAt(panelIndex, dummy.matrix);
            lightMesh.setMatrixAt(panelIndex, dummy.matrix);

            // 4. Window Color Logic (Phase 3)
            // 30% chance ON, 70% OFF
            const isOn = Math.random() > 0.7;
            if (isOn) {
              const isWarm = Math.random() > 0.4; // Mix of warm and cool
              color.copy(isWarm ? warmColor : coolColor);
              // Random intensity variation
              color.multiplyScalar(0.8 + Math.random() * 0.4);
            } else {
              color.set(0x111111); // Dark interior
            }
            
            lightMesh.setColorAt(panelIndex, color);
            
            panelIndex++;
          }
        }
      }

      mullionMesh.instanceMatrix.needsUpdate = true;
      spandrelMesh.instanceMatrix.needsUpdate = true;
      windowMesh.instanceMatrix.needsUpdate = true;
      lightMesh.instanceMatrix.needsUpdate = true;
      if (lightMesh.instanceColor) lightMesh.instanceColor.needsUpdate = true;

      scene.add(mullionMesh, spandrelMesh, windowMesh, lightMesh);

      // =========================================================================
      // 6. INTERIOR DEPTH (PHASE 5)
      // =========================================================================
      
      // Floor Slabs (Visual thickness inside)
      const slabGeo = new THREE.BoxGeometry(buildingSize - 0.5, 0.4, buildingSize - 0.5);
      const slabs = new THREE.InstancedMesh(slabGeo, solidMat, floors);
      
      // Interior Partitions (Random walls inside to avoid hollow look)
      const partitionGeo = new THREE.BoxGeometry(buildingSize * 0.6, floorHeight - 0.5, 0.2);
      const partitions = new THREE.InstancedMesh(partitionGeo, solidMat, Math.floor(floors / 2));
      
      const dummySlab = new THREE.Object3D();
      let partitionIdx = 0;

      for (let i = 0; i < floors; i++) {
        // Slabs
        dummySlab.position.set(0, i * floorHeight, 0);
        dummySlab.updateMatrix();
        slabs.setMatrixAt(i, dummySlab.matrix);

        // Partitions (every 2 floors, random rotation)
        if (i % 2 === 0 && partitionIdx < Math.floor(floors / 2)) {
          dummySlab.position.set(0, i * floorHeight + floorHeight/2, 0);
          dummySlab.rotation.y = Math.random() > 0.5 ? Math.PI / 2 : 0;
          dummySlab.updateMatrix();
          partitions.setMatrixAt(partitionIdx++, dummySlab.matrix);
        }
      }

      slabs.instanceMatrix.needsUpdate = true;
      partitions.instanceMatrix.needsUpdate = true;
      scene.add(slabs, partitions);

      // =========================================================================
      // 7. PARTICLES (PRESERVED & TWEAKED)
      // =========================================================================
      const particleCount = isMobile ? 200 : 400;
      const particlePositions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 120;
        particlePositions[i * 3 + 1] = Math.random() * floors * floorHeight;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      }

      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.15,
        color: 0x88aacc, // Subtle mist color
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);

      // =========================================================================
      // 8. GROUND (PHASE 7)
      // =========================================================================
      const groundGeo = new THREE.PlaneGeometry(200, 200);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0x0a0a0a,
        roughness: 0.9,
        metalness: 0.1
      });
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.5;
      scene.add(ground);

      // Grid overlay
      const gridHelper = new THREE.GridHelper(200, 50, 0x000000, 0x111111);
      gridHelper.position.y = -0.4;
      scene.add(gridHelper);

      // =========================================================================
      // 9. GSAP SCROLL ANIMATION (PRESERVED LOGIC)
      // =========================================================================
      
      camera.position.set(buildingSize * 1.5, floors * floorHeight + 20, buildingSize * 1.5);
      const cameraTarget = new THREE.Vector3(0, (floors * floorHeight) / 2, 0);

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5
        }
      });

      // --- Stage 1 (0% - 25%) ---
      tl.to(camera.position, { x: 8, y: floorHeight * 8, z: 8, ease: "power1.inOut", duration: 1 }, 0);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 8, z: 0, ease: "power1.inOut", duration: 1 }, 0);
      
      // We animate 'solidMat' opacity for the structural reveal
      tl.to(solidMat, { opacity: 0.6, duration: 1, ease: "none" }, 0);
      // We animate metal and glass separately for better control
      tl.to(metalMat, { opacity: 0.8, duration: 1, ease: "none" }, 0);
      tl.to(glassMat, { opacity: 0.6, duration: 1, ease: "none" }, 0);
      tl.to(windowLightMat, { opacity: 1.0, duration: 1, ease: "none" }, 0);

      // --- Stage 2 (25% - 50%) ---
      tl.to(camera.position, { x: -8, y: floorHeight * 5, z: -8, ease: "power1.inOut", duration: 1 }, 1);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 20, z: 0, ease: "power1.inOut", duration: 1 }, 1);
      tl.to(solidMat, { opacity: 0.8, duration: 1, ease: "none" }, 1);
      tl.to(glassMat, { opacity: 0.8, duration: 1, ease: "none" }, 1);

      // --- Stage 3 (50% - 75%) ---
      tl.to(camera.position, { x: 0, y: floorHeight * 2, z: buildingSize * 1.5, ease: "power1.inOut", duration: 1 }, 2);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power1.inOut", duration: 1 }, 2);

      // --- Stage 4 (75% - 100%) ---
      tl.to(camera.position, { x: buildingSize * 1.8, y: floorHeight * 12, z: buildingSize * 2.2, ease: "power2.out", duration: 1 }, 3);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power2.out", duration: 1 }, 3);
      
      // Final fade to fully solid building
      tl.to(solidMat, { opacity: 1.0, duration: 1, ease: "none" }, 3);
      tl.to(metalMat, { opacity: 1.0, duration: 1, ease: "none" }, 3);
      tl.to(glassMat, { opacity: 0.9, duration: 1, ease: "none" }, 3);

      gsap.ticker.add(() => {
        camera.lookAt(cameraTarget);
      });

      // =========================================================================
      // 10. ANIMATION LOOP
      // =========================================================================
      const clock = new THREE.Clock();

      const animate = () => {
        animationId = requestAnimationFrame(animate);

        const elapsed = clock.getElapsedTime();

        // Animate particles (subtle drift)
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(elapsed * 0.5 + i) * 0.005;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = elapsed * 0.001;

        // Animate Window Flicker (subtle)
        // Performance: Only update colors occasionally or via shader for better perf
        // Here we skip per-frame update for performance, relying on initial random setup

        renderer.render(scene, camera);
      };

      animate();

      console.log("✅ REALISTIC ARCHITECTURAL TOWER INITIALIZED");

      // Resize handler
      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      window.addEventListener("resize", onResize);

      return () => {
        window.removeEventListener("resize", onResize);
        cancelAnimationFrame(animationId);
        renderer.dispose();
        scene.clear();
      };
    };

    const cleanupPromise = initScene();

    return () => {
      if (lenisRef.current) {
        lenisRef.current.destroy();
      }
      cleanupPromise.then((cleanup) => cleanup?.());
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        zIndex: -1 
      }}
    />
  );
}
```
