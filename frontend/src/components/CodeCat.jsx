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
  const group = useRef();
  
  const headRef = useRef();
  const tailRef = useRef();
  const bodyRef = useRef();

  const [currentAction, setCurrentAction] = useState(null);
  const actionTimer = useRef(0);

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
      }
    }, 1500);

    return () => clearTimeout(timeout);
  }, [triggerAction]);

  useFrame((state, delta) => {
    if (!group.current) return;

    actionTimer.current += delta;
    const t = actionTimer.current;
    const time = state.clock.getElapsedTime();

    // IDLE
    if (!currentAction) {
      bodyRef.current.scale.y = 1 + Math.sin(time * 3) * 0.02;
      tailRef.current.rotation.z = Math.sin(time * 5) * 0.2;
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.1;
      headRef.current.rotation.z = Math.sin(time * 1) * 0.05;
    }

    // ACTIONS
    if (currentAction === 'JUMP') {
      group.current.position.y = Math.max(0, Math.sin(t * 5) * 3);
      group.current.rotation.x = -Math.sin(t * 5) * 6.28;
    }
    if (currentAction === 'SCREAM') {
      group.current.position.x = (Math.random() - 0.5) * 0.2;
      headRef.current.scale.set(1.2, 1.2, 1.2);
    }
    if (currentAction === 'SMILE') {
      group.current.position.y = Math.abs(Math.sin(t * 10)) * 0.5;
      headRef.current.rotation.z = Math.sin(t * 10) * 0.2;
    }
    if (currentAction === 'SCRATCH') {
      group.current.rotation.z = Math.sin(t * 20) * 0.1;
      group.current.position.x = Math.sin(t * 10) * 0.5;
    }
  });

  const color = MOOD_CONFIG[petState].color;
  const materialProps = { color: color, roughness: 0.6, metalness: 0.1 };
  const blackMat = { color: "black", roughness: 0.2, metalness: 0.5 };

  return (
    // ✅ No Position Offset here, let Stage handle it
    <group ref={group} {...props} dispose={null}>
      
      <group ref={bodyRef}>
          <RoundedBox args={[1, 1, 1.5]} radius={0.15} smoothness={4} position={[0, 0.5, 0]}>
              <meshStandardMaterial {...materialProps} />
          </RoundedBox>
          {[[-0.3, -0.2, 0.5], [0.3, -0.2, 0.5], [-0.3, -0.2, -0.5], [0.3, -0.2, -0.5]].map((pos, i) => (
              <RoundedBox key={i} args={[0.25, 0.6, 0.25]} radius={0.05} smoothness={4} position={pos}>
                  <meshStandardMaterial {...materialProps} />
              </RoundedBox>
          ))}
      </group>

      <group ref={headRef} position={[0, 1.2, 0.8]}>
          <RoundedBox args={[0.9, 0.8, 0.7]} radius={0.2} smoothness={4}>
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
          <RoundedBox args={[0.12, 0.12, 0.05]} radius={0.05} smoothness={4} position={[-0.2, 0.1, 0.36]}><meshStandardMaterial {...blackMat} /></RoundedBox>
          <RoundedBox args={[0.12, 0.12, 0.05]} radius={0.05} smoothness={4} position={[0.2, 0.1, 0.36]}><meshStandardMaterial {...blackMat} /></RoundedBox>
          <RoundedBox args={[0.1, 0.06, 0.05]} radius={0.02} smoothness={4} position={[0, -0.1, 0.36]}><meshStandardMaterial color="#fca5a5" /></RoundedBox>
          <RoundedBox args={[0.15, 0.04, 0.05]} radius={0.02} smoothness={4} position={[0, -0.2, 0.36]}><meshStandardMaterial {...blackMat} /></RoundedBox>
      </group>

      <group ref={tailRef} position={[0, 0.8, -0.8]}>
          <RoundedBox args={[0.18, 0.8, 0.18]} radius={0.09} smoothness={4} position={[0, 0.3, -0.2]} rotation={[0.5, 0, 0]}>
              <meshStandardMaterial {...materialProps} />
          </RoundedBox>
      </group>

    </group>
  );
}