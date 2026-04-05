// =========================================================================
// BUILDING COMPONENT
// Hyper-realistic glass office tower with full architectural detail
// =========================================================================

import * as THREE from 'three';
import { 
  BUILDING, 
  COLORS, 
  createGlassMaterial, 
  createMetalMaterial, 
  createConcreteMaterial,
  createEmissiveMaterial 
} from '@/lib/sceneSetup';

// Types for window instances
interface WindowInstance {
  mesh: THREE.InstancedMesh;
  materials: THREE.MeshStandardMaterial[];
  phases: number[]; // Random phase for light animation
  isWarm: boolean[];
}

interface BuildingElements {
  core: THREE.Mesh;
  slabs: THREE.InstancedMesh;
  columns: THREE.InstancedMesh;
  facade: THREE.Group;
  windows: WindowInstance[];
  interiorLights: THREE.Mesh[];
  mullions: THREE.InstancedMesh;
}

export function createBuilding(scene: THREE.Scene, isMobile: boolean): BuildingElements {
  const { 
    floors, floorHeight, footprint, coreSize, 
    slabThickness, columnWidth, gridColumns,
    facadeDepth, windowHeight, windowWidth, mullionWidth 
  } = BUILDING;
  
  const materials = {
    glass: createGlassMaterial(),
    metal: createMetalMaterial(),
    concrete: createConcreteMaterial(),
  };
  
  // =========================================================================
  // 1. BUILDING CORE (Elevator/Service Shaft)
  // =========================================================================
  const coreGeo = new THREE.BoxGeometry(coreSize, floors * floorHeight, coreSize);
  const core = new THREE.Mesh(coreGeo, materials.concrete);
  core.position.y = (floors * floorHeight) / 2;
  scene.add(core);
  
  // =========================================================================
  // 2. FLOOR SLABS (InstancedMesh for performance)
  // =========================================================================
  const slabGeo = new THREE.BoxGeometry(footprint, slabThickness, footprint);
  const slabs = new THREE.InstancedMesh(slabGeo, materials.concrete, floors);
  
  const dummySlab = new THREE.Object3D();
  for (let i = 0; i < floors; i++) {
    dummySlab.position.set(0, i * floorHeight, 0);
    dummySlab.updateMatrix();
    slabs.setMatrixAt(i, dummySlab.matrix);
  }
  slabs.instanceMatrix.needsUpdate = true;
  scene.add(slabs);
  
  // =========================================================================
  // 3. STRUCTURAL COLUMNS (Grid-based)
  // =========================================================================
  // Calculate total columns needed
  const columnsPerFloor = gridColumns * gridColumns;
  const totalColumns = floors * columnsPerFloor;
  
  const colGeo = new THREE.BoxGeometry(columnWidth, floorHeight, columnWidth);
  const columns = new THREE.InstancedMesh(colGeo, materials.metal, totalColumns);
  
  const dummyCol = new THREE.Object3D();
  const gridSpacing = (footprint - 2) / (gridColumns - 1);
  const startX = -(footprint - 2) / 2;
  const startZ = -(footprint - 2) / 2;
  
  let colIndex = 0;
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * floorHeight + floorHeight / 2;
    
    for (let row = 0; row < gridColumns; row++) {
      for (let col = 0; col < gridColumns; col++) {
        const x = startX + col * gridSpacing;
        const z = startZ + row * gridSpacing;
        
        dummyCol.position.set(x, y, z);
        dummyCol.updateMatrix();
        columns.setMatrixAt(colIndex++, dummyCol.matrix);
      }
    }
  }
  columns.instanceMatrix.needsUpdate = true;
  scene.add(columns);
  
  // =========================================================================
  // 4. FACADE SYSTEM (Curtain Wall with Mullions)
  // =========================================================================
  const facade = new THREE.Group();
  
  // Calculate window grid per floor
  const windowsPerSide = Math.floor((footprint - 1) / (windowWidth + mullionWidth));
  const totalWindowsPerFloor = windowsPerSide * 4;
  
  // =========================================================================
  // 5. WINDOWS WITH EMISSIVE LIGHTS
  // =========================================================================
  const windows: WindowInstance[] = [];
  const windowGeo = new THREE.BoxGeometry(windowWidth, windowHeight, 0.05);
  
  // Create window instances per floor for better material control
  const windowCount = floors * totalWindowsPerFloor;
  const warmMat = createEmissiveMaterial(true);
  const coolMat = createEmissiveMaterial(false);
  
  // Use single instanced mesh with per-instance colors
  const windowMesh = new THREE.InstancedMesh(windowGeo, materials.glass, windowCount);
  
  // Store per-instance data for animation
  const windowPhases: number[] = [];
  const windowIsWarm: boolean[] = [];
  
  // Seeded random for consistent window patterns
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  
  const dummyWindow = new THREE.Object3D();
  let windowIndex = 0;
  const facadeOffset = footprint / 2 + facadeDepth / 2;
  
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * floorHeight + floorHeight / 2;
    
    for (let side = 0; side < 4; side++) {
      for (let w = 0; w < windowsPerSide; w++) {
        const offset = (w - windowsPerSide / 2 + 0.5) * (windowWidth + mullionWidth);
        
        let x = 0, z = 0, rotY = 0;
        
        switch (side) {
          case 0: // Front
            x = offset;
            z = facadeOffset;
            rotY = 0;
            break;
          case 1: // Right
            x = facadeOffset;
            z = offset;
            rotY = Math.PI / 2;
            break;
          case 2: // Back
            x = -offset;
            z = -facadeOffset;
            rotY = Math.PI;
            break;
          case 3: // Left
            x = -facadeOffset;
            z = offset;
            rotY = -Math.PI / 2;
            break;
        }
        
        dummyWindow.position.set(x, y, z);
        dummyWindow.rotation.y = rotY;
        dummyWindow.updateMatrix();
        windowMesh.setMatrixAt(windowIndex, dummyWindow.matrix);
        
        // Random window state (seeded)
        const seed = floor * 1000 + side * 100 + w;
        windowPhases.push(seededRandom(seed) * Math.PI * 2);
        windowIsWarm.push(seededRandom(seed + 0.5) > 0.6);
        
        windowIndex++;
      }
    }
  }
  
  windowMesh.instanceMatrix.needsUpdate = true;
  scene.add(windowMesh);
  
  windows.push({
    mesh: windowMesh,
    materials: [warmMat, coolMat],
    phases: windowPhases,
    isWarm: windowIsWarm,
  });
  
  // =========================================================================
  // 6. MULLIONS (Vertical & Horizontal Divisions)
  // =========================================================================
  // Vertical mullions
  const mullionCount = floors * 4 * (windowsPerSide + 1) * 2; // Vertical + horizontal
  const mullionGeo = new THREE.BoxGeometry(mullionWidth, floorHeight * 0.95, 0.1);
  const mullions = new THREE.InstancedMesh(mullionGeo, materials.metal, mullionCount);
  
  const dummyMullion = new THREE.Object3D();
  let mullionIndex = 0;
  
  for (let floor = 0; floor < floors; floor++) {
    const y = floor * floorHeight + floorHeight / 2;
    
    for (let side = 0; side < 4; side++) {
      // Vertical mullions between windows
      for (let m = 0; m <= windowsPerSide; m++) {
        const offset = (m - windowsPerSide / 2) * (windowWidth + mullionWidth) - mullionWidth / 2;
        
        let x = 0, z = 0, rotY = 0;
        
        switch (side) {
          case 0:
            x = offset;
            z = facadeOffset;
            break;
          case 1:
            x = facadeOffset;
            z = offset;
            rotY = Math.PI / 2;
            break;
          case 2:
            x = -offset;
            z = -facadeOffset;
            rotY = Math.PI;
            break;
          case 3:
            x = -facadeOffset;
            z = -offset;
            rotY = -Math.PI / 2;
            break;
        }
        
        dummyMullion.position.set(x, y, z);
        dummyMullion.rotation.y = rotY;
        dummyMullion.updateMatrix();
        mullions.setMatrixAt(mullionIndex++, dummyMullion.matrix);
      }
    }
  }
  
  mullions.instanceMatrix.needsUpdate = true;
  scene.add(mullions);
  
  // =========================================================================
  // 7. INTERIOR LIGHTS (Ceiling strips - visible through glass)
  // =========================================================================
  const interiorLights: THREE.Mesh[] = [];
  const lightGeo = new THREE.PlaneGeometry(footprint * 0.6, 0.1);
  const lightMat = new THREE.MeshBasicMaterial({
    color: COLORS.warmLight,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  });
  
  // Add lights every 2-3 floors
  for (let floor = 1; floor < floors; floor += 2) {
    const light = new THREE.Mesh(lightGeo, lightMat.clone());
    light.position.set(0, floor * floorHeight + floorHeight - 0.5, 0);
    light.rotation.x = Math.PI / 2;
    scene.add(light);
    interiorLights.push(light);
  }
  
  // =========================================================================
  // 8. INTERIOR PARTITIONS (Depth hints)
  // =========================================================================
  const partitionGeo = new THREE.BoxGeometry(footprint * 0.8, floorHeight * 0.7, 0.15);
  const partitionMat = new THREE.MeshStandardMaterial({
    color: COLORS.royalBlue,
    roughness: 0.9,
    metalness: 0.1,
    transparent: true,
    opacity: 0.5,
  });
  
  for (let floor = 0; floor < floors; floor += 3) {
    // Back wall partition
    const partition = new THREE.Mesh(partitionGeo, partitionMat);
    partition.position.set(0, floor * floorHeight + floorHeight / 2, -footprint / 4);
    scene.add(partition);
  }
  
  return {
    core,
    slabs,
    columns,
    facade,
    windows,
    interiorLights,
    mullions,
  };
}

