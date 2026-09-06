import React, { useState, useEffect } from 'react';
import { catalogAPI, bookingAPI } from '../../api/endpoints';
import { Modal } from '../../components/Modal';
import { Calendar, MapPin, Clock, FileText, AlertCircle, PlusCircle } from 'lucide-react';

export const CreateBookingModal = ({ isOpen, onClose, onBookingCreated, preselectedSkill }) => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');

  const [formData, setFormData] = useState({
    service_address: '',
    latitude: 18.5204,
    longitude: 73.8567,
    scheduled_time: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
    estimated_hours: 2.0,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen]);

  const loadCategories = async () => {
    try {
      const res = await catalogAPI.getCategories();
      if (res.success) {
        setCategories(res.data);
        if (preselectedSkill) {
          setSelectedCategory(preselectedSkill.category_id);
          loadSkills(preselectedSkill.category_id);
          setSelectedSkill(preselectedSkill.id);
        } else if (res.data.length > 0) {
          setSelectedCategory(res.data[0].id);
          loadSkills(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const loadSkills = async (catId) => {
    try {
      const res = await catalogAPI.getSkills(catId);
      if (res.success) {
        setSkills(res.data);
        if (res.data.length > 0 && (!preselectedSkill || preselectedSkill.category_id !== catId)) {
          setSelectedSkill(res.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    loadSkills(catId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCategory || !selectedSkill) {
      setError('Please select both a category and a skill');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const payload = {
        category_id: selectedCategory,
        skill_id: selectedSkill,
        service_address: formData.service_address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        scheduled_time: new Date(formData.scheduled_time).toISOString(),
        estimated_hours: parseFloat(formData.estimated_hours),
        notes: formData.notes,
      };

      const res = await bookingAPI.createBooking(payload);
      if (res.success) {
        onBookingCreated(res.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Service Booking">
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          {error}
        </div>
      )}

      {categories.length === 0 ? (
        <div className="p-6 text-center text-slate-500 text-sm">
          No service categories found in the database. An admin must first add service categories & skills.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Required Skill</label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {skills.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (${s.base_hourly_rate}/hr)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Address</label>
            <div className="relative">
              <MapPin className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={formData.service_address}
                onChange={(e) => setFormData({ ...formData, service_address: e.target.value })}
                placeholder="Full address (e.g., 123 Main St, Apartment 4B)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Latitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Longitude</label>
              <input
                type="number"
                step="any"
                required
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Hours</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                required
                value={formData.estimated_hours}
                onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Instructions</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe the job details or special instructions..."
              className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {loading ? 'Creating Request...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
