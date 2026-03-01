"use client";

import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// =========================================================================
// MAIN SCENE CLASS - Cinematic Skyscraper Experience
// =========================================================================
export class DiwanScene {
  private container: HTMLElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private clock!: THREE.Clock;
  private animationId: number | null = null;
  private isMobile: boolean = false;
  
  // Building materials
  private solidMat!: THREE.MeshStandardMaterial;
  private wireMat!: THREE.MeshBasicMaterial;
  
  // Building parameters
  private floors = 25;
  private floorHeight = 3.5;
  private buildingSize = 24;
  private coreSize = 8;
  
  // Post-processing
  private composer: any = null;
  private bloomPass: any = null;
  
  constructor(container: HTMLElement) {
    this.container = container;
    this.isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    this.init();
  }
  
  private init(): void {
    this.createScene();
    this.createCamera();
    this.createRenderer();
    this.createLights();
    this.createProceduralSkyscraper();
    this.setupScrollAnimation();
    this.setupEventListeners();
    this.animate();
  }
  
  private createScene(): void {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050a15); // Deep dark blue
    this.scene.fog = new THREE.FogExp2(0x050a15, 0.008);
    this.clock = new THREE.Clock();
  }
  
  private createCamera(): void {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000);
    
    // Initial camera position (top-down view)
    this.camera.position.set(
      this.buildingSize * 1.5,
      this.floors * this.floorHeight + 15,
      this.buildingSize * 1.5
    );
  }
  
  private createRenderer(): void {
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile,
      alpha: false,
      powerPreference: "high-performance",
    });
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    this.container.appendChild(this.renderer.domElement);
    
    // Setup post-processing for desktop
    if (!this.isMobile) {
      this.setupPostProcessing();
    }
  }
  
  private async setupPostProcessing(): Promise<void> {
    try {
      const { EffectComposer } = await import("three/examples/jsm/postprocessing/EffectComposer.js");
      const { RenderPass } = await import("three/examples/jsm/postprocessing/RenderPass.js");
      const { UnrealBloomPass } = await import("three/examples/jsm/postprocessing/UnrealBloomPass.js");
      
      this.composer = new EffectComposer(this.renderer);
      
      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);
      
      this.bloomPass = new UnrealBloomPass(
        new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
        0.5, // strength
        0.4, // radius
        0.2  // threshold
      );
      this.composer.addPass(this.bloomPass);
    } catch (error) {
      console.log("Post-processing not available:", error);
    }
  }
  
  private createLights(): void {
    // Ambient light - very dark
    const ambientLight = new THREE.AmbientLight(0x0a1628, 0.5);
    this.scene.add(ambientLight);
    
    // Main directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3);
    directionalLight.position.set(50, 100, 50);
    this.scene.add(directionalLight);
    
    // Cyan accent lights
    const cyanLight1 = new THREE.PointLight(0x00e5ff, 1, 100);
    cyanLight1.position.set(-30, 50, 30);
    this.scene.add(cyanLight1);
    
    const cyanLight2 = new THREE.PointLight(0x00e5ff, 0.5, 80);
    cyanLight2.position.set(30, 30, -30);
    this.scene.add(cyanLight2);
    
    // Bottom fill light
    const bottomLight = new THREE.PointLight(0x1b3a5f, 0.3, 50);
    bottomLight.position.set(0, 0, 0);
    this.scene.add(bottomLight);
  }
  
  // =========================================================================
  // PROCEDURAL SKYSCRAPER GENERATION V2 (التشريح المعماري الاحترافي)
  // =========================================================================
  private createProceduralSkyscraper(): void {
    // --- الخامات (Materials) ---
    // خرسانة داكنة احترافية
    this.solidMat = new THREE.MeshStandardMaterial({ 
      color: 0x0f172a, // أزرق كحلي غامق جداً
      roughness: 0.9, 
      metalness: 0.2,
      transparent: true,
      opacity: 0 // تبدأ مخفية
    });
    
    // شبكة المخطط المتوهجة (أكثر هدوءاً واحترافية)
    this.wireMat = new THREE.MeshBasicMaterial({ 
      color: 0x00e5ff, // سيان ساطع
      wireframe: true, 
      transparent: true, 
      opacity: 0.3 // شفافية خفيفة كي لا تزعج العين
    });
    
    // --- 1. بناء قلب المبنى (Core) ---
    const coreGeo = new THREE.BoxGeometry(
      this.coreSize, 
      this.floors * this.floorHeight, 
      this.coreSize
    );
    const coreSolid = new THREE.Mesh(coreGeo, this.solidMat);
    const coreWire = new THREE.Mesh(coreGeo, this.wireMat);
    coreSolid.position.y = (this.floors * this.floorHeight) / 2;
    coreWire.position.y = (this.floors * this.floorHeight) / 2;
    coreSolid.userData.isBuilding = true;
    coreWire.userData.isBuilding = true;
    this.scene.add(coreSolid, coreWire);
    
    // --- 2. بناء الأسقف/الأرضيات (Slabs) ---
    const slabGeo = new THREE.BoxGeometry(this.buildingSize, 0.4, this.buildingSize);
    const slabsSolid = new THREE.InstancedMesh(slabGeo, this.solidMat, this.floors);
    const slabsWire = new THREE.InstancedMesh(slabGeo, this.wireMat, this.floors);
    
    const dummySlab = new THREE.Object3D();
    for (let i = 0; i < this.floors; i++) {
      dummySlab.position.set(0, i * this.floorHeight, 0);
      dummySlab.updateMatrix();
      slabsSolid.setMatrixAt(i, dummySlab.matrix);
      slabsWire.setMatrixAt(i, dummySlab.matrix);
    }
    
    (slabsSolid as any).userData = { isBuilding: true };
    (slabsWire as any).userData = { isBuilding: true };
    this.scene.add(slabsSolid, slabsWire);
    
    // --- 3. بناء الأعمدة المحيطية (Perimeter Columns) ---
    const colGeo = new THREE.BoxGeometry(0.6, this.floorHeight, 0.6);
    const columnsPerSide = 5; 
    const totalColumns = this.floors * (columnsPerSide * 4);
    const colsSolid = new THREE.InstancedMesh(colGeo, this.solidMat, totalColumns);
    const colsWire = new THREE.InstancedMesh(colGeo, this.wireMat, totalColumns);
    
    const dummyCol = new THREE.Object3D();
    let colIndex = 0;
    const offset = this.buildingSize / 2 - 0.5; // وضع الأعمدة على الحافة
    
    for (let i = 0; i < this.floors; i++) {
      const yPos = (i * this.floorHeight) + (this.floorHeight / 2);
      
      for (let j = 0; j < columnsPerSide; j++) {
        const step = (j / (columnsPerSide - 1)) * this.buildingSize - (this.buildingSize / 2);
        
        // الوجه الأمامي والخلفي
        dummyCol.position.set(step, yPos, offset); 
        dummyCol.updateMatrix();
        colsSolid.setMatrixAt(colIndex, dummyCol.matrix); 
        colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
        
        dummyCol.position.set(step, yPos, -offset); 
        dummyCol.updateMatrix();
        colsSolid.setMatrixAt(colIndex, dummyCol.matrix); 
        colsWire.setMatrixAt(colIndex++, dummyCol.matrix);
        
        // الوجه الأيمن والأيسر (تجنب تكرار الزوايا)
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
    
    (colsSolid as any).userData = { isBuilding: true };
    (colsWire as any).userData = { isBuilding: true };
    this.scene.add(colsSolid, colsWire);
    
    // --- 4. إضافة أضلاع إضافية للتوهج (Blueprint Glow Lines) ---
    this.createBlueprintGlowLines();
    
    // --- 5. إضافة جزيئات الغبار ---
    this.createDustParticles();
  }
  
  private createBlueprintGlowLines(): void {
    // Horizontal glow lines at each floor
    const lineGeo = new THREE.BoxGeometry(this.buildingSize + 0.5, 0.02, this.buildingSize + 0.5);
    const lineMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.15,
    });
    
    for (let i = 0; i < this.floors; i++) {
      const line = new THREE.Mesh(lineGeo, lineMat);
      line.position.y = i * this.floorHeight + 0.2;
      line.userData.isGlowLine = true;
      this.scene.add(line);
    }
  }
  
  private createDustParticles(): void {
    const particleCount = this.isMobile ? 200 : 500;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 80;
      positions[i * 3 + 1] = Math.random() * (this.floors * this.floorHeight);
      positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    
    const particles = new THREE.Points(geometry, material);
    particles.userData.isParticles = true;
    this.scene.add(particles);
  }
  
  // =========================================================================
  // GSAP SCROLL ANIMATION V2 (إخراج سينمائي أبطأ وأدق)
  // =========================================================================
  private setupScrollAnimation(): void {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: document.body,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.5, // نعومة ممتازة
      },
    });
    
    // 1. حركة الكاميرا: تنزل ببطء وتقترب من المبنى
    tl.to(this.camera.position, {
      y: this.floorHeight * 2, // تنزل للطابق الثاني
      x: this.buildingSize * 0.8, // تقترب أكثر
      z: this.buildingSize * 1.8,
      ease: "power1.inOut",
    }, 0);
    
    // 2. تلاشي الخطوط وظهور المبنى الصلب (سحر البناء)
    tl.to(this.solidMat, { 
      opacity: 1, 
      duration: 1, 
      ease: "power2.out" 
    }, 0.2); // يظهر الهيكل الخرساني
    
    tl.to(this.wireMat, { 
      opacity: 0.02, 
      duration: 1, 
      ease: "power2.in" 
    }, 0.2); // الخطوط لا تختفي تماماً بل تبقى كطاقة خفيفة
    
    // 3. Bloom intensity animation
    if (this.bloomPass) {
      tl.to(this.bloomPass, {
        strength: 0.8,
        duration: 1,
      }, 0.5);
    }
  }
  
  private setupEventListeners(): void {
    window.addEventListener("resize", this.onResize.bind(this));
  }
  
  private onResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    
    if (this.composer) {
      this.composer.setSize(width, height);
    }
  }
  
  private animate(): void {
    this.animationId = requestAnimationFrame(this.animate.bind(this));
    
    const elapsedTime = this.clock.getElapsedTime();
    
    // Make camera always look at building center
    this.camera.lookAt(0, this.camera.position.y - 5, 0);
    
    // Animate glow lines
    this.scene.children.forEach((child) => {
      if (child.userData.isGlowLine && child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.1 + Math.sin(elapsedTime * 2 + child.position.y) * 0.05;
      }
      
      // Animate particles
      if (child.userData.isParticles && child instanceof THREE.Points) {
        const positions = child.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += Math.sin(elapsedTime + i) * 0.005;
        }
        child.geometry.attributes.position.needsUpdate = true;
        child.rotation.y = elapsedTime * 0.01;
      }
    });
    
    // Render
    if (this.composer) {
      this.composer.render();
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
  
  public dispose(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    window.removeEventListener("resize", this.onResize.bind(this));
    this.renderer.dispose();
    this.scene.clear();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

export default DiwanScene;
