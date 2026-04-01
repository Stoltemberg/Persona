import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';

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
    const particleCount = 150;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Textura de círculo suave (minimalista)
    const createCircleTexture = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
      return new THREE.CanvasTexture(canvas);
    };
    
    // Tema Persona: (gradientes de roxo/magenta/ciano sutil)
    // #f64f59(vermelho), #c471ed(roxo), #12c2e9(azul)
    const colorPalette = [
      new THREE.Color('#f64f59'),
      new THREE.Color('#c471ed'),
      new THREE.Color('#12c2e9')
    ];

    for (let i = 0; i < particleCount; i++) {
      // Posições espalhadas num raio AMPLO para cobrir monitores ultrawide
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

      // Cores misturadas
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Desenhando partículas redondas, muito sutis mas levemente maiores para visibilidade
    const material = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      map: createCircleTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    // TIMER & ANIMATION
    let animationId;
    let clock = new THREE.Clock(); 

    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const onDocumentMouseMove = (event) => {
      // Sensibilidade do mouse muito reduzida para evitar movimentos bruscos
      mouseX = (event.clientX - windowHalfX) * 0.01;
      mouseY = (event.clientY - windowHalfY) * 0.01;
    };
    
    document.addEventListener('mousemove', onDocumentMouseMove);

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      let delta = clock.getDelta();
      let elapsed = clock.getElapsedTime();

      // Rotação suave constante
      particles.rotation.y += delta * 0.05;
      particles.rotation.x += delta * 0.02;

      // Movimentação absurdamente sutil com o mouse (parallax amortecido)
      targetX = mouseX * 0.02;
      targetY = mouseY * 0.02;

      particles.rotation.z += 0.01 * (targetX - particles.rotation.z);
      camera.position.x += (targetX * 0.5 - camera.position.x) * 0.01;
      camera.position.y += (-targetY * 0.5 - camera.position.y) * 0.01;
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

  return createPortal(
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // fica por trás do app
        pointerEvents: 'none', // ignore mouse clicks/hovers para a UI embaixo
        opacity: 0.8 // opacidade base
      }}
    />,
    document.body
  );
}
