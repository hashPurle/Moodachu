import { useState } from "react";
import { useAppStore } from "../store/useAppStore";
import { Link } from "react-router-dom";
import { Plus, User, ArrowRight, LogOut } from "lucide-react";

export default function Dashboard() {
  const { relationships, addRequest, acceptRequest, user, logout } = useAppStore();
  const [isModalOpen, setModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState("");
  const [newPetName, setNewPetName] = useState("");

  const handleCreate = () => {
    if (!newPartner || !newPetName) return;
    addRequest(newPartner, newPetName);
    setModalOpen(false);
    setNewPartner(""); setNewPetName("");
  };

  return (
    <div className="min-h-screen p-8 bg-slate-950 text-white relative">
      {/* Header */}
      <header className="flex justify-between items-center mb-12 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold">Your Connections</h2>
          <p className="text-slate-400 text-sm">Welcome back, {user?.displayName || "User"}</p>
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
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${rel.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                {rel.status === 'active' ? '● ONLINE' : '○ PENDING'}
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
            
            <label className="text-xs text-slate-500 uppercase font-bold ml-1">Pet Name</label>
            <input 
              className="w-full bg-slate-950 p-4 rounded-xl mb-8 mt-1 border border-slate-800 focus:border-emerald-500 outline-none text-white transition-colors" 
              placeholder="e.g. Moodachu" 
              value={newPetName} 
              onChange={(e) => setNewPetName(e.target.value)} 
            />
            
            <div className="flex gap-4">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-3 text-slate-500 hover:text-white transition-colors">Cancel</button>
              <button onClick={handleCreate} className="flex-1 bg-emerald-500 text-slate-900 font-bold py-3 rounded-xl hover:scale-105 transition-transform">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}