import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppStore } from "../store/useAppStore";

import PrivacyLoader from "../components/PrivacyLoader";
import MoodBackground from "../components/MoodBackground";
import WeatherVFX from "../components/WeatherVFX";

import { ArrowLeft, HandHeart, ArrowUp, Zap, MessageCircleWarning } from "lucide-react";
import { motion } from "framer-motion";

// 3D imports
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

import CodeCat from "../components/CodeCat";
import RealCat from "../components/RealCat"; 

import { PET_STATES } from "../utils/constants";
import { getEmotionID } from "../utils/emotionMap";

import { submitProof, fetchPair } from "../utils/moodachuApi";

export default function PetRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { relationships, setMood, simulatePartnerInteraction } = useAppStore();

  const relationship = relationships.find(r => r.id === id);

  const [input, setInput] = useState("");
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [detectedMoodLabel, setDetectedMoodLabel] = useState(null);
  const [detectedEmotionRaw, setDetectedEmotionRaw] = useState(null);

  const [currentAction, setCurrentAction] = useState(null);
  const [useRealModel, setUseRealModel] = useState(false);

  // Text → Emotional State ID → Pet State Mapping
  const PET_STATE_LABELS = ["Neutral", "Happy", "Sleepy", "Storm", "Grow"];

  // Sync from ZK backend on first load
  useEffect(() => {
    if (!relationship) {
      navigate("/dashboard");
      return;
    }

    async function loadFromZK() {
      const pairId = relationship.id;
      const res = await fetchPair(pairId);

      if (res.exists) {
        // Update global store
        setMood(pairId, res.pair.petState);
      }
    }

    loadFromZK();
  }, [relationship, navigate, setMood]);

  if (!relationship) return null;

  // -----------------------------------------
  // ✨ Mood detection from text
  // -----------------------------------------
  const detectMoodFromInput = (text) => {
    if (!text) return null;

    const emotionId = getEmotionID(text);

    const EMOTION_NAMES = [
      "HAPPY",
      "STRESSED",
      "TIRED",
      "NEED_SPACE",
      "NEED_AFFECTION",
      "NEGLECTED",
      "NEUTRAL"
    ];
    setDetectedEmotionRaw(EMOTION_NAMES[emotionId] || null);

    switch (emotionId) {
      case 0: return PET_STATES.DANCE;
      case 1: return PET_STATES.STORM;
      case 2: return PET_STATES.SLEEPY;
      case 3: return PET_STATES.SLEEPY;
      case 4: return PET_STATES.GROW;
      case 5: return PET_STATES.STORM;
      case 6:
      default:
        return PET_STATES.NEUTRAL;
    }
  };

  const onInputChange = (value) => {
    setInput(value);
    const mood = detectMoodFromInput(value);
    setDetectedMoodLabel(mood !== null ? PET_STATE_LABELS[mood] : null);
  };

  // -----------------------------------------
  // ✨ ZK SUBMISSION LOGIC
  // -----------------------------------------
  const handleVent = async () => {
    if (!input) return;
    setIsEncrypting(true);

    await new Promise((res) => setTimeout(res, 1000));

    const mood = detectMoodFromInput(input);

    if (mood !== null) {
      // 🔥 Submit proof to backend API
      const result = await submitProof(relationship.id, mood);

      if (!result.success) {
        console.error("❌ Invalid proof!", result.error);
      } else {
        // update global store
        setMood(relationship.id, result.state.petState);
      }
    } else {
      simulatePartnerInteraction(relationship.id);
    }

    setInput("");
    setIsEncrypting(false);
  };

  // -----------------------------------------
  // ✨ Action trigger for 3D cat
  // -----------------------------------------
  const trigger = (actionName) => {
    if (currentAction) return;
    setCurrentAction(actionName);
    setTimeout(() => setCurrentAction(null), 1500);
  };

  // -----------------------------------------
  // ✨ JSX RENDER
  // -----------------------------------------
  return (
    <div className="h-screen w-screen flex flex-col text-white relative overflow-hidden">

      {/* Dynamic Mood Background */}
      <MoodBackground petState={relationship.petState} />

      {isEncrypting && <PrivacyLoader petState={relationship.petState} />}

      {/* NAV BAR */}
      <motion.nav
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-6 flex items-center justify-between z-20 pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 bg-slate-900/50 rounded-full border border-slate-800"
          >
            <ArrowLeft className="text-slate-400" size={20} />
          </button>

          <button
            onClick={() => setUseRealModel(v => !v)}
            className="p-2 bg-slate-800/60 rounded-md text-xs ml-2 pointer-events-auto"
          >
            {useRealModel ? "RealCat" : "CodeCat"}
          </button>
        </div>

        <div className="text-center">
          <h1 className="font-bold text-xl">{relationship.petName}</h1>
          <p className="text-[10px] text-emerald-500 font-mono">Secured by Midnight</p>
          <p className="text-[11px] mt-1">
            Mood: <span className="font-bold">{PET_STATE_LABELS[relationship.petState]}</span>
          </p>
        </div>

        <div className="w-10" />
      </motion.nav>

      {/* 3D CAT SCENE */}
      <div className="absolute inset-0 z-10">
        <Canvas
          shadows
          camera={{ position: [0, 0, 8], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => gl.setClearColor("#000000", 0)}
        >
          <ambientLight intensity={1} />
          <Environment preset="city" background={false} />

          {/* Storm fog */}
          {relationship.petState === PET_STATES.STORM && (
            <fog attach="fog" args={["#020617", 4, 24]} />
          )}

          <WeatherVFX petState={relationship.petState} />

          {useRealModel ? (
            <RealCat petState={relationship.petState} />
          ) : (
            <CodeCat petState={relationship.petState} triggerAction={currentAction} />
          )}

          <OrbitControls makeDefault enableZoom={true} />
        </Canvas>
      </div>

      {/* UI OVERLAY */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center z-20 pb-10 px-4">
        
        {/* Quick interactions */}
        <motion.div
          className="pointer-events-auto flex items-center gap-3 p-3 bg-slate-900/80 rounded-2xl border border-slate-700 shadow-2xl mb-6"
          whileHover={{ scale: 1.02 }}
        >
          <button onClick={() => trigger("SMILE")} className="p-4 bg-slate-800 rounded-xl text-emerald-500">
            <HandHeart size={24} />
          </button>

          <button onClick={() => trigger("JUMP")} className="p-4 bg-slate-800 rounded-xl text-blue-500">
            <ArrowUp size={24} />
          </button>

          <button onClick={() => trigger("SCRATCH")} className="p-4 bg-slate-800 rounded-xl text-amber-500">
            <Zap size={24} />
          </button>

          <button onClick={() => trigger("SCREAM")} className="p-4 bg-slate-800 rounded-xl text-red-500">
            <MessageCircleWarning size={24} />
          </button>
        </motion.div>

        {/* VENT INPUT AREA */}
        <motion.div
          className="pointer-events-auto w-full max-w-lg"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="bg-slate-900/90 p-2 rounded-[2rem] border border-slate-700">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={`How do you feel about ${relationship.partnerName}?`}
              className="w-full bg-transparent text-white resize-none outline-none h-12 p-4 text-sm"
            />

            <div className="flex justify-between items-center px-4 pb-2">
              <span className="text-[10px] text-slate-500 font-mono">
                <span className="w-2 h-2 bg-emerald-500 rounded-full inline-block mr-1 animate-pulse" />
                ZK-Encrypted
              </span>

              <div className="flex items-center gap-3">
                {detectedMoodLabel && (
                  <div className="text-[10px] font-mono text-slate-300/80">
                    Detected: <b>{detectedMoodLabel}</b>
                    {detectedEmotionRaw ? ` (${detectedEmotionRaw})` : ""}
                  </div>
                )}

                <button
                  onClick={handleVent}
                  disabled={!input}
                  className={`px-6 py-2 rounded-full text-xs font-bold ${
                    input ? "bg-emerald-500 text-slate-900" : "bg-slate-800 text-slate-600"
                  }`}
                >
                  Send Signal
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
