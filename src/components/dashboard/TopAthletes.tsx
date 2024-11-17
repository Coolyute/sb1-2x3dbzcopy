import React from 'react';
import { Medal } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function TopAthletes() {
  const { athletes, schools, trackEvents } = useData();
  const [finalPositions] = useLocalStorage('finalPositions', {});
  const [heats] = useLocalStorage('heats', []);

  // Points system
  const pointsMap: Record<number, number> = {
    1: 9,
    2: 7,
    3: 6,
    4: 5,
    5: 4,
    6: 3,
    7: 2,
    8: 1
  };

  // Calculate athlete results and aggregate by athlete
  const athleteResultsMap = new Map();

  // Process all events
  trackEvents.forEach(event => {
    if (event.type === 'relay') return; // Skip relay events

    const eventHeats = heats.filter(heat => heat.eventId === event.id);
    const allLanes = eventHeats.flatMap(heat => heat.lanes);
    
    // Get finalists with positions
    allLanes
      .filter(lane => {
        const position = finalPositions[`${event.id}-${lane.athleteId}`];
        return position !== undefined;
      })
      .forEach(lane => {
        const position = finalPositions[`${event.id}-${lane.athleteId}`];
        const athlete = athletes.find(a => a.id === lane.athleteId);
        const school = schools.find(s => s.id === athlete?.schoolId);

        if (athlete && school && position) {
          const points = pointsMap[position] || 0;
          const result = {
            name: athlete.name,
            school: school.name,
            event: `${event.gender === 'M' ? 'Boys' : 'Girls'} ${event.ageGroup} ${event.name}`,
            position,
            points,
            ageGroup: athlete.ageCategory,
            gender: athlete.gender
          };

          // Get or create athlete's entry in the map
          if (!athleteResultsMap.has(athlete.id)) {
            athleteResultsMap.set(athlete.id, {
              name: athlete.name,
              school: school.name,
              ageGroup: athlete.ageCategory,
              gender: athlete.gender,
              totalPoints: 0,
              events: []
            });
          }

          const athleteEntry = athleteResultsMap.get(athlete.id);
          athleteEntry.totalPoints += points;
          athleteEntry.events.push(result);
          athleteResultsMap.set(athlete.id, athleteEntry);
        }
      });
  });

  // Group athletes by age category and gender
  const athletesByCategory = Array.from(athleteResultsMap.values()).reduce((acc, athlete) => {
    const key = `${athlete.gender}-${athlete.ageGroup}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(athlete);
    return acc;
  }, {} as Record<string, any[]>);

  // Sort each category by points and get the top athlete
  const ageGroups = ['U9', 'U11', 'U13', 'U15', 'Open'];
  const genders = ['F', 'M'];
  const topAthletes = [];

  ageGroups.forEach(ageGroup => {
    genders.forEach(gender => {
      const key = `${gender}-${ageGroup}`;
      if (athletesByCategory[key]) {
        const sortedAthletes = athletesByCategory[key].sort((a, b) => b.totalPoints - a.totalPoints);
        if (sortedAthletes.length > 0) {
          topAthletes.push(sortedAthletes[0]);
        }
      }
    });
  });

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  if (topAthletes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Athletes</h3>
        <div className="text-center text-gray-500">
          No results available yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Athletes</h3>
      <div className="space-y-6">
        {topAthletes.map((athlete) => (
          <div key={`${athlete.gender}-${athlete.ageGroup}`} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <div className="flex items-center">
                  <span className="font-semibold text-lg">
                    {athlete.name} - {athlete.school}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {athlete.gender === 'M' ? 'Boys' : 'Girls'} {athlete.ageGroup}
                </div>
              </div>
              <div className="text-xl font-bold text-blue-600">
                {athlete.totalPoints} pts
              </div>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="text-xs text-gray-500 uppercase">
                  <th className="text-left py-2">Event</th>
                  <th className="text-center py-2">Position</th>
                  <th className="text-right py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {athlete.events
                  .sort((a, b) => b.points - a.points)
                  .map((event, i) => (
                    <tr key={i} className="border-t border-gray-200">
                      <td className="py-2 text-left">{event.event}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-flex items-center ${getMedalColor(event.position)}`}>
                          {event.position}
                          {event.position <= 3 && (
                            <Medal className="w-4 h-4 ml-1" />
                          )}
                        </span>
                      </td>
                      <td className="py-2 text-right font-medium">{event.points}</td>
                    </tr>
                  ))}
                <tr className="border-t-2 border-gray-300">
                  <td colSpan={2} className="py-2 text-right font-semibold">Total Points:</td>
                  <td className="py-2 text-right font-bold">{athlete.totalPoints}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}