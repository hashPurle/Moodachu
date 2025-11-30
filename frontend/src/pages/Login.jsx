import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function Login() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, isLoggingIn, error } = useAppStore();
  const navigate = useNavigate();

  // Local State
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    let success = false;
    
    if (isSignUp) {
      success = await signupWithEmail(formData.email, formData.password, formData.name, formData.username);
    } else {
      success = await loginWithEmail(formData.email, formData.password);
    }

    if (success) navigate("/dashboard");
  };

  const handleGoogle = async () => {
    const success = await loginWithGoogle();
    if (success) navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden p-4">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_0%,_#1e293b_0%,_#020617_70%)] -z-10" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-10 left-10 w-32 h-32 bg-cyan-500/10 rounded-full blur-[50px] -z-10" />

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        {/* Header / Mascot Area */}
        <div className="pt-8 pb-6 text-center relative">
           <motion.div 
             animate={{ y: [0, -10, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="w-24 h-24 mx-auto bg-slate-800 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-slate-700 relative z-10"
           >
             <span className="text-5xl select-none">🥚</span>
             {/* Cute glowing eyes behind the egg? */}
             <div className="absolute top-8 left-6 w-2 h-2 bg-white rounded-full opacity-60"></div>
             <div className="absolute top-8 right-6 w-2 h-2 bg-white rounded-full opacity-60"></div>
           </motion.div>
           
           <h1 className="mt-6 text-3xl font-bold text-white tracking-tight">
             {isSignUp ? "Join Moodachu" : "Welcome Back"}
           </h1>
           <p className="text-slate-400 text-sm mt-2">
             {isSignUp ? "Start your emotional journey today." : "Your pet misses you."}
           </p>
        </div>

        {/* Form Area */}
        <div className="px-8 pb-8">
          
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400 text-xs"
              >
                <AlertCircle size={14} /> {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Input (Only for Sign Up) */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Pet Owner Name"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Input */}
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="Email Address"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            {/* Password Input */}
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="Password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isLoggingIn}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
              {!isLoggingIn && <ArrowRight size={18} />}
            </button>

            {/* Username Input (Only for Sign Up) */}
            <AnimatePresence>
              {isSignUp && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="relative group">
                    <User className="absolute left-3 top-3.5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder="Username (unique)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                      required={isSignUp}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <span className="relative bg-slate-900 px-3 text-xs text-slate-500 uppercase">Or continue with</span>
          </div>

          {/* Google Button */}
          <button 
            onClick={handleGoogle}
            disabled={isLoggingIn}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-3"
          >
             <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" color="#4285F4"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" color="#34A853"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" color="#FBBC05"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" color="#EA4335"/>
              </svg>
              Google
          </button>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button 
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors"
              >
                {isSignUp ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
}