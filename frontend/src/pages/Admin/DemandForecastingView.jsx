import React, { useState, useEffect } from 'react';
import { forecastAPI, catalogAPI } from '../../api/endpoints';
import { EmptyState } from '../../components/EmptyState';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { TrendingUp, Cpu, Layers, Database, MapPin, Zap } from 'lucide-react';

export const DemandForecastingView = () => {
  const [features, setFeatures] = useState([]);
  const [predictions, setPredictive] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts();
  }, [selectedCat]);

  const fetchForecasts = async () => {
    setLoading(true);
    try {
      const catRes = await catalogAPI.getCategories();
      if (catRes.success) setCategories(catRes.data);

      const featRes = await forecastAPI.getDemandFeatures(90, selectedCat);
      if (featRes.success) setFeatures(featRes.data);

      const predRes = await forecastAPI.getPredictiveDemand(7, selectedCat);
      if (predRes.success) setPredictive(predRes.data);
    } catch (err) {
      console.error('Failed to load forecasting analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold uppercase mb-2">
              <Cpu className="w-3.5 h-3.5" /> Machine Learning Feature Engineering Engine
            </span>
            <h1 className="text-2xl font-bold">AI-Ready Demand Forecasting & Surge Analytics</h1>
            <p className="text-xs text-slate-400 mt-1">
              Structured time-series features and geo-grid demand density matrices formatted for ML model training
            </p>
          </div>

          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="p-2.5 rounded-xl border border-slate-700 text-xs font-semibold bg-slate-800 text-white outline-none"
          >
            <option value="">All Categories Filter</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Predictive Density Hotspots */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Projected Demand Density & Surge Multipliers
        </h2>

        {loading ? (
          <LoadingSpinner message="Calculating time-series demand projections..." />
        ) : predictions.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="Insufficient Historical Booking Data"
            description="The database currently has no booking history records. As customer bookings accumulate, ML density forecasts will populate automatically."
          />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictions.map((p, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-800 text-sm">{p.category_name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                    {p.demand_zone_level}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                  <div className="flex justify-between">
                    <span>Grid Location:</span>
                    <strong>{p.grid_lat}, {p.grid_lon}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>30-Day Volume:</span>
                    <strong>{p.historical_booking_count} bookings</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>7-Day Projection:</span>
                    <strong className="text-emerald-600">{p.projected_demand_units} units</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Surge Multiplier:</span>
                    <strong className="text-amber-600">{p.peak_surge_multiplier}x</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ML Feature Dataset Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-indigo-600" /> AI/ML Training Feature Dataset Vector ({features.length} feature rows)
        </h2>

        {loading ? (
          <LoadingSpinner message="Aggregating ML feature vectors..." />
        ) : features.length === 0 ? (
          <EmptyState
            icon={Database}
            title="Feature Matrix Empty"
            description="No demand feature rows found in database."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="p-3">Geo Grid (Lat, Lon)</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Skill</th>
                  <th className="p-3">Day of Week</th>
                  <th className="p-3">Hour Slot</th>
                  <th className="p-3">Total Demand</th>
                  <th className="p-3">Completion Ratio</th>
                  <th className="p-3">Gross Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {features.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-slate-800">{f.grid_lat}, {f.grid_lon}</td>
                    <td className="p-3 font-semibold text-slate-700">{f.category_name}</td>
                    <td className="p-3 text-slate-600">{f.skill_name}</td>
                    <td className="p-3 text-slate-600">Day {f.day_of_week}</td>
                    <td className="p-3 text-slate-600">{f.hour_of_day}:00</td>
                    <td className="p-3 font-bold text-slate-900">{f.total_bookings}</td>
                    <td className="p-3 text-emerald-600 font-bold">{f.completion_rate ? `${(f.completion_rate * 100).toFixed(0)}%` : '0%'}</td>
                    <td className="p-3 font-extrabold text-slate-800">${f.total_gross_value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
