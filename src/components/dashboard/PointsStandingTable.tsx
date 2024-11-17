import React, { useState } from 'react';
import { Medal, List, Table } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function PointsStandingTable() {
  const { schools, athletes, trackEvents } = useData();
  const [finalPositions] = useLocalStorage('finalPositions', {});
  const [viewMode, setViewMode] = useState<'simple' | 'detailed'>('simple');

  // Points system for individual events
  const individualPointsMap: Record<number, number> = {
    1: 9, 2: 7, 3: 6, 4: 5, 5: 4, 6: 3, 7: 2, 8: 1
  };

  // Points system for relay events
  const relayPointsMap: Record<number, number> = {
    1: 12, 2: 10, 3: 8, 4: 6, 5: 5, 6: 4, 7: 3, 8: 2
  };

  const calculateTeamPoints = () => {
    const points: Record<string, number> = {};

    // Initialize points for all schools
    schools.forEach(school => {
      points[school.id] = 0;
    });

    // Calculate points from final positions
    Object.entries(finalPositions || {}).forEach(([key, position]) => {
      if (!position) return;
      
      const [eventId, participantId] = key.split('-');
      const event = trackEvents.find(e => e.id === eventId);
      
      if (!event) return;

      if (event.type === 'relay') {
        // For relay events, participantId is the school ID
        const pointsValue = relayPointsMap[position] || 0;
        points[participantId] = (points[participantId] || 0) + pointsValue;
      } else {
        // For individual events, look up the athlete's school
        const athlete = athletes.find(a => a.id === participantId);
        if (athlete) {
          const pointsValue = individualPointsMap[position] || 0;
          points[athlete.schoolId] = (points[athlete.schoolId] || 0) + pointsValue;
        }
      }
    });

    return points;
  };

  const teamPoints = calculateTeamPoints();
  const sortedTeams = schools
    .map(school => ({
      id: school.id,
      name: school.name,
      points: teamPoints[school.id] || 0
    }))
    .filter(school => school.points > 0)
    .sort((a, b) => b.points - a.points);

  const getPositionStyle = (index: number) => {
    switch (index) {
      case 0: return 'bg-yellow-50';
      case 1: return 'bg-gray-50';
      case 2: return 'bg-orange-50';
      default: return '';
    }
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  if (sortedTeams.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No team points available
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Team Points</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('simple')}
            className={`p-2 rounded-lg ${
              viewMode === 'simple' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Simple View"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('detailed')}
            className={`p-2 rounded-lg ${
              viewMode === 'detailed' 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:bg-gray-100'
            }`}
            title="Detailed View"
          >
            <Table className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedTeams.map((team, index) => (
              <tr key={team.id} className={getPositionStyle(index)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    {index < 3 && <Medal className={`w-5 h-5 mr-2 ${getMedalColor(index + 1)}`} />}
                    <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{team.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="text-sm font-bold text-gray-900">{team.points}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}