'use client';

import { useEffect, useState } from 'react';
import { api, Location, Tag } from '@/lib/web/api';
import ImageUpload from '@/components/web/ImageUpload';

interface LocationForm {
  city: string;
  street: string;
  house_number: string;
  house_number_addition: string;
  postcode: string;
  name: string;
  slug: string;
  description: string;
  why_curated: string;
  price_level: number;
  lat: string;
  lng: string;
  address: string;
  hero_image_url: string;
  is_published: boolean;
  featured_rank: string;
  tag_ids: string[];
}

const emptyForm: LocationForm = {
  city: '',
  street: '',
  house_number: '',
  house_number_addition: '',
  postcode: '',
  name: '',
  slug: '',
  description: '',
  why_curated: '',
  price_level: 2,
  lat: '',
  lng: '',
  address: '',
  hero_image_url: '',
  is_published: false,
  featured_rank: '',
  tag_ids: [],
};

function normalizePostcode(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

function buildAddress(form: LocationForm): string {
  const streetLine = [form.street, form.house_number ? `${form.house_number}${form.house_number_addition}` : '']
    .filter(Boolean)
    .join(' ')
    .trim();
  const cityLine = [normalizePostcode(form.postcode), form.city].filter(Boolean).join(' ').trim();
  return [streetLine, cityLine].filter(Boolean).join(', ');
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'error' | 'found'>('idle');

  useEffect(() => {
    Promise.all([api.getLocations(), api.getTags()])
      .then(([locationsData, tagsData]) => {
        setLocations(locationsData);
        setTags(tagsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const rawPostcode = formData.postcode.trim();
    const houseNumber = formData.house_number.trim();
    const addition = formData.house_number_addition.trim();

    if (!rawPostcode || !houseNumber) {
      setLookupStatus('idle');
      return;
    }

    const normalizedPostcode = normalizePostcode(rawPostcode);
    if (!/^[0-9]{4}[A-Z]{2}$/.test(normalizedPostcode)) {
      setLookupStatus('idle');
      return;
    }

    const timeout = setTimeout(async () => {
      setLookupStatus('loading');
      try {
        const result = await api.admin.lookupAddress({
          postcode: normalizedPostcode,
          house_number: houseNumber,
          house_number_addition: addition || undefined,
        });

        setFormData((prev) => {
          const next = {
            ...prev,
            street: result.street ?? prev.street,
            city: result.city ?? prev.city,
            postcode: result.postcode ? normalizePostcode(result.postcode) : normalizedPostcode,
            house_number: result.house_number ?? prev.house_number,
            house_number_addition: result.house_number_addition ?? prev.house_number_addition,
            lat: result.lat !== null && result.lat !== undefined ? result.lat.toString() : prev.lat,
            lng: result.lng !== null && result.lng !== undefined ? result.lng.toString() : prev.lng,
          };

          return {
            ...next,
            address: result.address || buildAddress(next),
          };
        });

        setLookupStatus('found');
      } catch (err) {
        setLookupStatus('error');
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData.postcode, formData.house_number, formData.house_number_addition]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const computedAddress = buildAddress(formData) || formData.address;
      const payload = {
        ...formData,
        postcode: formData.postcode ? normalizePostcode(formData.postcode) : '',
        address: computedAddress || '',
        lat: formData.lat ? parseFloat(formData.lat) : null,
        lng: formData.lng ? parseFloat(formData.lng) : null,
        featured_rank: formData.featured_rank ? parseInt(formData.featured_rank, 10) : null,
      };

      if (editingLocation) {
        await api.admin.updateLocation(editingLocation.id, payload);
      } else {
        await api.admin.createLocation(payload);
      }

      const updated = await api.getLocations();
      setLocations(updated);
      setShowForm(false);
      setEditingLocation(null);
      setFormData(emptyForm);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (location: Location) => {
    if (!confirm(`Delete ${location.name}?`)) return;
    try {
      await api.admin.deleteLocation(location.id);
      setLocations((prev) => prev.filter((l) => l.id !== location.id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (location: Location) => {
    setEditingLocation(location);
    setFormData({
      city: location.city || '',
      street: location.street || '',
      house_number: location.house_number || '',
      house_number_addition: location.house_number_addition || '',
      postcode: location.postcode || '',
      name: location.name,
      slug: location.slug,
      description: location.description || '',
      why_curated: location.why_curated || '',
      price_level: location.price_level || 2,
      lat: location.lat?.toString() || '',
      lng: location.lng?.toString() || '',
      address: location.address || '',
      hero_image_url: location.hero_image_url || '',
      is_published: location.is_published,
      featured_rank: location.featured_rank?.toString() || '',
      tag_ids: location.tags?.map((t) => t.id) || [],
    });
    setLookupStatus('idle');
    setShowForm(true);
  };

  const togglePublish = async (location: Location) => {
    try {
      await api.admin.updateLocation(location.id, { is_published: !location.is_published });
      setLocations((prev) =>
        prev.map((l) => (l.id === location.id ? { ...l, is_published: !l.is_published } : l))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return <div className="admin-loading">Loading...</div>;
  }

  return (
    <div>
      <div className="admin-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-page-title">Locations</h1>
          <p className="admin-page-subtitle">Manage restaurant listings</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => {
            setEditingLocation(null);
            setFormData({ ...emptyForm });
            setLookupStatus('idle');
            setShowForm(true);
          }}
        >
          Add Location
        </button>
      </div>

      {showForm && (
        <div className="admin-form-card">
          <h3>{editingLocation ? 'Edit Location' : 'New Location'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Postcode</label>
                <input
                  className="form-input"
                  value={formData.postcode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postcode: e.target.value }))}
                  placeholder="1234 AB"
                />
              </div>
              <div className="form-group">
                <label className="form-label">House Number</label>
                <input
                  className="form-input"
                  value={formData.house_number}
                  onChange={(e) => setFormData((prev) => ({ ...prev, house_number: e.target.value }))}
                  placeholder="12"
                />
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Addition</label>
                <input
                  className="form-input"
                  value={formData.house_number_addition}
                  onChange={(e) => setFormData((prev) => ({ ...prev, house_number_addition: e.target.value }))}
                  placeholder="A"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Price Level</label>
                <select
                  className="form-input"
                  value={formData.price_level}
                  onChange={(e) => setFormData((prev) => ({ ...prev, price_level: parseInt(e.target.value, 10) }))}
                >
                  <option value="1">$ - Budget</option>
                  <option value="2">$$ - Moderate</option>
                  <option value="3">$$$ - Upscale</option>
                  <option value="4">$$$$ - Fine Dining</option>
                </select>
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Street</label>
                <input
                  className="form-input"
                  value={formData.street}
                  onChange={(e) => setFormData((prev) => ({ ...prev, street: e.target.value }))}
                  placeholder="Street name"
                />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <input
                  className="form-input"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City"
                />
              </div>
            </div>

            {lookupStatus !== 'idle' && (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '-4px' }}>
                {lookupStatus === 'loading' && 'Looking up address...'}
                {lookupStatus === 'found' && 'Address auto-filled from postcode + house number.'}
                {lookupStatus === 'error' && 'No address found for this postcode + house number.'}
              </p>
            )}

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Restaurant Name"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Slug</label>
                <input
                  className="form-input"
                  value={formData.slug}
                  onChange={(e) => setFormData((prev) => ({ ...prev, slug: e.target.value }))}
                  placeholder="restaurant-name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Address (auto)</label>
              <input
                className="form-input"
                value={buildAddress(formData) || formData.address}
                readOnly
              />
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Latitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={formData.lat}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lat: e.target.value }))}
                  placeholder="52.3676"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude</label>
                <input
                  className="form-input"
                  type="number"
                  step="any"
                  value={formData.lng}
                  onChange={(e) => setFormData((prev) => ({ ...prev, lng: e.target.value }))}
                  placeholder="4.9041"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input form-textarea"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the restaurant..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Why This Place (Curated reason)</label>
              <textarea
                className="form-input form-textarea"
                value={formData.why_curated}
                onChange={(e) => setFormData((prev) => ({ ...prev, why_curated: e.target.value }))}
                placeholder="What makes this place special..."
              />
            </div>

            <ImageUpload
              label="Hero Image"
              value={formData.hero_image_url}
              onChange={(url) => setFormData((prev) => ({ ...prev, hero_image_url: url }))}
              folder="heroes"
              helpText="Main image shown on the location card and detail page"
            />

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="chips" style={{ marginTop: '8px' }}>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    className={`chip chip--${tag.kind} ${formData.tag_ids.includes(tag.id) ? 'chip--active' : ''}`}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        tag_ids: prev.tag_ids.includes(tag.id)
                          ? prev.tag_ids.filter((id) => id !== tag.id)
                          : [...prev.tag_ids, tag.id],
                      }));
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="admin-form-row">
              <div className="form-group">
                <label className="form-label">Featured Rank</label>
                <input
                  className="form-input"
                  type="number"
                  value={formData.featured_rank}
                  onChange={(e) => setFormData((prev) => ({ ...prev, featured_rank: e.target.value }))}
                  placeholder="Lower = higher priority"
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '24px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData((prev) => ({ ...prev, is_published: e.target.checked }))}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 500 }}>Published</span>
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
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

      <table className="admin-table">
        <thead>
          <tr>
            <th style={{ width: 60 }}></th>
            <th>Name</th>
            <th>City</th>
            <th>Price</th>
            <th>Rank</th>
            <th>Status</th>
            <th style={{ width: 200 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {locations.map((location) => (
            <tr key={location.id}>
              <td>
                {location.hero_image_url ? (
                  <img
                    src={location.hero_image_url}
                    alt=""
                    style={{
                      width: 48,
                      height: 36,
                      objectFit: 'cover',
                      borderRadius: 6,
                      display: 'block',
                    }}
                  />
                ) : (
                  <div style={{
                    width: 48,
                    height: 36,
                    borderRadius: 6,
                    background: 'var(--bg-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    📷
                  </div>
                )}
              </td>
              <td>
                <strong>{location.name}</strong>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {location.tags?.slice(0, 2).map(t => t.name).join(', ')}
                </div>
              </td>
              <td>{location.city || ''}</td>
              <td style={{ color: 'var(--success)', fontWeight: 600 }}>
                {'$'.repeat(location.price_level || 0)}
              </td>
              <td>{location.featured_rank || '—'}</td>
              <td>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '100px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: location.is_published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                  color: location.is_published ? 'var(--success)' : 'var(--text-muted)'
                }}>
                  {location.is_published ? 'Published' : 'Draft'}
                </span>
              </td>
              <td>
                <button className="btn btn--ghost btn--small" onClick={() => togglePublish(location)}>
                  {location.is_published ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn btn--ghost btn--small" onClick={() => startEdit(location)}>
                  Edit
                </button>
                <button className="btn btn--ghost btn--small" onClick={() => handleDelete(location)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