// Animate building elements
export function animateBuilding(
  elements: BuildingElements, 
  time: number, 
  scrollProgress: number
): void {
  // Animate interior lights based on scroll
  elements.interiorLights.forEach((light, i) => {
    const mat = light.material as THREE.MeshBasicMaterial;
    const flicker = Math.sin(time * 0.5 + i) * 0.05;
    mat.opacity = 0.3 + flicker + (scrollProgress > 0.4 && scrollProgress < 0.8 ? 0.2 : 0);
  });
  
  // Animate window lights (subtle)
  elements.windows.forEach((windowGroup) => {
    // Window light intensity would be controlled here
    // For instanced mesh, we'd update instance colors if needed
  });
}

// Create dust particles (minimal)
export function createParticles(scene: THREE.Scene, isMobile: boolean): THREE.Points {
  const count = isMobile ? 60 : 150;
  const positions = new Float32Array(count * 3);
  
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * BUILDING.floors * BUILDING.floorHeight;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
  }
  
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const mat = new THREE.PointsMaterial({
    size: 0.15,
    color: COLORS.accentBlue,
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);
  
  return particles;
}

// Animate particles
export function animateParticles(particles: THREE.Points, time: number): void {
  const positions = particles.geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < positions.length; i += 3) {
    positions[i + 1] += Math.sin(time * 0.3 + i) * 0.008;
    positions[i] += Math.cos(time * 0.2 + i * 0.5) * 0.005;
    
    // Reset particles that drift too high
    if (positions[i + 1] > BUILDING.floors * BUILDING.floorHeight) {
      positions[i + 1] = 0;
    }
  }
  
  particles.geometry.attributes.position.needsUpdate = true;
  particles.rotation.y = time * 0.001;
}
