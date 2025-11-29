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

  // 4. INTERACTION (Jump & head detection)
  const handleClick = (e) => {
    e.stopPropagation();
    if (isJumping || !actions) return;

    // If the clicked object is the head (name contains 'Head' or 'head'), prioritize jump animation
    const clickedName = e.object?.name || '';
    const isHead = /head/i.test(clickedName);
    setIsJumping(true);

    const firstAnimName = Object.keys(actions)[0];
    const jumpAnim = actions['Jump'] || actions['Walk'] || actions[firstAnimName]; 
    const idleAnim = actions['Idle'] || actions[firstAnimName];

    const playAction = (anim) => {
      if (!anim || anim === idleAnim) return;
      idleAnim.fadeOut(0.2);
      anim.reset().fadeIn(0.2).play();
      anim.setLoop(THREE.LoopOnce);
      anim.clampWhenFinished = true;

      anim.getMixer().addEventListener('finished', (evt) => {
        if (evt.action === anim) {
          anim.fadeOut(0.5);
          idleAnim.reset().fadeIn(0.5).play();
          setIsJumping(false);
        }
      });
    };

    if (isHead) {
      playAction(jumpAnim);
      return;
    }

    // Otherwise, play a random reaction (try 'Happy' or the available action set)
    const preferred = ['Happy', 'Purr', 'Jump', 'Walk'];
    let picked = null;
    for (const name of preferred) {
      if (actions[name]) { picked = actions[name]; break; }
    }
    if (!picked) picked = actions[firstAnimName];
    playAction(picked);
  };

  // (Bonus) pinch detection for RealCat to make it SCRATCH or zoom toward camera (similar to CodeCat)
  useEffect(() => {
    let pinchStartDist = null;
    let pinchTriggeredLocal = false;
    const getDist = (t0, t1) => Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
    const onTouchStart = (ev) => {
      if (ev.touches.length >= 2) { pinchStartDist = getDist(ev.touches[0], ev.touches[1]); pinchTriggeredLocal = false; }
    };
    const onTouchMove = (ev) => {
      if (ev.touches.length >= 2 && pinchStartDist && !pinchTriggeredLocal) {
        const d = getDist(ev.touches[0], ev.touches[1]);
        if (d < pinchStartDist * 0.75) {
          pinchTriggeredLocal = true;
          // Similar to CodeCat, trigger a SCRATCH animation if available
          const scratchAnim = actions['Scratch'] || actions['Scratching'] || actions['Purr'] || actions[firstAnimName];
          if (scratchAnim) {
            // play once
            const idleAnim = actions['Idle'] || actions[firstAnimName];
            idleAnim.fadeOut(0.2);
            scratchAnim.reset().fadeIn(0.2).play();
            scratchAnim.setLoop(THREE.LoopOnce);
            scratchAnim.clampWhenFinished = true;
            scratchAnim.getMixer().addEventListener('finished', (evt) => {
              if (evt.action === scratchAnim) {
                scratchAnim.fadeOut(0.5);
                idleAnim.reset().fadeIn(0.5).play();
                setIsJumping(false);
              }
            });
          }
        }
      }
    };
    const onTouchEnd = (ev) => { if (ev.touches.length < 2) pinchStartDist = null; pinchTriggeredLocal = false; };
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd); };
  }, [actions]);

  return (
    <group ref={group} {...props} dispose={null} onClick={handleClick}>
      <primitive object={scene} />
      {/* The <Html> block with the emoji is removed */}
    </group>
  );
}

useGLTF.preload(MODEL_PATH);