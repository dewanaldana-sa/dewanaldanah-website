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
    // LENIS SMOOTH SCROLL
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
    // THREE.JS SCENE - PROCEDURAL SKYSCRAPER WITH CINEMATIC DRONE PATH
    // =========================================================================
    const initScene = async () => {
      const THREE = await import("three");
      
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      // =========================================================================
      // 1. BASIC SETUP
      // =========================================================================
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x050a15);
      scene.fog = new THREE.FogExp2(0x050a15, 0.008);
      
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
      renderer.toneMappingExposure = 1.2;
      
      // =========================================================================
      // 2. LIGHTS
      // =========================================================================
      const ambientLight = new THREE.AmbientLight(0x1a2a4a, 1.2);
      scene.add(ambientLight);
      
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(50, 100, 50);
      scene.add(directionalLight);
      
      const cyanLight1 = new THREE.PointLight(0x00e5ff, 2.5, 200);
      cyanLight1.position.set(-40, 60, 40);
      scene.add(cyanLight1);
      
      const cyanLight2 = new THREE.PointLight(0x00e5ff, 1.5, 150);
      cyanLight2.position.set(40, 40, -40);
      scene.add(cyanLight2);
      
      const bottomLight = new THREE.PointLight(0x00e5ff, 0.5, 80);
      bottomLight.position.set(0, 5, 0);
      scene.add(bottomLight);
      
      // =========================================================================
      // 3. MATERIALS
      // =========================================================================
      const solidMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a2744,
        roughness: 0.7, 
        metalness: 0.3,
        transparent: true,
        opacity: 0
      });
      
      const wireMat = new THREE.MeshBasicMaterial({ 
        color: 0x00e5ff,
        wireframe: true, 
        transparent: true, 
        opacity: 0.35
      });
      
      // =========================================================================
      // 4. BUILDING CORE
      // =========================================================================
      const coreGeo = new THREE.BoxGeometry(coreSize, floors * floorHeight, coreSize);
      const coreSolid = new THREE.Mesh(coreGeo, solidMat);
      const coreWire = new THREE.Mesh(coreGeo, wireMat);
      coreSolid.position.y = (floors * floorHeight) / 2;
      coreWire.position.y = (floors * floorHeight) / 2;
      scene.add(coreSolid, coreWire);
      
      // =========================================================================
      // 5. FLOOR SLABS
      // =========================================================================
      const slabGeo = new THREE.BoxGeometry(buildingSize, 0.4, buildingSize);
      const slabsSolid = new THREE.InstancedMesh(slabGeo, solidMat, floors);
      const slabsWire = new THREE.InstancedMesh(slabGeo, wireMat, floors);
      
      const dummySlab = new THREE.Object3D();
      for (let i = 0; i < floors; i++) {
        dummySlab.position.set(0, i * floorHeight, 0);
        dummySlab.updateMatrix();
        slabsSolid.setMatrixAt(i, dummySlab.matrix);
        slabsWire.setMatrixAt(i, dummySlab.matrix);
      }
      slabsSolid.instanceMatrix.needsUpdate = true;
      slabsWire.instanceMatrix.needsUpdate = true;
      scene.add(slabsSolid, slabsWire);
      
      // =========================================================================
      // 6. PERIMETER COLUMNS
      // =========================================================================
      const colGeo = new THREE.BoxGeometry(0.8, floorHeight, 0.8);
      const columnsPerSide = 5;
      const totalColumns = floors * (columnsPerSide * 4);
      const colsSolid = new THREE.InstancedMesh(colGeo, solidMat, totalColumns);
      const colsWire = new THREE.InstancedMesh(colGeo, wireMat, totalColumns);
      
      const dummyCol = new THREE.Object3D();
      let colIndex = 0;
      const offset = buildingSize / 2 - 0.5;
      
      for (let i = 0; i < floors; i++) {
        const yPos = i * floorHeight + floorHeight / 2;
        
        for (let j = 0; j < columnsPerSide; j++) {
          const step = (j / (columnsPerSide - 1)) * buildingSize - buildingSize / 2;
          
          dummyCol.position.set(step, yPos, offset);
          dummyCol.updateMatrix();
          colsSolid.setMatrixAt(colIndex, dummyCol.matrix);
          colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
          
          dummyCol.position.set(step, yPos, -offset);
          dummyCol.updateMatrix();
          colsSolid.setMatrixAt(colIndex, dummyCol.matrix);
          colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
          
          if (j > 0 && j < columnsPerSide - 1) {
            dummyCol.position.set(offset, yPos, step);
            dummyCol.updateMatrix();
            colsSolid.setMatrixAt(colIndex, dummyCol.matrix);
            colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
            
            dummyCol.position.set(-offset, yPos, step);
            dummyCol.updateMatrix();
            colsSolid.setMatrixAt(colIndex, dummyCol.matrix);
            colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
          }
        }
      }
      colsSolid.instanceMatrix.needsUpdate = true;
      colsWire.instanceMatrix.needsUpdate = true;
      scene.add(colsSolid, colsWire);
      
      // =========================================================================
      // 7. GLOW LINES
      // =========================================================================
      const lineGeo = new THREE.BoxGeometry(buildingSize + 0.5, 0.05, buildingSize + 0.5);
      const lineMat = new THREE.MeshBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.2,
      });
      
      const glowLines: THREE.Mesh[] = [];
      for (let i = 0; i < floors; i++) {
        const line = new THREE.Mesh(lineGeo, lineMat.clone());
        line.position.y = i * floorHeight + 0.2;
        scene.add(line);
        glowLines.push(line);
      }
      
      // =========================================================================
      // 8. PARTICLES
      // =========================================================================
      const particleCount = isMobile ? 300 : 600;
      const particlePositions = new Float32Array(particleCount * 3);
      
      for (let i = 0; i < particleCount; i++) {
        particlePositions[i * 3] = (Math.random() - 0.5) * 120;
        particlePositions[i * 3 + 1] = Math.random() * floors * floorHeight;
        particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      }
      
      const particleGeo = new THREE.BufferGeometry();
      particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
      
      const particleMat = new THREE.PointsMaterial({
        size: 0.3,
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const particles = new THREE.Points(particleGeo, particleMat);
      scene.add(particles);
      
      // =========================================================================
      // 9. GROUND GRID
      // =========================================================================
      const gridHelper = new THREE.GridHelper(100, 40, 0x00e5ff, 0x0a1628);
      gridHelper.position.y = -0.5;
      (gridHelper.material as THREE.Material).opacity = 0.15;
      (gridHelper.material as THREE.Material).transparent = true;
      scene.add(gridHelper);
      
      // =========================================================================
      // 10. GSAP SCROLL ANIMATION V3 (The Awwwards Cinematic Drone Path)
      // =========================================================================
      
      // وضع الكاميرا المبدئي (عالية وتنظر للمبنى من الخارج)
      camera.position.set(buildingSize * 1.5, floors * floorHeight + 20, buildingSize * 1.5);
      
      // إنشاء نقطة وهمية لتنظر إليها الكاميرا (Target)، هذا يتيح لنا تحريك "رأس" الكاميرا بسلاسة
      const cameraTarget = new THREE.Vector3(0, (floors * floorHeight) / 2, 0);
      
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1.5
        }
      });
      
      // --- المشهد الأول (0% إلى 25%): الغوص إلى داخل المبنى (قسم خدماتنا) ---
      // الكاميرا تدخل بين الأعمدة
      tl.to(camera.position, { x: 8, y: floorHeight * 8, z: 8, ease: "power1.inOut", duration: 1 }, 0);
      // الكاميرا تنظر إلى قلب المبنى الخرساني
      tl.to(cameraTarget, { x: 0, y: floorHeight * 8, z: 0, ease: "power1.inOut", duration: 1 }, 0);
      // بداية تحول المخطط إلى خرسانة
      tl.to(solidMat, { opacity: 0.5, duration: 1, ease: "none" }, 0);
      tl.to(wireMat, { opacity: 0.1, duration: 1, ease: "none" }, 0);
      
      // --- المشهد الثاني (25% إلى 50%): التجول بالداخل والنظر للأعلى (قسم لماذا نحن) ---
      // الكاميرا تعبر للجهة المعاكسة داخل المبنى
      tl.to(camera.position, { x: -8, y: floorHeight * 5, z: -8, ease: "power1.inOut", duration: 1 }, 1);
      // الكاميرا تلتفت وتنظر للأعلى بشموخ نحو السقف! (تأثير سينمائي مذهل)
      tl.to(cameraTarget, { x: 0, y: floorHeight * 20, z: 0, ease: "power1.inOut", duration: 1 }, 1);
      tl.to(solidMat, { opacity: 0.8, duration: 1, ease: "none" }, 1);
      
      // --- المشهد الثالث (50% إلى 75%): الخروج من المبنى (قسم آلية العمل) ---
      // الكاميرا تخرج من المبنى وتصبح قريبة من الأرض
      tl.to(camera.position, { x: 0, y: floorHeight * 2, z: buildingSize * 1.5, ease: "power1.inOut", duration: 1 }, 2);
      // الكاميرا تنظر إلى منتصف المبنى من الخارج
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power1.inOut", duration: 1 }, 2);
      
      // --- المشهد الرابع (75% إلى 100%): اللقطة الختامية المهيبة (قسم التواصل) ---
      // تراجع واسع للكاميرا (Wide Shot) لإظهار الهيكل كاملاً
      tl.to(camera.position, { x: buildingSize * 1.8, y: floorHeight * 12, z: buildingSize * 2.2, ease: "power2.out", duration: 1 }, 3);
      // الكاميرا تستقر بالنظر إلى مركز المبنى
      tl.to(cameraTarget, { x: 0, y: floorHeight * 10, z: 0, ease: "power2.out", duration: 1 }, 3);
      // المبنى يصبح صلباً بالكامل بنسبة 100% والمخطط يختفي تماماً
      tl.to(solidMat, { opacity: 1, duration: 1, ease: "none" }, 3);
      tl.to(wireMat, { opacity: 0, duration: 1, ease: "none" }, 3);
      
      // تحديث زاوية نظر الكاميرا في كل إطار (Frame) بناءً على حركة الهدف
      gsap.ticker.add(() => {
        camera.lookAt(cameraTarget);
      });
      
      // =========================================================================
      // 11. ANIMATION LOOP
      // =========================================================================
      const clock = new THREE.Clock();
      
      const animate = () => {
        animationId = requestAnimationFrame(animate);
        
        const elapsed = clock.getElapsedTime();
        
        // Animate glow lines
        glowLines.forEach((line, i) => {
          const mat = line.material as THREE.MeshBasicMaterial;
          mat.opacity = 0.12 + Math.sin(elapsed * 1.5 + i * 0.3) * 0.08;
        });
        
        // Animate particles
        const positions = particles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(elapsed * 0.5 + i * 0.05) * 0.008;
          positions[i] += Math.cos(elapsed * 0.3 + i * 0.03) * 0.004;
        }
        particles.geometry.attributes.position.needsUpdate = true;
        particles.rotation.y = elapsed * 0.003;
        
        renderer.render(scene, camera);
      };
      
      animate();
      
      console.log("✅ CINEMATIC DRONE SCENE INITIALIZED - 4 STAGES READY!");
      
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
    />
  );
}
