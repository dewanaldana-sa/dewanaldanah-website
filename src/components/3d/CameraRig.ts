// =========================================================================
// CAMERA RIG SYSTEM
// 5-Phase Cinematic Journey with GSAP ScrollTrigger
// =========================================================================

import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CAMERA_KEYFRAMES, BUILDING } from '@/lib/sceneSetup';

gsap.registerPlugin(ScrollTrigger);

export interface CameraRig {
  timeline: gsap.core.Timeline;
  target: THREE.Vector3;
  updateFOV: (fov: number) => void;
  getProgress: () => number;
}

export function createCameraRig(
  camera: THREE.PerspectiveCamera,
  container: HTMLElement
): CameraRig {
  // Camera target (what camera looks at)
  const target = new THREE.Vector3(0, 40, 0);
  
  // FOV reference
  let currentFOV = 55;
  
  // Master timeline
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: container,
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    },
  });
  
  // =========================================================================
  // PHASE 1: Exterior Approach (0-20%)
  // =========================================================================
  const kf1 = CAMERA_KEYFRAMES.phase1;
  const kf2 = CAMERA_KEYFRAMES.phase2;
  const kf3 = CAMERA_KEYFRAMES.phase3;
  const kf4 = CAMERA_KEYFRAMES.phase4;
  const kf5 = CAMERA_KEYFRAMES.phase5;
  
  // Set initial position
  camera.position.set(kf1.position.x, kf1.position.y, kf1.position.z);
  target.set(kf1.target.x, kf1.target.y, kf1.target.z);
  
  // Phase 1 → Phase 2 (0-20%)
  timeline.to(camera.position, {
    x: kf2.position.x,
    y: kf2.position.y,
    z: kf2.position.z,
    ease: 'power2.inOut',
    duration: 2,
  }, 0);
  
  timeline.to(target, {
    x: kf2.target.x,
    y: kf2.target.y,
    z: kf2.target.z,
    ease: 'power2.inOut',
    duration: 2,
  }, 0);
  
  // Phase 2 → Phase 3 (20-40%)
  timeline.to(camera.position, {
    x: kf3.position.x,
    y: kf3.position.y,
    z: kf3.position.z,
    ease: 'power2.inOut',
    duration: 2,
  }, 2);
  
  timeline.to(target, {
    x: kf3.target.x,
    y: kf3.target.y,
    z: kf3.target.z,
    ease: 'power2.inOut',
    duration: 2,
  }, 2);
  
  // Phase 3 → Phase 4 (40-60%)
  timeline.to(camera.position, {
    x: kf4.position.x,
    y: kf4.position.y,
    z: kf4.position.z,
    ease: 'power1.inOut',
    duration: 2,
  }, 4);
  
  timeline.to(target, {
    x: kf4.target.x,
    y: kf4.target.y,
    z: kf4.target.z,
    ease: 'power1.inOut',
    duration: 2,
  }, 4);
  
  // Phase 4 → Phase 5 (60-100%)
  timeline.to(camera.position, {
    x: kf5.position.x,
    y: kf5.position.y,
    z: kf5.position.z,
    ease: 'power2.out',
    duration: 4,
  }, 6);
  
  timeline.to(target, {
    x: kf5.target.x,
    y: kf5.target.y,
    z: kf5.target.z,
    ease: 'power2.out',
    duration: 4,
  }, 6);
  
  // FOV animation
  timeline.to({ fov: 55 }, {
    fov: 62,
    duration: 2,
    onUpdate: function() {
      currentFOV = this.targets()[0].fov;
      camera.fov = currentFOV;
      camera.updateProjectionMatrix();
    },
  }, 2);
  
  timeline.to({ fov: 62 }, {
    fov: 50,
    duration: 2,
    onUpdate: function() {
      currentFOV = this.targets()[0].fov;
      camera.fov = currentFOV;
      camera.updateProjectionMatrix();
    },
  }, 6);
  
  return {
    timeline,
    target,
    updateFOV: (fov: number) => {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    },
    getProgress: () => timeline.progress(),
  };
}

// Update camera to look at target (call in animation loop)
export function updateCameraLookAt(camera: THREE.PerspectiveCamera, target: THREE.Vector3): void {
  camera.lookAt(target);
}

// Material reveal timeline
export function createMaterialTimeline(
  glassMaterial: THREE.MeshPhysicalMaterial,
  coreMaterial: THREE.MeshStandardMaterial
): gsap.core.Timeline {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: 'body',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1.2,
    },
  });
  
  // Glass opacity reveal
  timeline.to(glassMaterial, {
    opacity: 0.7,
    duration: 4,
    ease: 'none',
  }, 0);
  
  // Core visibility
  timeline.to(coreMaterial, {
    opacity: 1,
    duration: 3,
    ease: 'none',
  }, 1);
  
  return timeline;
}
