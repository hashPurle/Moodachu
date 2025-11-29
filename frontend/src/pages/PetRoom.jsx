import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";
import PrivacyLoader from "../components/PrivacyLoader";
import { ArrowLeft, Cookie, HandHeart, ArrowUp, Zap, MessageCircleWarning } from "lucide-react"; 

// 3D Imports
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Environment } from "@react-three/drei";

// ✅ FIX: Commented out RealCat, using CodeCat instead
// import RealCat from "../components/RealCat";
import CodeCat from "../components/CodeCat"; 

export default function PetRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { relationships, simulatePartnerInteraction } = useAppStore();
  
  const relationship = relationships.find(r => r.id === id);
  const [input, setInput] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);

  // 1. STATE FOR PROCEDURAL ACTIONS
  const [currentAction, setCurrentAction] = useState(null);

  useEffect(() => {
    if (!relationship) navigate("/dashboard");
  }, [relationship, navigate]);

  if (!relationship) return null;

  const handleVent = async () => {
    if (!input) return;
    setIsEncrypting(true);
    await new Promise(r => setTimeout(r, 2000));
    simulatePartnerInteraction(relationship.id);
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
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-white relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,_#1e293b_0%,_#020617_80%)] -z-20" />
      
      {isEncrypting && <PrivacyLoader />}

      <nav className="p-6 flex items-center justify-between z-10 relative pointer-events-none">
        <div className="pointer-events-auto">
            <button onClick={() => navigate("/dashboard")} className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-full transition-colors border border-slate-800">
            <ArrowLeft className="text-slate-400" size={20} />
            </button>
        </div>
        <div className="text-center">
          <h1 className="font-bold text-xl tracking-tight drop-shadow-md">{relationship.petName}</h1>
          <p className="text-[10px] text-emerald-500 font-mono tracking-widest uppercase drop-shadow-md">Secured by Midnight</p>
        </div>
        <div className="w-10" />
      </nav>

      {/* --- 3D SCENE --- */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 0, 8], fov: 45 }}>
           <ambientLight intensity={1} />
           <Environment preset="city" />
           
           <Stage environment="city" intensity={0.5} contactShadow={false} adjustCamera={1.2}>
             {/* ✅ Using CodeCat Component */}
             <CodeCat 
               petState={relationship.petState} 
               triggerAction={currentAction}
             />
           </Stage>
           
           <OrbitControls makeDefault enableZoom={true} minDistance={2} maxDistance={10} />
        </Canvas>
      </div>

      {/* --- UI OVERLAY --- */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center pointer-events-none z-10 pb-10 px-4">
            
            {/* ACTION BAR */}
            <div className="pointer-events-auto flex items-center gap-3 p-3 bg-slate-900/80 rounded-2xl backdrop-blur-xl border border-slate-700 shadow-2xl mb-6 scale-90 md:scale-100 transition-transform">
                 
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

            </div>

            {/* Input Area */}
            <div className="pointer-events-auto w-full max-w-lg">
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
            </div>
      </div>
    </div>
  );
}