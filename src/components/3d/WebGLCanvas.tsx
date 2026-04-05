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
    // LENIS SMOOTH SCROLL (Untouched)
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
      
      // 1. BASIC SETUP
      const scene = new THREE.Scene();
      // بيئة نهارية مشرقة وواقعية
      scene.background = new THREE.Color(0xe8f0f8); 
      scene.fog = new THREE.FogExp2(0xe8f0f8, 0.004);
      
      const isMobile = window.innerWidth < 768;
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
      
      // إعدادات المبنى
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
      renderer.toneMappingExposure = 1.3; // إضاءة ساطعة وفخمة
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // 2. LIGHTING SYSTEM (Daylight & Premium Look)
      const hemiLight = new THREE.HemisphereLight(0xffffff, 0xebf2fa, 0.6);
      scene.add(hemiLight);

      const sunLight = new THREE.DirectionalLight(0xfff5e6, 2.0); // ضوء شمس دافئ
      sunLight.position.set(100, 150, 50);
      scene.add(sunLight);

      const groundBounce = new THREE.DirectionalLight(0xdde6ee, 0.5); // انعكاس الأرض
      groundBounce.position.set(-50, -50, -50);
      scene.add(groundBounce);

      // 3. MATERIALS SYSTEM (Premium Realistic Materials)
      // مواد وهمية نستخدمها فقط لربطها مع GSAP Timeline الموجود مسبقاً
      const solidMat = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });
      const wireMat = new THREE.MeshBasicMaterial({ opacity: 0, transparent: true });

      // المواد المعمارية الحقيقية (تبدأ شفافة لتتفاعل مع تأثير السكرول)
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x88aabb, metalness: 0.9, roughness: 0.1, transmission: 0.8,
        transparent: true, opacity: 0, envMapIntensity: 1.0
      });

      const metalMat = new THREE.MeshStandardMaterial({
        color: 0xc0c0c0, metalness: 0.8, roughness: 0.3,
        transparent: true, opacity: 0
      });

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xf5f5f0, roughness: 0.9, metalness: 0.0,
        transparent: true, opacity: 0
      });

      const woodMat = new THREE.MeshStandardMaterial({
        color: 0x8b5a2b, roughness: 0.8, transparent: true, opacity: 0
      });

      const fabricMat = new THREE.MeshStandardMaterial({
        color: 0x4a6984, roughness: 0.9, transparent: true, opacity: 0
      });

      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a, roughness: 0.9, transparent: true, opacity: 0
      });

      // 4. CORE & INTERIOR SYSTEM
      const buildInterior = () => {
        // النواة الخرسانية
        const coreGeo = new THREE.BoxGeometry(coreSize, floors * floorHeight, coreSize);
        const coreSolid = new THREE.Mesh(coreGeo, coreMat);
        coreSolid.position.y = (floors * floorHeight) / 2;
        scene.add(coreSolid);

        // الأرضيات (الأسقف)
        const slabGeo = new THREE.BoxGeometry(buildingSize - 0.2, 0.4, buildingSize - 0.2);
        const slabMesh = new THREE.InstancedMesh(slabGeo, wallMat, floors);

        // الجدران الداخلية (لتقسيم الغرف)
        const partitionCount = floors * 12; 
        const wallGeo = new THREE.BoxGeometry(0.2, floorHeight, buildingSize * 0.4);
        const partitionMesh = new THREE.InstancedMesh(wallGeo, wallMat, partitionCount);
        
        const dummy = new THREE.Object3D();
        let wIndex = 0;

        for (let i = 0; i < floors; i++) {
          const y = i * floorHeight;
          
          dummy.position.set(0, y, 0);
          dummy.updateMatrix();
          slabMesh.setMatrixAt(i, dummy.matrix);

          for (let j = 0; j < 12; j++) {
            const isHorizontal = Math.random() > 0.5;
            const posX = (Math.random() - 0.5) * (buildingSize - 4);
            const posZ = (Math.random() - 0.5) * (buildingSize - 4);
            
            // تجنب وضع جدران داخل النواة
            if (Math.abs(posX) < coreSize/2 && Math.abs(posZ) < coreSize/2) continue;

            dummy.position.set(posX, y + floorHeight / 2, posZ);
            dummy.rotation.set(0, isHorizontal ? Math.PI / 2 : 0, 0);
            dummy.updateMatrix();
            if(wIndex < partitionCount) partitionMesh.setMatrixAt(wIndex++, dummy.matrix);
          }
        }
        scene.add(slabMesh, partitionMesh);
      };

      // 5. FURNITURE SYSTEM (Life inside the building)
      const buildFurniture = () => {
        const deskGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
        const bedGeo = new THREE.BoxGeometry(2.0, 0.5, 1.5);
        const totalItems = floors * 15;
        
        const deskMesh = new THREE.InstancedMesh(deskGeo, woodMat, totalItems);
        const bedMesh = new THREE.InstancedMesh(bedGeo, fabricMat, totalItems);
        
        const dummy = new THREE.Object3D();
        let dIndex = 0, bIndex = 0;

        for (let i = 0; i < floors; i++) {
          const y = i * floorHeight;
          const isResidential = i > floors / 2; // الطوابق العليا سكنية، السفلى مكاتب

          for (let j = 0; j < 15; j++) {
            const posX = (Math.random() - 0.5) * (buildingSize - 2);
            const posZ = (Math.random() - 0.5) * (buildingSize - 2);
            
            if (Math.abs(posX) < coreSize/2 + 1 && Math.abs(posZ) < coreSize/2 + 1) continue;

            dummy.position.set(posX, y + 0.4, posZ);
            dummy.rotation.set(0, Math.random() * Math.PI, 0);
            dummy.updateMatrix();

            if (isResidential) {
              if (Math.random() > 0.3) bedMesh.setMatrixAt(bIndex++, dummy.matrix);
            } else {
              deskMesh.setMatrixAt(dIndex++, dummy.matrix);
            }
          }
        }
        scene.add(deskMesh, bedMesh);
      };

      // 6. FACADE SYSTEM (Real glass curtain walls)
      const buildFacade = () => {
        const panelsPerSide = 10;
        const panelWidth = buildingSize / panelsPerSide;
        const totalPanels = floors * 4 * panelsPerSide;

        const glassMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(panelWidth, floorHeight, 0.1), glassMat, totalPanels);
        const mullionMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.1, floorHeight, 0.2), metalMat, totalPanels + floors * 4);
        const spandrelMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(panelWidth, 0.4, 0.15), metalMat, totalPanels);

        const dummy = new THREE.Object3D();
        let index = 0;
        const half = buildingSize / 2;

        for (let i = 0; i < floors; i++) {
          const y = i * floorHeight + floorHeight / 2;
          for (let side = 0; side < 4; side++) {
            for (let p = 0; p < panelsPerSide; p++) {
              const t = (p + 0.5) * panelWidth - half;
              let x = 0, z = 0, rotY = 0;
              
              if (side === 0) { x = t; z = half; rotY = 0; }
              if (side === 1) { x = t; z = -half; rotY = Math.PI; }
              if (side === 2) { x = half; z = t; rotY = Math.PI / 2; }
              if (side === 3) { x = -half; z = t; rotY = -Math.PI / 2; }

              dummy.rotation.set(0, rotY, 0);
              
              // ألواح الزجاج
              dummy.position.set(x, y, z);
              dummy.updateMatrix();
              glassMesh.setMatrixAt(index, dummy.matrix);

              // الفواصل الأفقية بين الطوابق
              dummy.position.set(x, i * floorHeight, z);
              dummy.updateMatrix();
              spandrelMesh.setMatrixAt(index, dummy.matrix);

              // الإطارات المعدنية العمودية (Mullions)
              let mx = x, mz = z;
              if (side === 0) mx -= panelWidth / 2;
              if (side === 1) mx += panelWidth / 2;
              if (side === 2) mz -= panelWidth / 2;
              if (side === 3) mz += panelWidth / 2;
              
              dummy.position.set(mx, y, mz);
              dummy.updateMatrix();
              mullionMesh.setMatrixAt(index, dummy.matrix);

              index++;
            }
          }
        }
        scene.add(glassMesh, mullionMesh, spandrelMesh);
      };

      // بناء المشروع
      buildInterior();
      buildFurniture();
      buildFacade();

      // الأرضية الخارجية
      const baseGeo = new THREE.BoxGeometry(buildingSize * 3, 1, buildingSize * 3);
      const baseMat = new THREE.MeshStandardMaterial({ color: 0xe0e5ec, roughness: 0.8 });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      baseMesh.position.y = -0.5;
      scene.add(baseMesh);

      // =========================================================================
      // 7. GSAP SCROLL ANIMATION (UNTOUCHED LOGIC)
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
      
      // المشهد 1: الدخول
      tl.to(camera.position, { x: 8, y: floorHeight * 8, z: 8, ease: "power1.inOut", duration: 1 }, 0);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 8, z: 0, ease: "power1.inOut", duration: 1 }, 0);
      tl.to(solidMat, { opacity: 0.5, duration: 1, ease: "none" }, 0);
      
      // المشهد 2: النظر للأعلى داخل المبنى
      tl.to(camera.position, { x: -8, y: floorHeight * 5, z: -8, ease: "power1.inOut", duration: 1 }, 1);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 20, z: 0, ease: "power1.inOut", duration: 1 }, 1);
      tl.to(solidMat, { opacity: 0.8, duration: 1, ease: "none" }, 1);
      
      // المشهد 3: الخروج
      tl.to(camera.position, { x: 0, y: floorHeight * 2, z: buildingSize * 1.5, ease: "power1.inOut", duration: 1 }, 2);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power1.inOut", duration: 1 }, 2);
      
      // المشهد 4: اللقطة الختامية
      tl.to(camera.position, { x: buildingSize * 1.8, y: floorHeight * 12, z: buildingSize * 2.2, ease: "power2.out", duration: 1 }, 3);
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power2.out", duration: 1 }, 3);
      tl.to(solidMat, { opacity: 1, duration: 1, ease: "none" }, 3);
      
      gsap.ticker.add(() => {
        camera.lookAt(cameraTarget);
      });
      
      // =========================================================================
      // 8. ANIMATION LOOP (Syncing GSAP with Real Materials)
      // =========================================================================
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        // ربط شفافية المواد المعمارية بقيمة التايم لاين الخاصة بـ GSAP
        const currentOpacity = solidMat.opacity;
        
        // الزجاج يكون شبه شفاف دائماً في النهاية، باقي المواد تصبح صلبة
        glassMat.opacity = currentOpacity * 0.7; 
        metalMat.opacity = currentOpacity;
        wallMat.opacity = currentOpacity;
        woodMat.opacity = currentOpacity;
        fabricMat.opacity = currentOpacity;
        coreMat.opacity = currentOpacity;

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
      style={{ display: "block", width: "100vw", height: "100vh" }}
    />
  );
}
