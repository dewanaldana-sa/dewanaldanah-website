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
      // 1. BASIC SETUP & ENVIRONMENT (PHASE 4 & 8)
      // =========================================================================
      const scene = new THREE.Scene();
      
      // Bright daytime sky gradient
      scene.background = new THREE.Color(0xb0c4de); // Light Steel Blue
      scene.fog = new THREE.Fog(0xdce6f0, 50, 300); // Soft distant fog

      const isMobile = window.innerWidth < 768;

      const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        0.1,
        500
      );

      // Building Parameters
      const floors = 25;
      const floorHeight = 3.5;
      const buildingSize = 24; // Width/Depth
      const coreSize = 8;
      const wallThickness = 0.2;
      const windowDepth = 0.3;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1 : 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2; // Brighter exposure
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // =========================================================================
      // 2. LIGHTING SYSTEM (PHASE 4)
      // =========================================================================
      
      // Soft ambient light (Sky + Ground color)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
      scene.add(hemiLight);

      // Main Sun
      const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.5);
      dirLight.position.set(50, 100, 50);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 2048;
      dirLight.shadow.mapSize.height = 2048;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 500;
      scene.add(dirLight);

      // Interior Fill Light (Warm)
      const interiorFill = new THREE.PointLight(0xffd9a0, 0.5, 200);
      interiorFill.position.set(0, 40, 0);
      scene.add(interiorFill);

      // =========================================================================
      // 3. MATERIALS (PHASE 5)
      // =========================================================================
      
      // Structural Concrete/Core
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xf0f0f0, // Light concrete
        roughness: 0.9,
        metalness: 0.1,
      });

      // Floor Plates (slightly darker)
      const floorMat = new THREE.MeshStandardMaterial({
        color: 0xe0e0e0,
        roughness: 0.8,
        metalness: 0.1,
      });

      // Facade Frames (Aluminum)
      const frameMat = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0, // Silver
        roughness: 0.4,
        metalness: 0.8,
      });

      // Glass (Reflective, Tinted)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88aacc,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.6, // Realistic glass
        transparent: true,
        opacity: 0.3, // Fallback
        thickness: 0.5,
      });

      // Interior Wall Material
      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xfafafa, // White interior walls
        roughness: 0.9,
        side: THREE.DoubleSide
      });

      // Furniture Wood
      const woodMat = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b,
        roughness: 0.7,
      });

      // Furniture White
      const whiteMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.5,
      });

      // Window Light Material (For night effect/random lights)
      const windowLightMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
      });

      // =========================================================================
      // HELPER: CREATE FURNITURE
      // =========================================================================
      const createFurniture = (x: number, y: number, z: number, type: string) => {
        const group = new THREE.Group();
        
        if (type === 'desk') {
          // Desk
          const deskGeo = new THREE.BoxGeometry(1.5, 0.1, 0.8);
          const desk = new THREE.Mesh(deskGeo, woodMat);
          desk.position.set(0, 0.4, 0);
          group.add(desk);
          // Chair
          const chairGeo = new THREE.BoxGeometry(0.4, 0.5, 0.4);
          const chair = new THREE.Mesh(chairGeo, whiteMat);
          chair.position.set(0, 0.25, 0.6);
          group.add(chair);
        } else if (type === 'sofa') {
          // Sofa body
          const sofaGeo = new THREE.BoxGeometry(2, 0.4, 0.8);
          const sofa = new THREE.Mesh(sofaGeo, whiteMat);
          sofa.position.set(0, 0.2, 0);
          group.add(sofa);
          // Back
          const backGeo = new THREE.BoxGeometry(2, 0.4, 0.2);
          const back = new THREE.Mesh(backGeo, whiteMat);
          back.position.set(0, 0.5, -0.3);
          group.add(back);
        } else if (type === 'bed') {
          const bedGeo = new THREE.BoxGeometry(2, 0.4, 1.6);
          const bed = new THREE.Mesh(bedGeo, whiteMat);
          bed.position.set(0, 0.2, 0);
          group.add(bed);
        } else if (type === 'table') {
          const topGeo = new THREE.BoxGeometry(1.2, 0.05, 1.2);
          const top = new THREE.Mesh(topGeo, woodMat);
          top.position.y = 0.45;
          group.add(top);
          const legGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.4);
          const leg = new THREE.Mesh(legGeo, woodMat);
          leg.position.y = 0.2;
          group.add(leg);
        }
        
        group.position.set(x, y, z);
        return group;
      };

      // =========================================================================
      // 4. BUILDING GENERATION GROUP
      // =========================================================================
      const buildingGroup = new THREE.Group();
      scene.add(buildingGroup);

      // =========================================================================
      // FUNCTION: ADD FACADE SYSTEM (PHASE 1 & 2)
      // =========================================================================
      const addFacadeSystem = () => {
        const panelsPerSide = isMobile ? 4 : 6;
        const panelWidth = buildingSize / panelsPerSide;
        const frameWidth = 0.1;
        
        // Count instances needed
        const mullionCount = (panelsPerSide + 1) * 4 * floors;
        const panelCount = panelsPerSide * 4 * floors;

        // Geometries
        const mullionGeo = new THREE.BoxGeometry(frameWidth, floorHeight, 0.2);
        const panelGeo = new THREE.BoxGeometry(panelWidth - frameWidth, floorHeight - 0.15, 0.1);
        const windowLightGeo = new THREE.PlaneGeometry(panelWidth - 0.2, floorHeight - 0.3);

        // InstancedMeshes
        const mullions = new THREE.InstancedMesh(mullionGeo, frameMat, mullionCount);
        const panels = new THREE.InstancedMesh(panelGeo, glassMat, panelCount);
        const windowLights = new THREE.InstancedMesh(windowLightGeo, windowLightMat, panelCount);

        const dummy = new THREE.Object3D();
        const color = new THREE.Color();
        
        let mullionIdx = 0;
        let panelIdx = 0;

        for (let f = 0; f < floors; f++) {
          const yBase = f * floorHeight;

          for (let s = 0; s < 4; s++) {
            for (let p = 0; p <= panelsPerSide; p++) {
              // Position calculation for each side
              const step = p * panelWidth - buildingSize / 2;
              const offset = buildingSize / 2;
              
              let x = 0, z = 0, rotY = 0;
              
              if (s === 0) { x = step; z = offset; rotY = 0; }
              else if (s === 1) { x = offset; z = -step; rotY = Math.PI / 2; }
              else if (s === 2) { x = -step; z = -offset; rotY = Math.PI; }
              else { x = -offset; z = step; rotY = -Math.PI / 2; }

              // Mullions
              if (p < panelsPerSide) {
                dummy.position.set(x, yBase + floorHeight / 2, z);
                dummy.rotation.y = rotY;
                dummy.updateMatrix();
                mullions.setMatrixAt(mullionIdx++, dummy.matrix);
              }

              // Panels (Glass)
              if (p < panelsPerSide) {
                const xP = s === 1 ? offset - panelWidth/2 : (s === 3 ? -offset + panelWidth/2 : step + panelWidth/2);
                const zP = s === 0 ? offset : (s === 2 ? -offset : z); // Simplified logic error fix
                
                // Corrected positioning logic for panels
                if (s === 0) dummy.position.set(step + panelWidth/2, yBase + floorHeight/2, offset);
                else if (s === 1) dummy.position.set(offset, yBase + floorHeight/2, -step - panelWidth/2);
                else if (s === 2) dummy.position.set(-step - panelWidth/2, yBase + floorHeight/2, -offset);
                else dummy.position.set(-offset, yBase + floorHeight/2, step + panelWidth/2);

                dummy.updateMatrix();
                panels.setMatrixAt(panelIdx, dummy.matrix);

                // Window Lights (Random colors)
                const isLit = Math.random() > 0.4; // 60% Lit
                const isWarm = Math.random() > 0.5;
                
                if (isLit) {
                  color.set(isWarm ? 0xffd9a0 : 0xadd8e6); // Warm or Cool
                  color.multiplyScalar(0.5 + Math.random() * 0.5); // Intensity variation
                } else {
                  color.set(0x111111); // Dark
                }
                windowLights.setColorAt(panelIdx, color);
                
                // Offset light slightly inside
                if (s === 0) dummy.position.z -= 0.15;
                else if (s === 1) dummy.position.x -= 0.15;
                else if (s === 2) dummy.position.z += 0.15;
                else dummy.position.x += 0.15;
                
                dummy.updateMatrix();
                windowLights.setMatrixAt(panelIdx++, dummy.matrix);
              }
            }
          }
        }

        mullions.instanceMatrix.needsUpdate = true;
        panels.instanceMatrix.needsUpdate = true;
        windowLights.instanceMatrix.needsUpdate = true;
        if (windowLights.instanceColor) windowLights.instanceColor.needsUpdate = true;

        buildingGroup.add(mullions, panels, windowLights);
      };

      // =========================================================================
      // FUNCTION: ADD INTERIOR SYSTEM (PHASE 3)
      // =========================================================================
      const addInteriorSystem = () => {
        // Floor Slabs
        const slabGeo = new THREE.BoxGeometry(buildingSize, 0.3, buildingSize);
        const slabs = new THREE.InstancedMesh(slabGeo, floorMat, floors);
        
        const dummy = new THREE.Object3D();
        
        for (let i = 0; i < floors; i++) {
          dummy.position.set(0, i * floorHeight, 0);
          dummy.updateMatrix();
          slabs.setMatrixAt(i, dummy.matrix);
        }
        slabs.instanceMatrix.needsUpdate = true;
        buildingGroup.add(slabs);

        // Core Structure (Elevator/Shaft)
        const coreGeo = new THREE.BoxGeometry(coreSize, floors * floorHeight, coreSize);
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.y = (floors * floorHeight) / 2;
        buildingGroup.add(core);

        // Interior Walls (Instanced)
        // We create a ring of offices/apartments around the core
        const wallHeight = 2.8;
        const wallGeo = new THREE.BoxGeometry(0.15, wallHeight, 2.5); // Partition wall
        
        // Estimate: 4 sides * 2 walls per side per floor approx
        const wallCount = 4 * 2 * floors; 
        const walls = new THREE.InstancedMesh(wallGeo, wallMat, wallCount);
        
        const radius = (coreSize / 2) + (buildingSize - coreSize) / 4; // Midpoint between core and glass
        
        let wallIdx = 0;
        const furnitureGroup = new THREE.Group();

        for (let f = 0; f < floors; f++) {
          const yFloor = f * floorHeight + 0.15; // On top of slab

          // Add walls and furniture for each side
          for (let s = 0; s < 4; s++) {
             // Simple logic: Place 2 partition walls per side
             const angle = (s * Math.PI / 2);
             
             // Wall 1
             if (wallIdx < wallCount) {
               dummy.position.set(
                 Math.cos(angle) * radius,
                 yFloor + wallHeight/2,
                 Math.sin(angle) * radius
               );
               dummy.rotation.y = -angle + Math.PI/2;
               dummy.updateMatrix();
               walls.setMatrixAt(wallIdx++, dummy.matrix);
             }

             // Furniture placement (Random)
             const furType = f % 3 === 0 ? 'desk' : (f % 3 === 1 ? 'sofa' : 'bed');
             const offset = (Math.random() - 0.5) * 4; // Random lateral pos
             
             // Place furniture looking inward or outward
             const fur = createFurniture(
               Math.cos(angle) * (radius + 2), // Closer to glass
               yFloor,
               Math.sin(angle) * (radius + 2),
               furType
             );
             fur.rotation.y = -angle + Math.PI; // Face interior
             furnitureGroup.add(fur);
          }
        }

        walls.instanceMatrix.needsUpdate = true;
        buildingGroup.add(walls);
        buildingGroup.add(furnitureGroup);
      };

      // =========================================================================
      // FUNCTION: ADD EXTERIOR POLISH (PHASE 7 & 8)
      // =========================================================================
      const addEnvironment = () => {
        // Ground
        const groundGeo = new THREE.PlaneGeometry(500, 500);
        const groundMat = new THREE.MeshStandardMaterial({ 
          color: 0x3a3a3a, // Asphalt
          roughness: 0.9,
          metalness: 0.1
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        scene.add(ground);

        // Subtle Silhouette Buildings
        const silhouetteGeo = new THREE.BoxGeometry(15, 60, 15);
        const silhouetteMat = new THREE.MeshStandardMaterial({
          color: 0x4a5568,
          roughness: 1.0
        });

        for(let i=0; i<10; i++) {
          const building = new THREE.Mesh(silhouetteGeo, silhouetteMat);
          const angle = (i / 10) * Math.PI * 2;
          building.position.set(
            Math.cos(angle) * (80 + Math.random() * 40),
            30,
            Math.sin(angle) * (80 + Math.random() * 40)
          );
          building.scale.y = 0.5 + Math.random();
          scene.add(building);
        }
      };

      // =========================================================================
      // EXECUTE GENERATION
      // =========================================================================
      addFacadeSystem();
      addInteriorSystem();
      addEnvironment();

      // =========================================================================
      // 9. GSAP SCROLL ANIMATION (PRESERVED & TWEAKED)
      // =========================================================================
      
      // Start camera outside
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

      // --- Stage 1 (0% - 25%): Approach and Enter ---
      tl.to(camera.position, { 
        x: 0, y: floorHeight * 5, z: buildingSize / 2 - 2, // Right inside the facade
        ease: "power1.inOut", duration: 1 
      }, 0);
      tl.to(cameraTarget, { 
        x: 0, y: floorHeight * 5, z: 0, // Look at core
        ease: "power1.inOut", duration: 1 
      }, 0);

      // --- Stage 2 (25% - 50%: Inside looking up ---
      tl.to(camera.position, { 
        x: 0, y: floorHeight * 3, z: 0, // Float inside center
        ease: "power1.inOut", duration: 1 
      }, 1);
      tl.to(cameraTarget, { 
        x: 0, y: floorHeight * 15, z: 0, // Look up!
        ease: "power1.inOut", duration: 1 
      }, 1);

      // --- Stage 3 (50% - 75%): Move up through floors ---
      tl.to(camera.position, { 
        x: 5, y: floorHeight * 18, z: 5, // High corner inside
        ease: "power1.inOut", duration: 1 
      }, 2);
      tl.to(cameraTarget, { 
        x: 0, y: floorHeight * 12, z: 0, 
        ease: "power1.inOut", duration: 1 
      }, 2);

      // --- Stage 4 (75% - 100%): Exit and Wide Shot ---
      tl.to(camera.position, { 
        x: buildingSize * 2, y: floorHeight * 10, z: buildingSize * 2, 
        ease: "power2.out", duration: 1 
      }, 3);
      tl.to(cameraTarget, { 
        x: 0, y: floorHeight * 12, z: 0, 
        ease: "power2.out", duration: 1 
      }, 3);

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

        // Subtle camera drift (Handheld feel)
        // camera.position.x += Math.sin(elapsed * 0.5) * 0.005; // Very subtle
        
        renderer.render(scene, camera);
      };

      animate();

      console.log("✅ REALISTIC BUILDING INITIALIZED");

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
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}
    />
  );
}
