'use client';

import { useEffect, useState } from 'react';
import { api, Tag } from '@/lib/web/api';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ kind: 'cuisine' as 'cuisine' | 'vibe', name: '', slug: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getTags()
      .then(setTags)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingTag) {
        const updated = await api.admin.updateTag(editingTag.id, formData);
        setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      } else {
        const created = await api.admin.createTag(formData);
        setTags((prev) => [...prev, created]);
      }
      setShowForm(false);
      setEditingTag(null);
      setFormData({ kind: 'cuisine', name: '', slug: '' });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: Tag) => {
    if (!confirm(`Delete ${tag.name}?`)) return;
    try {
      await api.admin.deleteTag(tag.id);
      setTags((prev) => prev.filter((t) => t.id !== tag.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ kind: tag.kind, name: tag.name, slug: tag.slug });
    setShowForm(true);
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  const cuisineTags = tags.filter((t) => t.kind === 'cuisine');
  const vibeTags = tags.filter((t) => t.kind === 'vibe');

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Tags</h1>
          <p className="admin-page-subtitle">Manage cuisine and vibe tags for locations</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => {
            setEditingTag(null);
            setFormData({ kind: 'cuisine', name: '', slug: '' });
            setShowForm(true);
          }}
        >
          Add Tag
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editingTag ? 'Edit Tag' : 'New Tag'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Type</label>
                <select
                  className="form-input"
                  value={formData.kind}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kind: e.target.value as 'cuisine' | 'vibe' }))}
                >
                  <option value="cuisine">Cuisine</option>
                  <option value="vibe">Vibe</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Italian"
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Slug</label>
              <input
                className="form-input"
                value={formData.slug}
                onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="italian"
                required
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowForm(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            Cuisine Tags ({cuisineTags.length})
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cuisineTags.map((tag) => (
                <tr key={tag.id}>
                  <td><span className="chip chip--cuisine" style={{ cursor: 'default' }}>{tag.name}</span></td>
                  <td><code>{tag.slug}</code></td>
                  <td>
                    <button className="btn btn--ghost btn--small" onClick={() => startEdit(tag)}>Edit</button>
                    <button className="btn btn--ghost btn--small" onClick={() => handleDelete(tag)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'var(--text)' }}>
            Vibe Tags ({vibeTags.length})
          </h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vibeTags.map((tag) => (
                <tr key={tag.id}>
                  <td><span className="chip chip--vibe" style={{ cursor: 'default' }}>{tag.name}</span></td>
                  <td><code>{tag.slug}</code></td>
                  <td>
                    <button className="btn btn--ghost btn--small" onClick={() => startEdit(tag)}>Edit</button>
                    <button className="btn btn--ghost btn--small" onClick={() => handleDelete(tag)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
