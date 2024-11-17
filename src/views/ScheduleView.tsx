import React, { useState } from 'react';
import { Timer } from 'lucide-react';
import { EventDetails } from '../components/schedule/EventDetails';
import { useData } from '../context/DataContext';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SelectedEvent {
  name: string;
  category: string;
  type: 'heat' | 'final';
}

const events = [
  // Finals - Opening Distance Events
  { type: 'final', name: '1200m Open', categories: ['Girls', 'Boys'] },
  
  // Heats
  { type: 'heat', name: 'U9 - 80m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U11 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U13 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U15 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U9 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U11 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U13 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U15 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U13 - 400m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U15 - 400m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U9 - 150m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U11 - 200m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U13 - 200m', categories: ['Girls', 'Boys'] },
  { type: 'heat', name: 'U15 - 200m', categories: ['Girls', 'Boys'] },

  // Mid-Distance Final
  { type: 'final', name: '800m Open', categories: ['Girls', 'Boys'] },

  // Finals
  { type: 'final', name: 'U13 - 400m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U15 - 400m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U9 - 80m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U11 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U13 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U15 - 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U9 - 150m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U11 - 200m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U13 - 200m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U15 - 200m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U9 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U11 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U13 - 4 X 100m', categories: ['Girls', 'Boys'] },
  { type: 'final', name: 'U15 - 4 X 100m', categories: ['Girls', 'Boys'] },
  
  // Medley Finals
  { type: 'final', name: 'Sprint Medley Open (100m x 100m x 200m x 400m)', categories: ['Girls'] },
  { type: 'final', name: 'Distance Medley Open (400m x 200m x 200m x 800m)', categories: ['Boys'] }
];

export function ScheduleView() {
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const { trackEvents } = useData();
  const [eventHeats] = useLocalStorage('heats', []);

  const hasEventList = (eventName: string, category: string) => {
    const gender = category === 'Girls' ? 'F' : 'M';
    const ageGroup = eventName.split(' - ')[0];
    const eventType = eventName.includes('4 X 100m') || eventName.includes('Medley') ? 'relay' : 'track';
    
    const event = trackEvents.find(e => 
      e.gender === gender && 
      e.ageGroup === ageGroup &&
      e.type === eventType
    );

    if (!event) return false;
    
    // Check if there are any heats for this event
    return eventHeats.some(heat => heat.eventId === event.id);
  };

  const renderEvent = (event: typeof events[0], eventNumber: number) => {
    return (
      <div key={`${event.name}-${eventNumber}`} className="mb-4">
        {event.categories.map((category, index) => {
          // Special handling for medley events
          const isMedley = event.name.includes('Medley');
          const displayNumber = isMedley ? 
            (category === 'Girls' ? '15.1' : '15.2') : 
            `${eventNumber}.${index + 1}`;

          const hasList = hasEventList(event.name, category);

          return (
            <div
              key={`${event.name}-${category}`}
              className={`flex items-center p-3 ${
                index === 0 ? 'mb-1' : ''
              } ${
                event.type === 'final' 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'bg-gray-50 dark:bg-gray-800/40'
              } rounded-lg cursor-pointer hover:bg-opacity-80`}
              onClick={() => setSelectedEvent({ 
                name: event.name, 
                category,
                type: event.type as 'heat' | 'final'
              })}
            >
              <div className="w-12 text-center">
                <span className="text-sm font-medium text-gray-500">
                  {displayNumber}
                </span>
              </div>
              <div className="flex-1">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {category} {event.name}
                </span>
              </div>
              <div className={`text-sm ${hasList ? 'font-bold text-gray-900' : 'text-gray-500 dark:text-gray-400'}`}>
                {event.type.toUpperCase()}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Group events by section
  const openingEvents = events.filter(e => e.name.includes('1200m'));
  const heatEvents = events.filter(e => e.type === 'heat');
  const midDistanceEvents = events.filter(e => e.name === '800m Open');
  const regularFinals = events.filter(e => 
    e.type === 'final' && 
    !e.name.includes('1200m') && 
    !e.name.includes('800m') &&
    !e.name.includes('Medley')
  );
  const medleyFinals = events.filter(e => e.name.includes('Medley'));

  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <Timer className="w-8 h-8 mr-3 text-blue-600" />
          Schedule of Events
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Events are listed in order of execution. Click on an event to view details.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Opening Distance Events */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
            Opening Distance Events
          </h3>
          {openingEvents.map((event, index) => renderEvent(event, index + 1))}
        </div>

        {/* Heats Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
            Heats
          </h3>
          {heatEvents.map((event, index) => renderEvent(event, index + 2))}
        </div>

        {/* Mid-Distance Events */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
            Mid-Distance Events
          </h3>
          {midDistanceEvents.map((event, index) => renderEvent(event, index + heatEvents.length + 2))}
        </div>

        {/* Finals Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
            Finals
          </h3>
          {regularFinals.map((event, index) => 
            renderEvent(event, index + heatEvents.length + midDistanceEvents.length + 3)
          )}
        </div>

        {/* Medley Finals Section */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
            Medley Finals
          </h3>
          {medleyFinals.map((event) => renderEvent(event, 15))}
        </div>
      </div>

      {selectedEvent && (
        <EventDetails
          eventName={selectedEvent.name}
          category={selectedEvent.category}
          eventType={selectedEvent.type}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}