import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Timer } from 'three/examples/jsm/misc/Timer.js'; // Fallback se new THREE.Timer() não estiver diretamente em THREE

export function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const root = mountRef.current;
    if (!root) return;

    // SCENE
    const scene = new THREE.Scene();

    // CAMERA
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    root.appendChild(renderer.domElement);

    // PARTICLES / ORBS
    const particleCount = 100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    // Tema Persona: (gradientes de roxo/magenta/ciano sutil)
    // #f64f59(vermelho), #c471ed(roxo), #12c2e9(azul)
    const colorPalette = [
      new THREE.Color('#f64f59'),
      new THREE.Color('#c471ed'),
      new THREE.Color('#12c2e9')
    ];

    for (let i = 0; i < particleCount; i++) {
      // Posições espalhadas num raio amplo
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

      // Cores misturadas
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Desenhando partículas redondas e brilhantes
    const material = new THREE.PointsMaterial({
      size: 0.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // TIMER & ANIMATION
    // Dependendo da versão do three (r183+ recomendou THREE.Timer)
    // Se o Timer padrão não estivar disponível, importamos de addons. Mas THREE.Clock serve como fallback se necessário.
    let animationId;
    let clock = new THREE.Clock(); // Defaulting to clock just in case THREE.Timer isn't globally exposed
    // Try to safely instantiate timer if available:
    const timer = typeof Timer !== 'undefined' ? new Timer() : null;

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      mouseX = (event.clientX - windowHalfX) * 0.05;
      mouseY = (event.clientY - windowHalfY) * 0.05;
    };
    
    document.addEventListener('mousemove', onDocumentMouseMove);

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      let delta = 0;
      let elapsed = 0;
      
      if (timer) {
        timer.update();
        delta = timer.getDelta();
        elapsed = timer.getElapsed();
      } else {
        delta = clock.getDelta();
        elapsed = clock.getElapsedTime();
      }

      // Rotação suave constante
      particles.rotation.y += delta * 0.05;
      particles.rotation.x += delta * 0.02;

      // Movimentação sutil com o mouse (parallax/damping)
      targetX = mouseX * 0.05;
      targetY = mouseY * 0.05;

      particles.rotation.z += 0.05 * (targetX - particles.rotation.z);
      camera.position.x += (targetX * 0.5 - camera.position.x) * 0.02;
      camera.position.y += (-targetY * 0.5 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };
    animate();

    // RESIZE
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // CLEANUP
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousemove', onDocumentMouseMove);
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      root.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1, // fica por trás do app
        pointerEvents: 'none', // ignore mouse clicks/hovers para a UI embaixo
        opacity: 0.8 // opacidade base
      }}
    />
  );
}
