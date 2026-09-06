import React, { useState, useEffect } from 'react';
import { workerAPI } from '../../api/endpoints';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { FileCheck, MapPin, Shield, Truck, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

export const WorkerProfileSetup = () => {
  const [formData, setFormData] = useState({
    bio: '',
    latitude: 18.5204,
    longitude: 73.8567,
    address: '',
    vehicle_type: '',
    insurance_provider: '',
    insurance_policy_number: '',
    identity_document_url: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await workerAPI.getProfile();
      if (res.success && res.data) {
        setFormData({
          bio: res.data.bio || '',
          latitude: res.data.latitude || 18.5204,
          longitude: res.data.longitude || 73.8567,
          address: res.data.address || '',
          vehicle_type: res.data.vehicle_type || '',
          insurance_provider: res.data.insurance_provider || '',
          insurance_policy_number: res.data.insurance_policy_number || '',
          identity_document_url: res.data.identity_document_url || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await workerAPI.updateProfile({
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      });

      if (res.success) {
        setSuccessMsg('Worker profile and documentation updated successfully!');
      }
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile configuration..." />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">Worker Profile & Identity Documentation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your professional bio, base geolocation, vehicle type, and mutual insurance details
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Professional Bio & Experience Summary</label>
          <textarea
            rows={4}
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            placeholder="Brief description of your skills, training, certifications, and service experience..."
            className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Operating Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="e.g., 456 Worker Colony, Sector 5"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle / Transportation Mode</label>
            <input
              type="text"
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              placeholder="e.g., Electric Scooter, Van, Bicycle, Walking"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitude Coordinate</label>
            <input
              type="number"
              step="any"
              value={formData.latitude}
              onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitude Coordinate</label>
            <input
              type="number"
              step="any"
              value={formData.longitude}
              onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Provider Name</label>
            <input
              type="text"
              value={formData.insurance_provider}
              onChange={(e) => setFormData({ ...formData, insurance_provider: e.target.value })}
              placeholder="e.g., Coop Worker Mutual Safety Fund"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Insurance Policy Number</label>
            <input
              type="text"
              value={formData.insurance_policy_number}
              onChange={(e) => setFormData({ ...formData, insurance_policy_number: e.target.value })}
              placeholder="e.g., POL-COOP-889900"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Identity Verification Document Link (URL)</label>
          <input
            type="url"
            value={formData.identity_document_url}
            onChange={(e) => setFormData({ ...formData, identity_document_url: e.target.value })}
            placeholder="https://example.com/docs/worker-license.pdf"
            className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <p className="text-[11px] text-slate-400 mt-1">Cooperative Admins inspect this URL to verify your worker profile.</p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
