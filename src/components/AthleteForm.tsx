import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';
import { Athlete } from '../types';
import { useData } from '../context/DataContext';
import { calculateAgeCategory, getAgeCategoryYears } from '../utils/categoryUtils';

interface AthleteFormProps {
  athlete?: Athlete;
  onSubmit: (athlete: Omit<Athlete, 'id'>) => void;
  onClose: () => void;
}

export function AthleteForm({ athlete, onSubmit, onClose }: AthleteFormProps) {
  const { schools } = useData();
  const [formData, setFormData] = useState({
    name: athlete?.name || '',
    dateOfBirth: athlete?.dateOfBirth || '',
    gender: athlete?.gender || 'M',
    schoolId: athlete?.schoolId || '',
    events: athlete?.events || [],
    ageCategory: athlete?.ageCategory || 'U13',
    personalBests: athlete?.personalBests || {}
  });

  const [showAgeInfo, setShowAgeInfo] = useState(false);
  const currentYear = new Date().getFullYear();
  const ageCategories = getAgeCategoryYears(currentYear);

  // Update age category when date of birth changes
  useEffect(() => {
    if (formData.dateOfBirth) {
      const category = calculateAgeCategory(formData.dateOfBirth);
      setFormData(prev => ({ ...prev, ageCategory: category }));
    }
  }, [formData.dateOfBirth]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {athlete ? 'Edit Athlete' : 'Add New Athlete'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <button
                type="button"
                onClick={() => setShowAgeInfo(!showAgeInfo)}
                className="text-gray-400 hover:text-gray-500"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            {showAgeInfo && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                <h4 className="font-medium text-blue-800 mb-2">Age Categories for {currentYear}:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>U9: Born {ageCategories['U9'].start}-{ageCategories['U9'].end}</li>
                  <li>U11: Born {ageCategories['U11'].start}-{ageCategories['U11'].end}</li>
                  <li>U13: Born {ageCategories['U13'].start}-{ageCategories['U13'].end}</li>
                  <li>U15: Born {ageCategories['U15'].start}-{ageCategories['U15'].end}</li>
                  <li>Open: Born {ageCategories['Open'].end} or earlier</li>
                </ul>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Age Category (Auto-calculated)</label>
            <input
              type="text"
              value={formData.ageCategory}
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm text-gray-500"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="M">Male</option>
              <option value="F">Female</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <select
              value={formData.schoolId}
              onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {athlete ? 'Save Changes' : 'Add Athlete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}