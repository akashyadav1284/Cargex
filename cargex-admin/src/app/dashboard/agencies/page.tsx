"use client";
import { useState, useEffect } from 'react';
import { useAdmin } from '../layout';
import { API_URL } from '@/lib/config';

export default function AgenciesPage() {
  const { fetchOpts } = useAdmin();
  const [agencies, setAgencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', phone: '', ownerName: '', address: ''
  });

  const loadAgencies = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/agencies`, fetchOpts());
      if (res.ok) {
        setAgencies(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgencies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies`, fetchOpts({
        method: 'POST',
        body: JSON.stringify(formData)
      }));
      if (res.ok) {
        setIsCreating(false);
        setFormData({ name: '', email: '', password: '', phone: '', ownerName: '', address: '' });
        loadAgencies();
      } else {
        alert('Failed to create agency. Email might exist.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this agency?')) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/agencies/${id}`, fetchOpts({ method: 'DELETE' }));
      if (res.ok) loadAgencies();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agency Management</h1>
          <p className="text-sm text-muted">Manage agency owners and their access credentials</p>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="px-4 py-2 bg-accent text-accent-foreground font-bold rounded-xl text-sm"
        >
          {isCreating ? 'Cancel' : '+ New Agency'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-surface border border-border p-6 rounded-2xl">
          <h2 className="text-lg font-bold mb-4 text-foreground">Create Agency Account</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Agency Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Owner Name</label>
              <input type="text" value={formData.ownerName} onChange={e => setFormData({...formData, ownerName: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Login Email</label>
              <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Passkey / Password</label>
              <input type="text" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Phone Number</label>
              <input type="text" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-muted uppercase tracking-wider mb-1 block">Address</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-accent outline-none" />
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button type="submit" className="px-6 py-2 bg-accent text-accent-foreground font-bold rounded-xl">Save Agency</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surfaceHighlight">
              <tr>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Agency</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Owner</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Contact</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs">Status</th>
                <th className="px-6 py-4 font-bold text-muted uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted">Loading agencies...</td></tr>
              ) : agencies.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted">No agencies registered yet.</td></tr>
              ) : (
                agencies.map(agency => (
                  <tr key={agency._id} className="hover:bg-surfaceHighlight/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{agency.name}</div>
                      <div className="text-xs text-muted">Created: {new Date(agency.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{agency.ownerName || '-'}</td>
                    <td className="px-6 py-4">
                      <div className="text-foreground">{agency.email}</div>
                      <div className="text-xs text-muted">{agency.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-success/20 text-success rounded-lg text-xs font-bold uppercase tracking-wider">
                        {agency.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(agency._id)} className="p-2 text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
