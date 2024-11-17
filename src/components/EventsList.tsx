import React from 'react';
import { TrackEvent } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { sortEvents } from '../utils/sortUtils';

interface EventsListProps {
  events: TrackEvent[];
  selectedEvent: string | null;
  onEventSelect: (eventId: string) => void;
  onGenerateHeats: (eventId: string) => void;
  activeTab: 'individual' | 'relay';
  onTabChange: (tab: 'individual' | 'relay') => void;
}

export function EventsList({
  events,
  selectedEvent,
  onEventSelect,
  onGenerateHeats,
  activeTab,
  onTabChange
}: EventsListProps) {
  const [heats] = useLocalStorage('heats', []);

  // Filter events based on the active tab
  const filteredEvents = events.filter(event => 
    activeTab === 'relay' ? event.type === 'relay' : event.type !== 'relay'
  );

  // Sort events by age group, gender, and name
  const sortedEvents = sortEvents(filteredEvents);

  const handleGenerateHeats = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const existingHeats = heats.some(heat => heat.eventId === eventId);
    
    if (existingHeats) {
      const confirmed = window.confirm(
        'This event already has heats assigned. Generating new heats will replace the existing ones. Do you want to continue?'
      );
      if (!confirmed) return;
    }
    
    onGenerateHeats(eventId);
  };

  return (
    <div className="w-1/4 border-r bg-white p-4 overflow-y-auto">
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => onTabChange('individual')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'individual'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Individual Events
          </button>
          <button
            onClick={() => onTabChange('relay')}
            className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg ${
              activeTab === 'relay'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Relay Events
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortedEvents.map(event => {
          const hasExistingHeats = heats.some(heat => heat.eventId === event.id);
          const displayName = `${event.gender === 'M' ? 'Boys' : 'Girls'} ${event.ageGroup} - ${event.name}`;
          
          return (
            <div
              key={event.id}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                selectedEvent === event.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onEventSelect(event.id)}
            >
              <div className="flex items-center justify-between">
                <span className="flex-1">{displayName}</span>
                {selectedEvent === event.id && (
                  <button
                    onClick={(e) => handleGenerateHeats(event.id, e)}
                    className={`px-3 py-1 text-sm rounded ${
                      hasExistingHeats
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white ml-2`}
                  >
                    {hasExistingHeats ? 'Regenerate Heats' : 'Generate Heats'}
                  </button>
                )}
              </div>
              {hasExistingHeats && (
                <div className="mt-1 text-xs text-gray-500">
                  Heats already assigned
                </div>
              )}
            </div>
          );
        })}

        {sortedEvents.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No {activeTab} events available
          </div>
        )}
      </div>
    </div>
  );
}