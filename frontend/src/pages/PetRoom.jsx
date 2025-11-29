import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import PrivacyLoader from "../components/PrivacyLoader";
import { ArrowLeft, Cookie, HandHeart, ArrowUp, Zap, MessageCircleWarning } from "lucide-react"; 
import MoodBackground from "../components/MoodBackground";
import WeatherVFX from "../components/WeatherVFX";
import { motion } from 'framer-motion';

// 3D Imports
import { Canvas } from "@react-three/fiber";
import { PET_STATES } from '../utils/constants';
import { OrbitControls, Stage, Environment } from "@react-three/drei";

// ✅ FIX: Commented out RealCat, using CodeCat instead
// import RealCat from "../components/RealCat";
import CodeCat from "../components/CodeCat"; 

export default function PetRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { relationships, simulatePartnerInteraction, setMood } = useAppStore();
  
  const relationship = relationships.find(r => r.id === id);
  const [input, setInput] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  // 1. STATE FOR PROCEDURAL ACTIONS
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    if (!relationship) navigate("/dashboard");
  }, [relationship, navigate]);

  if (!relationship) return null;

  const detectMoodFromInput = (text) => {
    if (!text) return null;
    const t = text.toLowerCase();
    if (/(angry|mad|furious|irritat|pissed|annoyed)/.test(t)) return 3; // STORM
    if (/(happy|joy|lov|glad|cheer|smile)/.test(t)) return 1; // DANCE
    if (/(tired|sleepy|exhaust|rest)/.test(t)) return 2; // SLEEPY
    if (/(grow|better|improve|thrive)/.test(t)) return 4; // GROW
    return 0; // NEUTRAL
  };

  const handleVent = async () => {
    if (!input) return;
    setIsEncrypting(true);
    await new Promise(r => setTimeout(r, 2000));
    // If the user typed a clear mood, set it explicitly; otherwise simulate random interaction
    const mood = detectMoodFromInput(input);
    if (mood !== null) {
      setMood(relationship.id, mood);
    } else {
      simulatePartnerInteraction(relationship.id);
    }
    setInput("");
    setIsEncrypting(false);
  };

  // 2. TRIGGER HELPER
  const trigger = (actionName) => {
    if (currentAction) return;
    console.log("Triggering:", actionName);
    setCurrentAction(actionName);
    setTimeout(() => {
      setCurrentAction(null);
    }, 2000);
  };

  return (
    <div className="h-screen w-screen flex flex-col text-white relative overflow-hidden">{/* removed bg-slate-950 so mood CSS shows through */}
      
      {/* Mood background is dynamically controlled via petState */}
      <MoodBackground petState={relationship.petState} />
      
      {isEncrypting && <PrivacyLoader />}

      <motion.nav initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45 }} className="p-6 flex items-center justify-between z-20 relative pointer-events-none">
        <div className="pointer-events-auto">
            <button onClick={() => navigate("/dashboard")} className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-full transition-colors border border-slate-800">
            <ArrowLeft className="text-slate-400" size={20} />
            </button>
        </div>
        <div className="text-center">
          <h1 className="font-bold text-xl tracking-tight drop-shadow-md">{relationship.petName}</h1>
          <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase drop-shadow-md">Secured by Midnight</p>
          <p className="text-[11px] text-slate-300 mt-1">Mood: <span className="font-bold text-white">{['Neutral','Happy','Sleepy','Storm','Grow'][relationship.petState]}</span></p>
        </div>
        <div className="w-10" />
      </motion.nav>

      {/* --- 3D SCENE --- */}
        <div className="absolute inset-0 z-10"> {/* Canvas wrapper is higher than mood background */}
        <Canvas
          shadows
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => { gl.setClearColor('#000000', 0); }}
          style={{ background: 'transparent' }}
        >
           <ambientLight intensity={1} />
           <ambientLight intensity={relationship.petState === PET_STATES.STORM ? 0.25 : 1} />
           <Environment preset="city" background={false} />
           {/* Add fog for storm effect to the 3D scene so the cat appears darker without occluding background */}
           {relationship.petState === PET_STATES.STORM && (
             <fog attach="fog" args={[ '#020617', 4, 24 ]} />
           )}
           
             {/* Custom lighting setup instead of Stage to avoid a large ground/contact shadow plane */}
           <group position={[0, 0, 0]}
                  dispose={null}>
             {/* Fill light */}
             <hemisphereLight intensity={0.6} groundColor="#020617" />
             {/* Key/Directional light */}
             <directionalLight intensity={1.0} position={[5, 10, 5]} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
             {/* Subtle rim/back light */}
             <directionalLight intensity={0.35} position={[-5, 3, -5]} />
             {/* Add a subtle, non-occluding floor with low opacity to catch local shadows if needed */}
             <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow={true}>
               <planeGeometry args={[40, 40]} />
               <meshStandardMaterial color="#01030f" opacity={0.0} transparent />
             </mesh>

             {/* Weather VFX - rain, lightning, sparkles */}
             <WeatherVFX petState={relationship.petState} />

             {/* Using CodeCat component */}
             <CodeCat 
               petState={relationship.petState} 
               triggerAction={currentAction}
             />
           </group>
           
           <OrbitControls makeDefault enableZoom={true} minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

      {/* --- UI OVERLAY --- */}
        <div className="absolute bottom-0 left-0 w-full flex flex-col items-center pointer-events-none z-20 pb-10 px-4">
            {/* Interaction hints for users */}
            <div className="pointer-events-none mb-3 text-[11px] text-slate-400 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
              <span className="mr-3">Tap head → Jump</span>
              <span className="mr-3">Tap body → Pet</span>
              <span>Pinch (two-finger) → Scratch & come closer</span>
            </div>
            
            {/* ACTION BAR */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.45, delay: 0.05 }} className="pointer-events-auto flex items-center gap-3 p-3 bg-slate-900/80 rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl mb-6 scale-90 md:scale-100 transition-transform">
                 
                 <button onClick={() => trigger('SMILE')} className="p-4 bg-slate-800 hover:bg-emerald-500 hover:text-white text-emerald-500 rounded-xl transition-all active:scale-90 group relative" title="Smile">
                    <HandHeart size={24} />
                </button>

                 <button onClick={() => trigger('JUMP')} className="p-4 bg-slate-800 hover:bg-blue-500 hover:text-white text-blue-500 rounded-xl transition-all active:scale-90 group relative" title="Jump">
                    <ArrowUp size={24} />
                </button>

                <button onClick={() => trigger('SCRATCH')} className="p-4 bg-slate-800 hover:bg-amber-500 hover:text-white text-amber-500 rounded-xl transition-all active:scale-90 group relative" title="Scratch">
                    <Zap size={24} />
                </button>

                <button onClick={() => trigger('SCREAM')} className="p-4 bg-slate-800 hover:bg-red-500 hover:text-white text-red-500 rounded-xl transition-all active:scale-90 group relative" title="Scream">
                    <MessageCircleWarning size={24} />
                </button>

                {/* Quick mood toggle buttons - sets mood explicitly for both partners */}
                <button onClick={() => setMood(relationship.id, 3)} className="p-2 ml-2 bg-red-700/70 hover:bg-red-600 rounded-full text-white text-xs">Set Angry</button>
                <button onClick={() => setMood(relationship.id, 1)} className="p-2 ml-2 bg-emerald-500/80 hover:bg-emerald-400 rounded-full text-white text-xs">Set Happy</button>
                <button onClick={() => setMood(relationship.id, 2)} className="p-2 ml-2 bg-blue-500/80 hover:bg-blue-400 rounded-full text-white text-xs">Set Sleepy</button>
                <button onClick={() => setMood(relationship.id, 4)} className="p-2 ml-2 bg-amber-500/80 hover:bg-amber-400 rounded-full text-white text-xs">Set Grow</button>
            </motion.div>

            {/* Input Area */}
            <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="pointer-events-auto w-full max-w-lg">
                <div className="bg-slate-900/90 backdrop-blur-xl p-2 rounded-[2rem] border border-slate-700 shadow-2xl">
                   <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`How do you feel about ${relationship.partnerName}?`}
                    className="w-full bg-transparent text-white resize-none outline-none h-12 p-4 placeholder-slate-400 text-sm"
                  />
                  <div className="flex justify-between items-center px-4 pb-2">
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/> ZK-Encrypted
                    </span>
                    <button
                      onClick={handleVent}
                      disabled={!input}
                      className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${input ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                    >
                      Send Signal
                    </button>
                  </div>
                </div>
            </motion.div>
      </div>
    </div>
  );
}