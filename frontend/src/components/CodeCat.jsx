import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei'; 
import * as THREE from 'three';

const MOOD_CONFIG = {
  0: { color: '#e2e8f0' }, // Neutral
  1: { color: '#4ade80' }, // Happy
  2: { color: '#60a5fa' }, // Sleepy
  3: { color: '#f87171' }, // Angry
  4: { color: '#facc15' }, // Growing
};

export default function CodeCat({ petState = 0, triggerAction, ...props }) {
  useEffect(() => {
    console.debug('[CodeCat] mounted petState=', petState);
    return () => console.debug('[CodeCat] unmounted');
  }, [petState]);
  const group = useRef();
  
  const headRef = useRef();
  const tailRef = useRef();
  const bodyRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const mouthRef = useRef();
  const browLeftRef = useRef();
  const browRightRef = useRef();

  const [currentAction, setCurrentAction] = useState(null);
  const actionTimer = useRef(0);
  const pinchStartDist = useRef(null);
  const pinchTriggered = useRef(false);

  useEffect(() => {
    if (!triggerAction) return;
    setCurrentAction(triggerAction);
    actionTimer.current = 0;

    const timeout = setTimeout(() => {
      setCurrentAction(null);
      if (group.current) {
        group.current.position.y = 0;
        group.current.rotation.set(0, 0, 0);
        group.current.scale.set(1, 1, 1);
        group.current.position.z = 0;
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [triggerAction]);

  // Ensure root group has a sensible scale and position at mount
  useEffect(() => {
    if (group.current) {
      group.current.scale.set(1, 1, 1);
      group.current.position.set(0, 0, 0);
      console.debug('[CodeCat] group initial position', group.current.position, 'scale', group.current.scale);
    }
  }, []);

  // INTERNAL ACTION HELPER (used by pointer handlers / pinch)
  const applyLocalAction = (actionName) => {
    if (!actionName) return;
    setCurrentAction(actionName);
    actionTimer.current = 0;

    // Reset after 1.6s
    setTimeout(() => {
      setCurrentAction(null);
      if (group.current) {
        group.current.position.y = 0;
        group.current.rotation.set(0, 0, 0);
        group.current.scale.set(1, 1, 1);
        group.current.position.z = 0;
      }
    }, 1600);
  };

  useFrame((state, delta) => {
    if (!group.current) return;

    actionTimer.current += delta;
    const t = actionTimer.current;
    const time = state.clock.getElapsedTime();

    // IDLE
    if (!currentAction) {
      if (bodyRef.current) bodyRef.current.scale.y = 1 + Math.sin(time * 3) * 0.02;
      if (tailRef.current) tailRef.current.rotation.z = Math.sin(time * 5) * 0.2;
      if (headRef.current) headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      if (headRef.current) headRef.current.rotation.z = Math.sin(time * 1) * 0.05;
    }

    // ACTIONS
    if (currentAction === 'JUMP') {
      group.current.position.y = Math.max(0, Math.sin(t * 5) * 3);
      group.current.rotation.x = -Math.sin(t * 5) * 6.28;
    }
    if (currentAction === 'SCREAM') {
      if (group.current) group.current.position.x = (Math.random() - 0.5) * 0.2;
      if (headRef.current) headRef.current.scale.set(1.2, 1.2, 1.2);
    }
    if (currentAction === 'SMILE') {
      if (group.current) group.current.position.y = Math.abs(Math.sin(t * 10)) * 0.5;
      if (headRef.current) headRef.current.rotation.z = Math.sin(t * 10) * 0.2;
    }
    if (currentAction === 'SCRATCH') {
      if (group.current) group.current.rotation.z = Math.sin(t * 20) * 0.1;
      if (group.current) group.current.position.x = Math.sin(t * 10) * 0.5;
    }
  });

  // Debug: periodically print group world position & presence
  const lastLogRef = useRef(0);
  useFrame((state, delta) => {
    if (!group.current) return;
    // always ensure visible
    group.current.visible = true;
    const now = state.clock.getElapsedTime();
    if (now - lastLogRef.current > 2.0) {
      lastLogRef.current = now;
      // world position
      const worldPos = new THREE.Vector3();
      group.current.getWorldPosition(worldPos);
      const worldScale = new THREE.Vector3();
      group.current.getWorldScale(worldScale);
      const childrenCount = group.current.children.length;
      console.debug('[CodeCat debug] worldPos', worldPos.toArray(), 'scale', worldScale.toArray(), 'children', childrenCount);
      // if no children exist, print warning
      if (childrenCount === 0) console.warn('[CodeCat] no children found in group');
    }
  });

  // EXPRESSIONS (smooth transitions)
  useFrame((state, delta) => {
    // Determine base expression by petState
    const base = petState || 0;

    // Define targets for each mood
    const targets = {
      0: { // Neutral
        eyeScale: [1, 1], eyeY: 0.1, mouthScale: [1, 1], mouthY: -0.2, browRot: [0, 0]
      },
      1: { // Happy - wide eyes, smiling mouth
        eyeScale: [1.1, 1.1], eyeY: 0.08, mouthScale: [1.2, 0.6], mouthY: -0.12, browRot: [0.05, -0.05]
      },
      2: { // Sleepy - slanted, narrow eyes, small mouth
        eyeScale: [1.2, 0.2], eyeY: 0.0, mouthScale: [0.9, 0.6], mouthY: -0.18, browRot: [-0.05, 0.05]
      },
      3: { // Angry/Storm - narrow eyes, brows down and inward, frowning mouth
        eyeScale: [0.8, 0.6], eyeY: 0.12, mouthScale: [1, 0.4], mouthY: -0.28, browRot: [-0.35, 0.35]
      },
      4: { // Grow/Excited - bright eyes, open mouth
        eyeScale: [1.3, 1.3], eyeY: 0.12, mouthScale: [1.3, 1.1], mouthY: -0.12, browRot: [0.15, -0.15]
      }
    };

    let target = targets[base] || targets[0];

    // Override with action expressions for transient actions
    if (currentAction === 'SMILE') {
      target = { ...target, mouthScale: [1.5, 0.6], mouthY: -0.08, eyeScale: [1.2, 1.2] };
    }
    if (currentAction === 'SCREAM') {
      target = { ...target, mouthScale: [1.6, 1.6], mouthY: -0.02, eyeScale: [0.6, 0.6] };
    }
    if (currentAction === 'JUMP') {
      // Slight excited face when jumping
      target = { ...target, mouthScale: [1.1, 0.8], mouthY: -0.12, eyeScale: [1.05, 1.05] };
    }

    // Smoothly interpolate values
    const lerp = (a, b, t) => a + (b - a) * Math.min(1, t * 6);

    if (leftEyeRef.current) {
      leftEyeRef.current.scale.y = lerp(leftEyeRef.current.scale.y || 1, target.eyeScale[1], delta);
      leftEyeRef.current.scale.x = lerp(leftEyeRef.current.scale.x || 1, target.eyeScale[0], delta);
      leftEyeRef.current.position.y = lerp(leftEyeRef.current.position.y || 0.1, target.eyeY, delta);
    }
    if (rightEyeRef.current) {
      rightEyeRef.current.scale.y = lerp(rightEyeRef.current.scale.y || 1, target.eyeScale[1], delta);
      rightEyeRef.current.scale.x = lerp(rightEyeRef.current.scale.x || 1, target.eyeScale[0], delta);
      rightEyeRef.current.position.y = lerp(rightEyeRef.current.position.y || 0.1, target.eyeY, delta);
    }
    if (mouthRef.current) {
      mouthRef.current.scale.x = lerp(mouthRef.current.scale.x || 1, target.mouthScale[0], delta);
      mouthRef.current.scale.y = lerp(mouthRef.current.scale.y || 1, target.mouthScale[1], delta);
      mouthRef.current.position.y = lerp(mouthRef.current.position.y || -0.2, target.mouthY, delta);
      // Tilt mouth for angry vs happy
      mouthRef.current.rotation.x = lerp(mouthRef.current.rotation.x || 0, (base === 3 ? 0.35 : (base === 1 ? -0.2 : 0)), delta);
    }
    if (browLeftRef.current) {
      browLeftRef.current.rotation.z = lerp(browLeftRef.current.rotation.z || 0, target.browRot[0], delta);
    }
    if (browRightRef.current) {
      browRightRef.current.rotation.z = lerp(browRightRef.current.rotation.z || 0, target.browRot[1], delta);
    }

    // small blink for sleepy mood
    if (petState === 2 && leftEyeRef.current && rightEyeRef.current) {
      const blink = Math.sin(state.clock.getElapsedTime() * 1.3) * 0.5 + 0.5; // [0,1]
      const closeness = 0.2 + 0.8 * (1 - blink);
      leftEyeRef.current.scale.y *= 1 - closeness * 0.4;
      rightEyeRef.current.scale.y *= 1 - closeness * 0.4;
    }
  });

  // Add touch gesture detection (pinch to 'SCRATCH' or come closer)
  useEffect(() => {
    const getDist = (t0, t1) => Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

    const onTouchStart = (e) => {
      if (e.touches.length >= 2) {
        pinchStartDist.current = getDist(e.touches[0], e.touches[1]);
        pinchTriggered.current = false;
      }
    };

    const onTouchMove = (e) => {
      if (e.touches.length >= 2 && pinchStartDist.current && !pinchTriggered.current) {
        const d = getDist(e.touches[0], e.touches[1]);
        // If fingers come together by 25% or more -> pinch in
        if (d < pinchStartDist.current * 0.75) {
          // Trigger scratch and move the cat closer to camera
          pinchTriggered.current = true;
          applyLocalAction('SCRATCH');
          // Move cat forward slightly to appear to come to the user
            if (group.current) {
            // Move slightly toward the camera by increasing z (camera is at z ~ +8)
            group.current.position.z = Math.min(2, (group.current.position.z || 0) + 0.5);
            // Slight scale up
            group.current.scale.set(1.12, 1.12, 1.12);
            setTimeout(() => {
              if (group.current) {
                group.current.position.z = 0;
                group.current.scale.set(1, 1, 1);
              }
            }, 1500);
          }
        }
      }
    };

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) {
        pinchStartDist.current = null;
        pinchTriggered.current = false;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const color = MOOD_CONFIG[petState].color;
  const materialProps = { color: color, roughness: 0.6, metalness: 0.1, emissive: color, emissiveIntensity: 0.06 };
  const blackMat = { color: "black", roughness: 0.2, metalness: 0.5 };

  // const axes helper removed (debug)

  return (
    // ✅ No Position Offset here, let Stage handle it
    <group ref={group} position={[0,0,0]} scale={[1.5, 1.5, 1.5]} visible={true} {...props} dispose={null}>
      {/* DEBUG: a small mesh at origin to ensure the scene and camera render things */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="magenta" metalness={0.1} roughness={0.2} emissive={'magenta'} emissiveIntensity={5} />
      </mesh>
      {/* camera-facing cube removed (debug) */}
      
      <group ref={bodyRef}>
          <RoundedBox frustumCulled={false} args={[1, 1, 1.5]} radius={0.15} smoothness={4} position={[0, 0.5, 0]} 
            castShadow receiveShadow
               onPointerDown={(e) => {
                 e.stopPropagation();
                 applyLocalAction('SMILE');
               }}
          >
              <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          {[[-0.3, -0.2, 0.5], [0.3, -0.2, 0.5], [-0.3, -0.2, -0.5], [0.3, -0.2, -0.5]].map((pos, i) => (
              <RoundedBox key={i} args={[0.25, 0.6, 0.25]} radius={0.05} smoothness={4} position={pos} frustumCulled={false}>
                  <meshStandardMaterial {...materialProps} />
              </RoundedBox>
          ))}
      </group>

      {/* We previously added a large sphere to darken the scene during storm, but it occluded everything — remove it to keep background visible. */}

      <group ref={headRef} position={[0, 1.2, 0.8]}
           // Head-specific pointer handler
           onPointerDown={(e) => {
             e.stopPropagation();
             // Head tap -> jump
             applyLocalAction('JUMP');
           }}
      >
            <RoundedBox frustumCulled={false} args={[0.9, 0.8, 0.7]} radius={0.2} smoothness={4} castShadow receiveShadow>
              <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          {/* Ears */}
          <mesh position={[-0.3, 0.5, 0]} rotation={[0, 0, 0.2]}>
              <coneGeometry args={[0.15, 0.4, 4]} />
              <meshStandardMaterial {...materialProps} />
          </mesh>
          <mesh position={[0.3, 0.5, 0]} rotation={[0, 0, -0.2]}>
              <coneGeometry args={[0.15, 0.4, 4]} />
              <meshStandardMaterial {...materialProps} />
          </mesh>
          {/* Face Details */}
          <group name="leftEye" ref={leftEyeRef} position={[-0.2, 0.1, 0.36]}>
            <RoundedBox args={[0.12, 0.12, 0.05]} radius={0.05} smoothness={4}><meshStandardMaterial {...blackMat} /></RoundedBox>
          </group>
          <group name="rightEye" ref={rightEyeRef} position={[0.2, 0.1, 0.36]}>
            <RoundedBox args={[0.12, 0.12, 0.05]} radius={0.05} smoothness={4}><meshStandardMaterial {...blackMat} /></RoundedBox>
          </group>
          <group name="nose" position={[0, -0.1, 0.36]}> <RoundedBox args={[0.1, 0.06, 0.05]} radius={0.02} smoothness={4}><meshStandardMaterial color="#fca5a5" /></RoundedBox></group>
          <group name="mouth" ref={mouthRef} position={[0, -0.2, 0.36]}> <RoundedBox args={[0.15, 0.04, 0.05]} radius={0.02} smoothness={4}><meshStandardMaterial {...blackMat} /></RoundedBox></group>
          {/* Eyebrows */}
          <group ref={browLeftRef} position={[-0.2, 0.28, 0.36]}>
            <RoundedBox args={[0.18, 0.04, 0.04]} radius={0.02} smoothness={4}><meshStandardMaterial {...blackMat} /></RoundedBox>
          </group>
          <group ref={browRightRef} position={[0.2, 0.28, 0.36]}>
            <RoundedBox args={[0.18, 0.04, 0.04]} radius={0.02} smoothness={4}><meshStandardMaterial {...blackMat} /></RoundedBox>
          </group>
      </group>

      <group ref={tailRef} position={[0, 0.8, -0.8]}
           // body/tail pointer handler: general pet touch
           onPointerDown={(e) => {
             e.stopPropagation();
             // Distinguish pointer type if needed (touch vs mouse)
             applyLocalAction('SMILE');
           }}
      >
          <RoundedBox args={[0.18, 0.8, 0.18]} radius={0.09} smoothness={4} position={[0, 0.3, -0.2]} rotation={[0.5, 0, 0]}>
              <meshStandardMaterial {...materialProps} />
          </RoundedBox>
      </group>
      {/* Debug HTML overlay removed */}

    </group>
  );
}