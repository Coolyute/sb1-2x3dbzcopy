import React from 'react';
import { useData } from '../context/DataContext';
import { EditableMeetName } from '../components/dashboard/EditableMeetName';
import { TeamPointsDisplay } from '../components/shared/TeamPointsDisplay';
import { TopAthletes } from '../components/dashboard/TopAthletes';
import { Users, Trophy, School, Calendar, ChevronUp, ChevronDown } from 'lucide-react';

export function DashboardView() {
  const { schools, athletes, trackEvents } = useData();

  // Calculate statistics
  const totalSchools = schools.length;
  const totalEvents = trackEvents.length;
  const totalAthletes = athletes.length;

  const athletesByAgeGroup = {
    'U9': athletes.filter(a => a.ageCategory === 'U9').length,
    'U11': athletes.filter(a => a.ageCategory === 'U11').length,
    'U13': athletes.filter(a => a.ageCategory === 'U13').length,
    'U15': athletes.filter(a => a.ageCategory === 'U15').length,
    'Open': athletes.filter(a => a.ageCategory === 'Open').length,
  };

  const maleAthletes = athletes.filter(a => a.gender === 'M').length;
  const femaleAthletes = athletes.filter(a => a.gender === 'F').length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <EditableMeetName />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Meet Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-800">Meet Statistics</h2>
          
          {/* Key Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <School className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Schools</p>
                  <p className="text-2xl font-bold text-blue-700">{totalSchools}</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <Trophy className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Events</p>
                  <p className="text-2xl font-bold text-green-700">{totalEvents}</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Athletes</p>
                  <p className="text-2xl font-bold text-purple-700">{totalAthletes}</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 mr-3 flex items-center justify-center">
                  <div className="flex flex-col items-center">
                    <ChevronUp className="w-4 h-4 text-pink-500" />
                    <ChevronDown className="w-4 h-4 text-blue-500 -mt-1" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender Split</p>
                  <p className="text-lg font-bold text-orange-700">
                    {femaleAthletes}F / {maleAthletes}M
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Age Categories */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Age Categories</h3>
            <div className="grid grid-cols-5 gap-3">
              {Object.entries(athletesByAgeGroup).map(([category, count]) => (
                <div key={category} className="bg-white rounded-lg p-3 text-center shadow-sm">
                  <p className="text-xs font-medium text-gray-600 mb-1">{category}</p>
                  <p className="text-lg font-bold text-indigo-600">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Points Standing */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Points Standing</h2>
          <TeamPointsDisplay variant="dashboard" />
        </div>

        {/* Top Athletes */}
        <div>
          <TopAthletes />
        </div>
      </div>
    </div>
  );
}