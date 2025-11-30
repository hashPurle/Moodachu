import { useState, useEffect, useRef } from "react";
import { useAppStore } from "../store/useAppStore";
import { fetchUserByUsername } from '../utils/moodachuApi';
import { Link } from "react-router-dom";
import { Plus, User, ArrowRight, LogOut } from "lucide-react";

export default function Dashboard() {
  const { relationships, addRequest, acceptRequest, addInviteLocal, user, logout, lastEmailPreview, clearLastEmailPreview, fetchPairs } = useAppStore();
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
    <div className="min-h-screen p-8 bg-slate-950 text-white relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold">Your Connections</h2>
          <p className="text-slate-400 text-sm">Welcome back, {user?.displayName || user?.email || "User"} <span className="text-xs text-slate-500 ml-2">{user?.username ? `(${user.username})` : user?.email ? `(${user.email})` : ''}</span></p>
        </div>
        
        <div className="flex gap-4">
          <button onClick={() => setModalOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full font-bold transition-all shadow-lg shadow-emerald-500/20">
            <Plus size={16} /> New Pet
          </button>
          <button onClick={logout} className="p-2 bg-slate-800 rounded-full hover:bg-red-500/20 hover:text-red-400 transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Grid of Pets */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {relationships.map((rel) => (
          <div key={rel.id} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-all group backdrop-blur-sm">
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-white group-hover:text-emerald-400 transition-colors">{rel.petName}</h3>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-mono mt-1">
                  <User size={12} /> {rel.partnerName}
                </div>
                {(rel.partnerUsername || rel.partnerEmail) && (
                  <div className="text-[12px] text-slate-500 mt-1 font-mono">{rel.partnerUsername || rel.partnerEmail}</div>
                )}
                {rel.status === 'error' && rel.error && (
                  <div className="text-xs text-red-400 mt-2">{rel.error}</div>
                )}
              </div>
                <div className="flex gap-2 items-center">
                <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${rel.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : (rel.status === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400')}`}>
                  {rel.status === 'active' ? '● ONLINE' : (rel.status === 'error' ? 'ERROR' : '○ PENDING')}
                </div>
                {rel.shared && (
                  <div className="px-2 py-1 rounded text-[9px] font-bold tracking-wider bg-slate-700/30 text-slate-300">Shared</div>
                )}
              </div>
            </div>

            {rel.status === 'active' ? (
              <Link to={`/pet/${rel.id}`}>
                <button className="w-full bg-slate-800 hover:bg-emerald-500 hover:text-slate-900 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:shadow-lg">
                  Enter Room <ArrowRight size={16} />
                </button>
              </Link>
            ) : (
              <button onClick={() => acceptRequest(rel.id)} className="w-full bg-slate-800 text-slate-400 hover:text-white py-3 rounded-xl font-bold border border-dashed border-slate-700 hover:border-white transition-all">
                Accept Request
              </button>
            )}
          </div>
        ))}
      </div>

      {/* "New Pet" Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 p-8 rounded-3xl w-full max-w-sm border border-slate-800 shadow-2xl">
            <h3 className="text-xl font-bold mb-6">Create Connection</h3>
            
            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Partner Name</label>
            <input 
              className="w-full bg-slate-950 p-4 rounded-xl mb-4 mt-1 border border-slate-800 focus:border-emerald-500 outline-none text-white transition-colors" 
              placeholder="e.g. Alice" 
              value={newPartner} 
              onChange={(e) => setNewPartner(e.target.value)} 
            />
            
            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Partner Username</label>
            <input 
              className="w-full bg-slate-950 p-4 rounded-xl mb-4 mt-1 border border-slate-800 focus:border-emerald-500 outline-none text-white transition-colors" 
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
            {usernameValid === null && <div className="text-xs text-slate-400 mt-2">Checking…</div>}

            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Pet Name</label>
            <input 
              className="w-full bg-slate-950 p-4 rounded-xl mb-8 mt-1 border border-slate-800 focus:border-emerald-500 outline-none text-white transition-colors" 
              placeholder="e.g. Moodachu" 
              value={newPetName} 
              onChange={(e) => setNewPetName(e.target.value)} 
            />
            
            <div className="flex gap-4">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-slate-500 hover:text-white transition-colors">Cancel</button>
              <button disabled={!newPartner || !newPartnerUsername || !newPetName || !usernameValid} onClick={handleCreate} className={`flex-1 bg-emerald-500 text-slate-900 font-bold py-3 rounded-xl hover:scale-105 transition-transform ${(!newPartner || !newPartnerUsername || !newPetName || !usernameValid) ? 'opacity-60 cursor-not-allowed' : ''}`}>Create</button>
            </div>
          </div>
        </div>
      )}
      {/* Email preview modal (Ethereal preview link) */}
      {lastEmailPreview && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 p-6 rounded-2xl w-full max-w-md border border-slate-800">
            <h3 className="text-lg font-bold mb-3">Email Preview</h3>
            <p className="text-sm text-slate-300 mb-4">This is an Ethereal preview of the email that was sent (development only).</p>
            <a className="text-emerald-400 break-words" href={lastEmailPreview} target="_blank" rel="noreferrer">Open Preview</a>
            <div className="flex justify-end mt-6">
              <button onClick={() => clearLastEmailPreview()} className="px-4 py-2 bg-emerald-500 rounded-md text-black font-bold">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}