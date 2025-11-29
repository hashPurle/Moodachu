import { motion } from "framer-motion";
import { Lock } from "lucide-react";

export default function PrivacyLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        className="relative p-6 bg-slate-900 rounded-full border border-slate-800"
      >
        <Lock className="w-10 h-10 text-emerald-400" />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="mt-8 text-lg font-mono text-emerald-400 tracking-widest"
      >
        ENCRYPTING FEELINGS...
      </motion.p>
    </div>
  );
}