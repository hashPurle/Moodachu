import { motion } from "framer-motion";

const MOODS = {
  0: { color: "#94a3b8", scale: 1, pulse: 2 },    // Neutral
  1: { color: "#10b981", scale: 1.2, pulse: 0.5 }, // Happy
  2: { color: "#60a5fa", scale: 0.8, pulse: 4 },   // Sleepy
  3: { color: "#ef4444", scale: 1.1, pulse: 0.2 }, // Storm
  4: { color: "#eab308", scale: 1.5, pulse: 1 },   // Grow
};

export default function PetVisualizer({ moodState, onStroke }) {
  const currentMood = MOODS[moodState] || MOODS[0];

  // Facial expressions for each mood
  const expressions = {
    0: { // Neutral
      eyes: <><div className="w-3 h-3 bg-slate-900 rounded-full opacity-80" /><div className="w-3 h-3 bg-slate-900 rounded-full opacity-80" /></>,
      mouth: <div className="w-8 h-2 rounded-b-full bg-slate-700 mx-auto mt-2" />
    },
    1: { // Happy
      eyes: <><div className="w-3 h-3 bg-slate-900 rounded-full opacity-80" /><div className="w-3 h-3 bg-slate-900 rounded-full opacity-80" /></>,
      mouth: <div className="w-8 h-4 rounded-b-full bg-green-500 mx-auto mt-2" style={{ borderRadius: '0 0 20px 20px' }} />
    },
    2: { // Sleepy
      eyes: <><div className="w-3 h-1 bg-slate-700 rounded-full opacity-60" /><div className="w-3 h-1 bg-slate-700 rounded-full opacity-60" /></>,
      mouth: <div className="w-6 h-1 bg-slate-400 rounded-full mx-auto mt-2" />
    },
    3: { // Storm/Angry
      eyes: <><div className="w-3 h-3 bg-red-700 rounded-full opacity-90" /><div className="w-3 h-3 bg-red-700 rounded-full opacity-90" /></>,
      mouth: <div className="w-8 h-2 rounded-t-full bg-red-700 mx-auto mt-2" style={{ borderRadius: '20px 20px 0 0' }} />
    },
    4: { // Grow/Excited
      eyes: <><div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80" /><div className="w-3 h-3 bg-yellow-500 rounded-full opacity-80" /></>,
      mouth: <div className="w-8 h-4 rounded-b-full bg-yellow-500 mx-auto mt-2" style={{ borderRadius: '0 0 20px 20px' }} />
    },
  };
  const face = expressions[moodState] || expressions[0];

  return (
    <div className="relative flex items-center justify-center w-64 h-64 select-none">
      {/* Glow */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: currentMood.pulse, repeat: Infinity }}
        className="absolute w-full h-full rounded-full blur-3xl"
        style={{ backgroundColor: currentMood.color }}
      />

      {/* Body */}
      <motion.div
        drag={!!onStroke}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragStart={() => onStroke && onStroke()}
        whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
        whileHover={{ scale: 1.05 }}
        animate={{
          scale: currentMood.scale,
          y: moodState === 3 ? [0, -5, 5, 0] : [0, -10, 0],
        }}
        transition={{
          y: { duration: moodState === 3 ? 0.2 : 3, repeat: Infinity },
          scale: { duration: 0.5 },
        }}
        className="relative w-32 h-32 rounded-full shadow-2xl backdrop-blur-md border-2 border-white/20 cursor-grab flex items-center justify-center"
        style={{ background: `radial-gradient(circle at 30% 30%, #ffffff, ${currentMood.color})` }}
      >
        {/* Eyes */}
        <div className="flex gap-8 mb-2 justify-center items-center">
          {face.eyes}
        </div>
        {/* Mouth */}
        {face.mouth}
      </motion.div>
    </div>
  );
}