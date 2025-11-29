import React, { useRef, useState, useEffect } from 'react';
// Removed 'Html' import as it's no longer needed
import { useGLTF, useAnimations } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ⚠️ Ensure 'cat_model.glb' is in 'frontend/public'
const MODEL_PATH = '/cat_model.glb';

const MOOD_CONFIG = {
  // Removed emoji definitions
  0: { color: '#e2e8f0', name: 'Neutral' }, 
  1: { color: '#4ade80', name: 'Happy' },     
  2: { color: '#60a5fa', name: 'Sleepy' },    
  3: { color: '#f87171', name: 'Stressed' },  
  4: { color: '#facc15', name: 'Growing' },   
};

export default function RealCat({ petState = 0, ...props }) {
  const group = useRef();
  // 1. Load Scene Universally
  const { scene, animations } = useGLTF(MODEL_PATH);
  const { actions } = useAnimations(animations, group);
  const [isJumping, setIsJumping] = useState(false);

  // 2. SMART ANIMATION HANDLER
  useEffect(() => {
    if (!actions || Object.keys(actions).length === 0) return;
    
    const firstAnimName = Object.keys(actions)[0];
    const idleAnim = actions['Idle'] || actions[firstAnimName];
    
    if (idleAnim) {
      idleAnim.reset().fadeIn(0.5).play();
    }
    
    return () => {
      if (actions) {
        Object.values(actions).forEach((action) => {
          if (action && typeof action.stop === 'function') {
            action.stop();
          }
        });
      }
    };
  }, [actions]);

  // 3. TEXTURE-SAFE COLOR TINTING (The Glow Fix)
  useFrame(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh && child.material) {
          const targetColor = new THREE.Color(MOOD_CONFIG[petState].color);

          // SMART TINTING:
          // We modify the 'emissive' property to make the cat GLOW with the color.
          // This sits *on top* of any existing texture, preserving details.
          if (child.material.emissive) {
             // Smoothly transition the glow color
             child.material.emissive.lerp(targetColor, 0.05);
             // Set a low intensity so it doesn't look like a lightbulb
             child.material.emissiveIntensity = 0.25; 
          } else {
             // Fallback for simple materials that don't support emissive light.
             // This might still look plain if the model has no texture.
             child.material.color.lerp(targetColor, 0.05);
          }
        }
      });
    }
  });

  // 4. INTERACTION (Jump)
  const handleClick = (e) => {
    e.stopPropagation();
    if (isJumping || !actions) return;
    setIsJumping(true);

    const firstAnimName = Object.keys(actions)[0];
    const jumpAnim = actions['Jump'] || actions['Walk'] || actions[firstAnimName]; 
    const idleAnim = actions['Idle'] || actions[firstAnimName];

    if (jumpAnim && jumpAnim !== idleAnim) {
      idleAnim.fadeOut(0.2);
      jumpAnim.reset().fadeIn(0.2).play();
      jumpAnim.setLoop(THREE.LoopOnce);
      jumpAnim.clampWhenFinished = true;

      jumpAnim.getMixer().addEventListener('finished', (e) => {
        if (e.action === jumpAnim) {
          jumpAnim.fadeOut(0.5);
          idleAnim.reset().fadeIn(0.5).play();
          setIsJumping(false);
        }
      });
    } else {
      setIsJumping(false);
    }
  };

  return (
    <group ref={group} {...props} dispose={null} onClick={handleClick}>
      <primitive object={scene} />
      {/* The <Html> block with the emoji is removed */}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);