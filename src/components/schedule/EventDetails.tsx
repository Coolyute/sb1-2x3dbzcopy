import React from 'react';
import { X, Medal } from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { laneAssignmentOrder } from '../../utils/laneUtils';

interface EventDetailsProps {
  eventName: string;
  category: string;
  onClose: () => void;
  eventType: 'heat' | 'final';
}

export function EventDetails({ eventName, category, onClose, eventType }: EventDetailsProps) {
  const { athletes, schools, trackEvents } = useData();
  const [heats] = useLocalStorage('heats', []);
  const [finalPositions] = useLocalStorage('finalPositions', {});

  // Find the corresponding event
  const findMatchingEvent = () => {
    const gender = category === 'Girls' ? 'F' : 'M';
    const ageGroup = eventName.split(' - ')[0];
    const type = eventName.includes('4 X 100m') || eventName.includes('Medley') ? 'relay' : 'track';
    
    return trackEvents.find(e => 
      e.gender === gender && 
      e.ageGroup === ageGroup &&
      e.type === type
    );
  };

  const event = findMatchingEvent();
  const eventHeats = event ? heats.filter(heat => heat.eventId === event.id) : [];
  const isRelay = eventName.toLowerCase().includes('4 x 100m') || eventName.toLowerCase().includes('medley');

  // Get finalists from heats
  const getFinalists = () => {
    if (!event) return [];

    const allLanes = eventHeats.flatMap(heat => heat.lanes);
    
    // Get top 8 athletes/teams from heats
    const finalists = allLanes
      .filter(lane => lane.position !== undefined)
      .sort((a, b) => (a.position || 0) - (b.position || 0))
      .slice(0, 8)
      .map((lane, index) => ({
        ...lane,
        lane: laneAssignmentOrder[index],
        finalPosition: finalPositions[`${event.id}-${lane.athleteId}`]
      }))
      .sort((a, b) => a.lane - b.lane);

    return finalists;
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-gray-400';
      case 3: return 'text-orange-500';
      default: return 'text-gray-400';
    }
  };

  const finalists = eventType === 'final' ? getFinalists() : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-semibold text-gray-900">
            {category} {eventName}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(100vh-200px)]">
          {eventType === 'final' ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Final</h4>
              <table className="min-w-full">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase">
                    <th className="text-left py-2">Lane</th>
                    <th className="text-left py-2">{isRelay ? 'School' : 'Name'}</th>
                    {!isRelay && <th className="text-left py-2">School</th>}
                    <th className="text-center py-2">Position</th>
                  </tr>
                </thead>
                <tbody>
                  {finalists.map(finalist => {
                    if (isRelay) {
                      const school = schools.find(s => s.id === finalist.athleteId);
                      return (
                        <tr key={`${finalist.lane}-${finalist.athleteId}`} className="border-t border-gray-200">
                          <td className="py-2">{finalist.lane}</td>
                          <td className="py-2">{school?.name || '-'}</td>
                          <td className="py-2 text-center">
                            {finalist.finalPosition ? (
                              <span className="inline-flex items-center">
                                {finalist.finalPosition}
                                {finalist.finalPosition <= 3 && (
                                  <Medal className={`w-4 h-4 ml-1 ${getMedalColor(finalist.finalPosition)}`} />
                                )}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    } else {
                      const athlete = athletes.find(a => a.id === finalist.athleteId);
                      const school = schools.find(s => s.id === athlete?.schoolId);
                      return (
                        <tr key={`${finalist.lane}-${finalist.athleteId}`} className="border-t border-gray-200">
                          <td className="py-2">{finalist.lane}</td>
                          <td className="py-2">{athlete?.name || '-'}</td>
                          <td className="py-2">{school?.name || '-'}</td>
                          <td className="py-2 text-center">
                            {finalist.finalPosition ? (
                              <span className="inline-flex items-center">
                                {finalist.finalPosition}
                                {finalist.finalPosition <= 3 && (
                                  <Medal className={`w-4 h-4 ml-1 ${getMedalColor(finalist.finalPosition)}`} />
                                )}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            // Heats View
            eventHeats.length > 0 ? (
              <div className="space-y-6">
                {eventHeats.map((heat, index) => (
                  <div key={heat.id} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Heat {index + 1}</h4>
                    <table className="min-w-full">
                      <thead>
                        <tr className="text-xs text-gray-500 uppercase">
                          <th className="text-left py-2">Lane</th>
                          <th className="text-left py-2">{isRelay ? 'School' : 'Name'}</th>
                          {!isRelay && <th className="text-left py-2">School</th>}
                          <th className="text-center py-2">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heat.lanes
                          .sort((a, b) => a.lane - b.lane)
                          .map(lane => {
                            if (isRelay) {
                              const school = schools.find(s => s.id === lane.athleteId);
                              return (
                                <tr key={`${lane.lane}-${lane.athleteId}`} className="border-t border-gray-200">
                                  <td className="py-2">{lane.lane}</td>
                                  <td className="py-2">{school?.name || '-'}</td>
                                  <td className="py-2 text-center">
                                    {lane.position || '-'}
                                  </td>
                                </tr>
                              );
                            } else {
                              const athlete = athletes.find(a => a.id === lane.athleteId);
                              const school = schools.find(s => s.id === athlete?.schoolId);
                              return (
                                <tr key={`${lane.lane}-${lane.athleteId}`} className="border-t border-gray-200">
                                  <td className="py-2">{lane.lane}</td>
                                  <td className="py-2">{athlete?.name || '-'}</td>
                                  <td className="py-2">{school?.name || '-'}</td>
                                  <td className="py-2 text-center">
                                    {lane.position || '-'}
                                  </td>
                                </tr>
                              );
                            }
                          })}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No heats available for this event
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}