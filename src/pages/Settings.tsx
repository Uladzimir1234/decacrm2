import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { api } from '../lib/api';

interface ProdUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
}

export default function Settings() {
  const [users, setUsers] = useState<ProdUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // New user form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('viewer');

  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/api/prod/auth/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSave = async (id: string) => {
    setSaving(true);
    try {
      const updates: Record<string, string> = {};
      if (editPassword) updates.password = editPassword;
      if (editRole) updates.role = editRole;
      await api.put(`/api/prod/auth/users/${id}`, updates);
      setEditingId(null);
      setEditPassword('');
      setEditRole('');
      loadUsers();
    } catch (err) {
      console.error('Failed to update user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newEmail || !newName || !newPassword) return;
    setSaving(true);
    try {
      await api.post('/api/prod/auth/users', {
        email: newEmail,
        full_name: newName,
        password: newPassword,
        role: newRole,
      });
      setShowNewForm(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      setNewRole('viewer');
      loadUsers();
    } catch (err) {
      console.error('Failed to create user:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete user ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/prod/auth/users/${id}`);
      loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
    }
  };

  const startEdit = (user: ProdUser) => {
    setEditingId(user.id);
    setEditRole(user.role);
    setEditPassword('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-content-tertiary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={20} className="text-accent" />
          <h1 className="text-lg font-semibold text-content-primary">Production Users</h1>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
        >
          <Plus size={14} />
          Add User
        </button>
      </div>

      {/* New user form */}
      {showNewForm && (
        <div className="bg-surface-raised border border-border rounded-xl p-4 mb-4">
          <h3 className="text-sm font-medium text-content-primary mb-3">New Production User</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Full name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="email"
              placeholder="Email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              type="text"
              placeholder="Password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <select
              value={newRole}
              onChange={e => setNewRole(e.target.value)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
            >
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="seller">Seller</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleCreate}
              disabled={saving || !newEmail || !newName || !newPassword}
              className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={() => setShowNewForm(false)}
              className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-surface-raised border border-border rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface">
              <th className="text-left text-xs font-medium text-content-tertiary px-4 py-2.5">Name</th>
              <th className="text-left text-xs font-medium text-content-tertiary px-4 py-2.5">Email</th>
              <th className="text-left text-xs font-medium text-content-tertiary px-4 py-2.5">Role</th>
              <th className="text-right text-xs font-medium text-content-tertiary px-4 py-2.5">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                <td className="px-4 py-3 text-sm text-content-primary">{user.full_name}</td>
                <td className="px-4 py-3 text-sm text-content-secondary">{user.email}</td>
                <td className="px-4 py-3">
                  {editingId === user.id ? (
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                      className="px-2 py-1 text-xs border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                    >
                      <option value="admin">Admin</option>
                      <option value="manager">Manager</option>
                      <option value="seller">Seller</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">
                      {user.role}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  {editingId === user.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="New password (optional)"
                          value={editPassword}
                          onChange={e => setEditPassword(e.target.value)}
                          className="px-2 py-1 pr-7 text-xs w-44 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-accent"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-content-tertiary hover:text-content-primary"
                        >
                          {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                      <button
                        onClick={() => handleSave(user.id)}
                        disabled={saving}
                        className="p-1 text-accent hover:text-accent/80 disabled:opacity-50"
                        title="Save"
                      >
                        <Save size={14} />
                      </button>
                      <button
                        onClick={() => { setEditingId(null); setEditPassword(''); }}
                        className="text-xs text-content-tertiary hover:text-content-primary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => startEdit(user)}
                        className="px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.full_name)}
                        className="p-1 text-content-tertiary hover:text-status-red transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
