import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Wrench, PlusCircle, Trash2, Edit3, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CategorySkillsAdmin = () => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // New Skill Form
  const [selectedCatId, setSelectedCatId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [baseRate, setBaseRate] = useState(25);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const catRes = await catalogAPI.getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
        if (catRes.data.length > 0) setSelectedCatId(catRes.data[0].id);
      }

      const skillRes = await catalogAPI.getSkills();
      if (skillRes.success) {
        setSkills(skillRes.data);
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const res = await catalogAPI.createCategory({ name: catName, description: catDesc });
      if (res.success) {
        setCatName('');
        setCatDesc('');
        fetchCatalog();
      }
    } catch (err) {
      setError(err.message || 'Failed to create category');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!selectedCatId) return;
    setSaving(true);
    setError('');

    try {
      const res = await catalogAPI.createSkill({
        category_id: selectedCatId,
        name: skillName,
        description: skillDesc,
        base_hourly_rate: parseFloat(baseRate),
      });

      if (res.success) {
        setSkillName('');
        setSkillDesc('');
        fetchCatalog();
      }
    } catch (err) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its skills?')) return;
    try {
      const res = await catalogAPI.deleteCategory(id);
      if (res.success) fetchCatalog();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm('Delete this skill?')) return;
    try {
      const res = await catalogAPI.deleteSkill(id);
      if (res.success) fetchCatalog();
    } catch (err) {
      alert(err.message || 'Failed to delete skill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">Service Categories & Skills Admin</h1>
        <p className="text-sm text-slate-500 mt-1">Configure service domains, skill definitions, and base hourly pricing standards</p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          {error}
        </div>
      )}

      {/* Creation Forms */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create Category */}
        <form onSubmit={handleCreateCategory} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" /> Create Service Category
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Name</label>
            <input
              type="text"
              required
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="e.g., Home Maintenance & Repairs"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
            <input
              type="text"
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              placeholder="Brief summary of category services..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> Create Category
          </button>
        </form>

        {/* Create Skill */}
        <form onSubmit={handleCreateSkill} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <Wrench className="w-5 h-5 text-teal-600" /> Create Skill under Category
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Target Category</label>
            <select
              value={selectedCatId}
              onChange={(e) => setSelectedCatId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Skill Name</label>
              <input
                type="text"
                required
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                placeholder="e.g., Electrical Wiring"
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Rate ($/hr)</label>
              <input
                type="number"
                step="0.5"
                required
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Skill Description</label>
            <input
              type="text"
              value={skillDesc}
              onChange={(e) => setSkillDesc(e.target.value)}
              placeholder="Scope of work covered..."
              className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving || categories.length === 0}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <PlusCircle className="w-4 h-4" /> Create Skill
          </button>
        </form>
      </div>

      {/* Catalog Display */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Catalog Overview ({skills.length} Skills in {categories.length} Categories)</h2>

        {loading ? (
          <LoadingSpinner message="Loading service catalog..." />
        ) : categories.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="Database Catalog is Completely Empty"
            description="No categories or skills exist in the database. Use the creation forms above to build your platform catalog."
          />
        ) : (
          <div className="space-y-6">
            {categories.map((cat) => {
              const catSkills = skills.filter((s) => s.category_id === cat.id);
              return (
                <div key={cat.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{cat.name}</h3>
                      {cat.description && <p className="text-xs text-slate-500">{cat.description}</p>}
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {catSkills.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-3 bg-white rounded-xl border border-slate-200">
                      No skills added under this category yet.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catSkills.map((sk) => (
                        <div key={sk.id} className="bg-white p-3.5 rounded-xl border border-slate-200 flex justify-between items-start">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{sk.name}</div>
                            <div className="text-xs text-emerald-600 font-bold mt-0.5">${sk.base_hourly_rate}/hr</div>
                            {sk.description && <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{sk.description}</div>}
                          </div>
                          <button
                            onClick={() => handleDeleteSkill(sk.id)}
                            className="p-1 text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Skill"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
