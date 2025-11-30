import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PET_STATES } from '../utils/constants';

export default function WeatherVFX({ petState }) {
  // Rain instanced mesh
  const rainRef = useRef();
  const rainCount = 600;
  const speeds = useRef(new Float32Array(rainCount));

  const rainGeo = useMemo(() => new THREE.BoxGeometry(0.02, 0.6, 0.02), []);
  const rainMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#cfe7ff', transparent: true, opacity: 0.85 }), []);

  useEffect(() => {
    if (!rainRef.current) return;

    const mesh = rainRef.current;
    const tmp = new THREE.Object3D();

    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 12;
      const y = Math.random() * 10 + 2;
      const z = (Math.random() - 0.5) * 6;
      tmp.position.set(x, y, z);
      tmp.rotation.set(0, 0, 0);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
      speeds.current[i] = 2 + Math.random() * 6;
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [rainRef]);

  useFrame((state, delta) => {
    if (!rainRef.current) return;
    if (petState !== PET_STATES.STORM) return;

    const mesh = rainRef.current;
    const tmp = new THREE.Object3D();

    for (let i = 0; i < rainCount; i++) {
      mesh.getMatrixAt(i, tmp.matrix);
      tmp.position.setFromMatrixPosition(tmp.matrix);
      tmp.position.y -= speeds.current[i] * delta;
      if (tmp.position.y < -3) {
        tmp.position.y = 12 + Math.random() * 4;
        tmp.position.x = (Math.random() - 0.5) * 12;
        tmp.position.z = (Math.random() - 0.5) * 6;
      }
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
  });

  // Lightning (directional light intensity flicker)
  const lightningRef = useRef();
  useEffect(() => {
    let timeout;
    function strike() {
      if (!lightningRef.current) return;
      // random chance to strike only during storm
      if (petState !== PET_STATES.STORM) {
        timeout = setTimeout(strike, 1200 + Math.random() * 4000);
        return;
      }
      const light = lightningRef.current;
      const original = light.intensity;
      light.intensity = 5.5 + Math.random() * 4.0;
      setTimeout(() => { light.intensity = original; }, 120 + Math.random() * 300);
      // quick multiple flickers
      if (Math.random() > 0.65) {
        setTimeout(() => { light.intensity = 6 + Math.random() * 6; }, 200);
        setTimeout(() => { light.intensity = original; }, 300 + Math.random() * 200);
      }
      timeout = setTimeout(strike, 2000 + Math.random() * 5000);
    }
    timeout = setTimeout(strike, 2000 + Math.random() * 3000);
    return () => clearTimeout(timeout);
  }, [petState]);

  // Sparkles/Grow particles
  const sparkRef = useRef();
  const sparkleCount = 80;
  useEffect(() => {
    if (!sparkRef.current) return;
    const mesh = sparkRef.current;
    const tmp = new THREE.Object3D();
    for (let i = 0; i < sparkleCount; i++) {
      const x = (Math.random() - 0.5) * 2.5;
      const y = Math.random() * 1.5 + 0.7;
      const z = (Math.random() - 0.5) * 2.5;
      tmp.position.set(x, y, z);
      tmp.scale.setScalar(0.05 + Math.random() * 0.1);
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [sparkRef]);

  useFrame((state, delta) => {
    if (!sparkRef.current) return;
    if (petState !== PET_STATES.GROW && petState !== PET_STATES.DANCE) return;
    const mesh = sparkRef.current;
    const tmp = new THREE.Object3D();
    for (let i = 0; i < sparkleCount; i++) {
      mesh.getMatrixAt(i, tmp.matrix);
      tmp.position.setFromMatrixPosition(tmp.matrix);
      tmp.position.y += Math.sin(state.clock.getElapsedTime() * 2 + i) * 0.005 + delta * 0.03;
      tmp.updateMatrix();
      mesh.setMatrixAt(i, tmp.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Lightning directional light */}
      <directionalLight ref={lightningRef} intensity={0} position={[10, 10, 10]} color={'#ffffff'} castShadow={false} />

      {/* Rain */}
      <instancedMesh ref={rainRef} args={[rainGeo, rainMat, rainCount]} position={[0, 0, 0]} visible={petState === PET_STATES.STORM} />

      {/* Sparkles */}
      <instancedMesh ref={sparkRef} args={[new THREE.SphereGeometry(0.06, 6, 6), new THREE.MeshStandardMaterial({ color: '#fff8c8', emissive: '#ffd98f', emissiveIntensity: 0.85, transparent: true, opacity: 0.95 }), sparkleCount]} position={[0, 0, 0]} visible={petState === PET_STATES.GROW || petState === PET_STATES.DANCE} />
    </group>
  );
}
