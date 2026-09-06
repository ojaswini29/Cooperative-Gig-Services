import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CreateBookingModal } from './CreateBookingModal';
import { Wrench, PlusCircle, Search, Layers, DollarSign } from 'lucide-react';

export const BrowseServices = () => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSkillForBooking, setSelectedSkillForBooking] = useState(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const catRes = await catalogAPI.getCategories();
      if (catRes.success) {
        setCategories(catRes.data);
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

  const filteredSkills = selectedCategory
    ? skills.filter((s) => s.category_id === selectedCategory)
    : skills;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-2xl font-bold text-slate-800">Browse Cooperative Services</h1>
        <p className="text-sm text-slate-500 mt-1">Explore service categories and skills with transparent base hourly rates</p>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === ''
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Categories ({skills.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat.name} ({skills.filter((s) => s.category_id === cat.id).length})
            </button>
          ))}
        </div>
      )}

      {/* Skills Grid */}
      {loading ? (
        <LoadingSpinner message="Loading service catalog..." />
      ) : skills.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="Service Catalog is Empty"
          description="There are currently no service categories or skills added to the database. An admin can add them from the Admin Portal."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => (
            <div
              key={skill.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
                    {skill.category_name || 'Category'}
                  </span>
                  <div className="text-right">
                    <div className="text-xl font-black text-emerald-600">${skill.base_hourly_rate}</div>
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Base Hourly Rate</div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{skill.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  {skill.description || 'Professional cooperative service provided by verified local gig workers.'}
                </p>
              </div>

              <button
                onClick={() => setSelectedSkillForBooking(skill)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" /> Book This Service
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedSkillForBooking && (
        <CreateBookingModal
          isOpen={!!selectedSkillForBooking}
          onClose={() => setSelectedSkillForBooking(null)}
          preselectedSkill={selectedSkillForBooking}
          onBookingCreated={() => {
            alert('Booking request created successfully!');
          }}
        />
      )}
    </div>
  );
};
