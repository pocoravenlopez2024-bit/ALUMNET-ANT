import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Landing3DCanvasProps {
  className?: string;
  intensity?: number;
}

export const Landing3DCanvas: React.FC<Landing3DCanvasProps> = ({
  className = '',
  intensity = 1
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (e) {
      console.warn('WebGL not supported, skipping 3D background canvas:', e);
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.z = 24;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
    scene.add(ambientLight);

    const crimsonLight = new THREE.PointLight(0x8B181B, 2.5 * intensity, 60);
    crimsonLight.position.set(-15, 10, 10);
    scene.add(crimsonLight);

    const goldLight = new THREE.PointLight(0xD97706, 2.2 * intensity, 60);
    goldLight.position.set(15, -10, 8);
    scene.add(goldLight);

    const softFillLight = new THREE.DirectionalLight(0xfff5ea, 0.6);
    softFillLight.position.set(0, 20, 20);
    scene.add(softFillLight);

    // 1. Constellation / Network Particles (Representing Cecilian Alumni globally)
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const colorCrimson = new THREE.Color(0x991B1B);
    const colorGold = new THREE.Color(0xF59E0B);
    const colorWhite = new THREE.Color(0xFFFFFF);

    for (let i = 0; i < particleCount; i++) {
      // Distributed in spherical volume
      const r = 12 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      particlePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      particlePositions[i * 3 + 1] = (r * Math.sin(phi) * Math.sin(theta)) * 0.7;
      particlePositions[i * 3 + 2] = r * Math.cos(phi) - 5;

      const pick = Math.random();
      const c = pick < 0.45 ? colorCrimson : pick < 0.8 ? colorGold : colorWhite;
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 2. Elegant Geometric Armillary Rings (Ancient academic & navigational motif)
    const ringGroup = new THREE.Group();
    scene.add(ringGroup);

    const createTorusRing = (radius: number, tube: number, color: number, opacity: number) => {
      const geom = new THREE.TorusGeometry(radius, tube, 16, 100);
      const mat = new THREE.MeshStandardMaterial({
        color,
        metalness: 0.85,
        roughness: 0.25,
        transparent: true,
        opacity,
        wireframe: false
      });
      return new THREE.Mesh(geom, mat);
    };

    const ring1 = createTorusRing(8.5, 0.04, 0xD97706, 0.55);
    ring1.rotation.x = Math.PI / 3;
    ringGroup.add(ring1);

    const ring2 = createTorusRing(10.2, 0.035, 0x8B181B, 0.45);
    ring2.rotation.y = Math.PI / 4;
    ringGroup.add(ring2);

    const ring3 = createTorusRing(11.8, 0.03, 0xfff5ea, 0.35);
    ring3.rotation.x = -Math.PI / 6;
    ring3.rotation.z = Math.PI / 5;
    ringGroup.add(ring3);

    // 3. Central Wireframe Polyhedron (Virtus, Scientia, Charitas triad core)
    const coreGeom = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x991B1B,
      wireframe: true,
      transparent: true,
      opacity: 0.28,
      metalness: 0.9,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeom, coreMat);
    ringGroup.add(coreMesh);

    // Reposition group to top-right quadrant on wide screens
    ringGroup.position.set(7.5, 1.2, -2);

    // Mouse interaction parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;
      targetMouseX = (e.clientX - halfW) / halfW;
      targetMouseY = (e.clientY - halfH) / halfH;
    };

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      // Particle rotation & breathing
      particles.rotation.y = elapsed * 0.03 + mouseX * 0.2;
      particles.rotation.x = Math.sin(elapsed * 0.02) * 0.08 - mouseY * 0.15;

      // Armillary Rings rotation
      ring1.rotation.z = elapsed * 0.08;
      ring2.rotation.x = elapsed * 0.06;
      ring3.rotation.y = elapsed * 0.05;

      coreMesh.rotation.y = elapsed * 0.1;
      coreMesh.rotation.x = elapsed * 0.07;

      // Subtle parallax camera shift
      camera.position.x = mouseX * 1.5;
      camera.position.y = -mouseY * 1.2;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    // Resize listener
    const onResize = () => {
      if (!container) return;
      const newW = container.clientWidth || window.innerWidth;
      const newH = container.clientHeight || window.innerHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      // Adjust 3D group layout for mobile vs desktop
      if (newW < 768) {
        ringGroup.position.set(0, 2, -6);
        ringGroup.scale.set(0.65, 0.65, 0.65);
      } else {
        ringGroup.position.set(7.5, 1.2, -2);
        ringGroup.scale.set(1, 1, 1);
      }
    };

    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);

      if (renderer && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      coreGeom.dispose();
      coreMat.dispose();
    };
  }, [intensity]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
    />
  );
};
