import React, { useState, useEffect } from 'react';
import { catalogAPI, workerAPI } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Wrench, PlusCircle, Trash2, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';

export const WorkerSkillsManager = () => {
  const [workerSkills, setWorkerSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [hourlyRate, setHourlyRate] = useState(30);
  const [experienceYears, setExperienceYears] = useState(3);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchSkillsData();
  }, []);

  const fetchSkillsData = async () => {
    setLoading(true);
    try {
      const profRes = await workerAPI.getProfile();
      if (profRes.success && profRes.data.skills) {
        setWorkerSkills(profRes.data.skills);
      }

      const allRes = await catalogAPI.getSkills();
      if (allRes.success) {
        setAllSkills(allRes.data);
        if (allRes.data.length > 0) {
          setSelectedSkillId(allRes.data[0].id);
          setHourlyRate(allRes.data[0].base_hourly_rate);
        }
      }
    } catch (err) {
      console.error('Failed to load skills:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!selectedSkillId) return;
    setSaving(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await workerAPI.addSkill({
        skill_id: selectedSkillId,
        hourly_rate: parseFloat(hourlyRate),
        experience_years: parseInt(experienceYears, 10),
      });

      if (res.success) {
        setSuccessMsg('Skill attached to your profile successfully!');
        fetchSkillsData();
      }
    } catch (err) {
      setError(err.message || 'Failed to attach skill');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSkill = async (skillId) => {
    if (!window.confirm('Remove this skill from your profile?')) return;
    try {
      const res = await workerAPI.removeSkill(skillId);
      if (res.success) {
        fetchSkillsData();
      }
    } catch (err) {
      alert(err.message || 'Failed to remove skill');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">My Skills & Hourly Rates</h1>
        <p className="text-sm text-slate-500 mt-1">
          Attach skills to receive matching customer booking requests and set your custom hourly rates
        </p>
      </div>

      {/* Add Skill Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-emerald-600" /> Add Skill Offering
        </h2>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {successMsg}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            {error}
          </div>
        )}

        {allSkills.length === 0 ? (
          <p className="text-xs text-slate-500 italic">
            No global skills exist in the database catalog yet. An admin must create categories and skills first.
          </p>
        ) : (
          <form onSubmit={handleAddSkill} className="grid sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Skill</label>
              <select
                value={selectedSkillId}
                onChange={(e) => {
                  setSelectedSkillId(e.target.value);
                  const sk = allSkills.find((s) => s.id === e.target.value);
                  if (sk) setHourlyRate(sk.base_hourly_rate);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {allSkills.map((sk) => (
                  <option key={sk.id} value={sk.id}>
                    {sk.name} ({sk.category_name || 'Category'}) - Base: ${sk.base_hourly_rate}/hr
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">My Hourly Rate ($)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                required
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Years Experience</label>
              <input
                type="number"
                min="0"
                required
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                {saving ? 'Adding Skill...' : 'Save Skill Offering'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Active Worker Skills */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-emerald-600" /> Active Profile Skills ({workerSkills.length})
        </h2>

        {loading ? (
          <LoadingSpinner message="Fetching worker skills..." />
        ) : workerSkills.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No Skills Attached To Profile"
            description="You have not added any skills to your worker profile yet. Use the form above to add your service offerings."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workerSkills.map((sk) => (
              <div key={sk.skill_id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-start">
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">{sk.category_name || 'Category'}</div>
                  <h4 className="font-bold text-slate-800 text-base">{sk.skill_name || 'Skill'}</h4>
                  <div className="text-xs text-slate-500 mt-1">
                    Rate: <strong className="text-emerald-600">${sk.hourly_rate}/hr</strong> | Exp: <strong>{sk.experience_years} yrs</strong>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveSkill(sk.skill_id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="Remove Skill"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
