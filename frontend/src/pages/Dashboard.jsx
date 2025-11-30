import { useState, useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { fetchUserByUsername } from '../utils/moodachuApi';
import { Link, useNavigate } from "react-router-dom";
import { Plus, User, ArrowRight, LogOut, Sparkles, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { relationships, addRequest, acceptRequest, addInviteLocal, user, logout, lastEmailPreview, clearLastEmailPreview, fetchPairs } = useAppStore();
  const navigate = useNavigate();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState("");
  const [newPartnerUsername, setNewPartnerUsername] = useState("");
  const [usernameValid, setUsernameValid] = useState(null);
  const [usernameDisplayName, setUsernameDisplayName] = useState(null);
  const usernameValidationTimer = useRef(null);
  const [newPetName, setNewPetName] = useState("");
  const isDev = import.meta.env.MODE === 'development';

  const handleCreate = () => {
    if (!newPartner || !newPetName || !newPartnerUsername) return;
    addRequest(newPartner, newPartnerUsername, newPetName);
    setModalOpen(false);
    setNewPartner(""); setNewPetName("");
    setNewPartnerUsername("");
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  useEffect(() => {
    if (!user || !user.username) return;
    let mounted = true;
    const poll = async () => {
      try {
        const res = await fetch(`http://localhost:3000/invitations?username=${encodeURIComponent(user.username)}`);
        if (!res.ok) return;
        const json = await res.json();
        const list = json && json.invites ? json.invites : [];
        console.debug('[Dashboard] fetched invites', list.length, list.map(i => ({ id: i.id, to: i.toUsername, from: i.fromUsername }))); 
        list.forEach(inv => addInviteLocal(inv));
      } catch (err) {
        console.warn('[Dashboard] poll invites failed', err.message);
      }
    };
    // initial fetch of pairs and invites
    (async () => {
      await fetchPairs();
      await poll();
    })();
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?.username, addInviteLocal, fetchPairs]);

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-20 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-blue-500/3 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-between items-center mb-12 max-w-6xl mx-auto"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="text-emerald-400" size={28} />
              <h2 className="text-4xl font-bold bg-gradient-to-r from-white via-emerald-200 to-white bg-clip-text text-transparent">Your Connections</h2>
            </div>
            <p className="text-slate-400 text-sm ml-11">Welcome back, <span className="text-emerald-400 font-semibold">{user?.displayName || user?.email || "User"}</span> <span className="text-xs text-slate-500 ml-2">{user?.username ? `@${user.username}` : user?.email ? `(${user.email})` : ''}</span></p>
          </div>
          
          <div className="flex gap-3">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setModalOpen(true)} 
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white px-6 py-3 rounded-full font-bold transition-all shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50"
            >
              <Plus size={18} /> New Pet
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout} 
              className="p-3 bg-slate-800/50 backdrop-blur rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors border border-slate-700/50" 
              title="Logout"
            >
              <LogOut size={20} />
            </motion.button>
          </div>
        </motion.header>

        {/* Grid of Pets */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {relationships.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="col-span-full flex flex-col items-center justify-center py-20"
            >
              <Heart className="text-slate-700 mb-4" size={64} />
              <h3 className="text-2xl font-bold text-slate-600 mb-2">No connections yet</h3>
              <p className="text-slate-500 mb-6">Create your first pet to get started!</p>
              <button 
                onClick={() => setModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-6 py-3 rounded-full font-bold shadow-xl shadow-emerald-500/30"
              >
                <Plus size={18} /> Create Your First Pet
              </button>
            </motion.div>
          ) : (
            relationships.map((rel, index) => (
              <motion.div 
                key={rel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700/50 p-6 rounded-3xl hover:border-emerald-500/50 transition-all group backdrop-blur-xl shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/5 group-hover:to-purple-500/5 rounded-3xl transition-all duration-500" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                        {rel.petName}
                        {rel.status === 'active' && <span className="text-emerald-400">✨</span>}
                      </h3>
                      <div className="flex items-center gap-2 text-slate-400 text-sm mt-2">
                        <div className="p-1.5 bg-slate-800/50 rounded-full">
                          <User size={14} />
                        </div>
                        <span className="font-medium">{rel.partnerName}</span>
                      </div>
                      {(rel.partnerUsername || rel.partnerEmail) && (
                        <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-800/30 px-2 py-1 rounded-md inline-block">
                          @{rel.partnerUsername || rel.partnerEmail}
                        </div>
                      )}
                      {rel.status === 'error' && rel.error && (
                        <div className="text-xs text-red-400 mt-2 bg-red-500/10 px-2 py-1 rounded-md">{rel.error}</div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <div className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1.5 ${rel.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/20' : (rel.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}`}>
                        <span className={`w-2 h-2 rounded-full ${rel.status === 'active' ? 'bg-emerald-400 animate-pulse' : (rel.status === 'error' ? 'bg-red-400' : 'bg-amber-400')}`} />
                        {rel.status === 'active' ? 'ONLINE' : (rel.status === 'error' ? 'ERROR' : 'PENDING')}
                      </div>
                      {rel.shared && (
                        <div className="px-3 py-1 rounded-full text-[9px] font-bold tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">SHARED</div>
                      )}
                    </div>
                  </div>

                  {rel.status === 'active' ? (
                    <Link to={`/pet/${rel.id}`}>
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full bg-gradient-to-r from-slate-800 to-slate-700 hover:from-emerald-500 hover:to-emerald-400 hover:text-slate-900 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-emerald-500/30 border border-slate-700/50 hover:border-emerald-500"
                      >
                        Enter Room <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                      </motion.button>
                    </Link>
                  ) : (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => acceptRequest(rel.id)} 
                      className="w-full bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 py-4 rounded-2xl font-bold border-2 border-dashed border-slate-700 hover:border-emerald-500/50 transition-all"
                    >
                      Accept Request
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>

      {/* "New Pet" Modal */}
      {isModalOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50"
          onClick={() => setModalOpen(false)}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl w-full max-w-md border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-emerald-500/20 rounded-2xl">
                <Sparkles className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">Create Connection</h3>
            </div>
            
            <label className="text-xs text-emerald-400 uppercase font-bold ml-1 tracking-wider">Partner Name</label>
            <input 
              className="w-full bg-slate-950/50 p-4 rounded-xl mb-5 mt-2 border border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-white transition-all placeholder:text-slate-600" 
              placeholder="e.g. Alice" 
              value={newPartner} 
              onChange={(e) => setNewPartner(e.target.value)} 
            />
            
            <label className="text-xs text-emerald-400 uppercase font-bold ml-1 tracking-wider">Partner Username</label>
            <input 
              className="w-full bg-slate-950/50 p-4 rounded-xl mb-2 mt-2 border border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-white transition-all placeholder:text-slate-600" 
              placeholder="partner_username"
              value={newPartnerUsername} 
              onChange={(e) => {
                const v = e.target.value;
                setNewPartnerUsername(v);
                setUsernameValid(null);
                setUsernameDisplayName(null);
                if (usernameValidationTimer.current) clearTimeout(usernameValidationTimer.current);
                usernameValidationTimer.current = setTimeout(async () => {
                  if (!v) return;
                  try {
                    const u = await fetchUserByUsername(v.trim().toLowerCase());
                    if (!u) { setUsernameValid(false); setUsernameDisplayName(null); return; }
                    if (u.ok && u.user) {
                      setUsernameValid(true);
                      setUsernameDisplayName(u.user.displayName || u.user.username);
                    } else {
                      setUsernameValid(false);
                      setUsernameDisplayName(null);
                      if (u && u.error) console.warn('[Dashboard] username fetch error', u.error);
                    }
                  } catch (err) {
                    setUsernameValid(false);
                  }
                }, 350);
              }}
            />
            {usernameValid === true && <div className="text-xs text-emerald-400 mt-2">Username found: {usernameDisplayName}</div>}
            {usernameValid === false && <div className="text-xs text-red-400 mt-2">Username not found</div>}
            {usernameValid === false && isDev && (
              <div className="mt-2 flex items-center gap-2">
                <button className="text-xs text-slate-300 bg-slate-800 px-3 py-1 rounded-md hover:bg-slate-700" onClick={async () => {
                  try {
                    const devUid = `dev-${Math.random().toString(36).slice(2,8)}`;
                    const res = await fetch('http://localhost:3000/users', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ uid: devUid, requestedUsername: newPartnerUsername.trim().toLowerCase(), displayName: newPartner || newPartnerUsername.trim() })
                    });
                    if (!res.ok) {
                      const j = await res.json();
                      console.warn('[Dashboard] createDevUser failed', j && j.error);
                      return;
                    }
                    const j = await res.json();
                    // Update UI to valid
                    setUsernameValid(true);
                    setUsernameDisplayName(j.user.displayName || j.user.username);
                  } catch (err) {
                    console.warn('[Dashboard] createDevUser failed', err.message);
                  }
                }}>Create dev user</button>
                <div className="text-xs text-slate-400">(dev-only) create a placeholder account</div>
              </div>
            )}
            {usernameValid === null && <div className="text-xs text-slate-400 mt-2 bg-slate-800/30 px-2 py-1 rounded-md inline-block">Checking…</div>}

            <label className="text-xs text-emerald-400 uppercase font-bold ml-1 tracking-wider mt-4 block">Pet Name</label>
            <input 
              className="w-full bg-slate-950/50 p-4 rounded-xl mb-8 mt-2 border border-slate-700/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none text-white transition-all placeholder:text-slate-600" 
              placeholder="e.g. Moodachu" 
              value={newPetName} 
              onChange={(e) => setNewPetName(e.target.value)} 
            />
            
            <div className="flex gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setModalOpen(false)} 
                className="flex-1 py-3 text-slate-400 hover:text-white transition-colors bg-slate-800/30 rounded-xl font-medium hover:bg-slate-800/50"
              >
                Cancel
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!newPartner || !newPartnerUsername || !newPetName || !usernameValid} 
                onClick={handleCreate} 
                className={`flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all ${(!newPartner || !newPartnerUsername || !newPetName || !usernameValid) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-emerald-500/50'}`}
              >
                Create
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
      {/* Email preview modal (Ethereal preview link) */}
      {lastEmailPreview && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl w-full max-w-md border border-slate-700/50 shadow-2xl"
          >
            <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-white to-emerald-200 bg-clip-text text-transparent">Email Preview</h3>
            <p className="text-sm text-slate-400 mb-6">This is an Ethereal preview of the email that was sent (development only).</p>
            <a className="text-emerald-400 hover:text-emerald-300 break-words underline decoration-emerald-500/30 hover:decoration-emerald-500 transition-colors" href={lastEmailPreview} target="_blank" rel="noreferrer">Open Preview →</a>
            <div className="flex justify-end mt-8">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => clearLastEmailPreview()} 
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl text-white font-bold shadow-lg hover:shadow-emerald-500/50 transition-all"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}