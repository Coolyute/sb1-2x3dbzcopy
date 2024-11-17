import React, { useState } from "react";
import { Users } from "lucide-react";
import { useData } from "../context/DataContext";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { EventsList } from "../components/EventsList";
import { HeatCard } from "../components/HeatCard";
import { AddAthleteModal } from "../components/AddAthleteModal";
import { sortEvents } from "../utils/sortUtils";
import { shouldSkipHeats, generateDirectFinals, generateHeats } from "../utils/heatUtils";

interface EditingPosition {
  heatId: string;
  athleteId: string;
  position?: number;
}

export function HeatsView() {
  const { athletes, schools, setSchools, trackEvents, relayEntries, setRelayEntries } = useData();
  const [heats, setHeats] = useLocalStorage('heats', []);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [editingPosition, setEditingPosition] = useState<EditingPosition | null>(null);
  const [activeHeats, setActiveHeats] = useState<string | null>(null);
  const [showAddAthleteModal, setShowAddAthleteModal] = useState(false);
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'individual' | 'relay'>('individual');

  // Filter and sort events based on the active tab
  const filteredAndSortedEvents = sortEvents(
    trackEvents.filter(event => 
      activeTab === 'relay' ? event.type === 'relay' : event.type !== 'relay'
    )
  );

  const handleGenerateHeats = (eventId: string) => {
    const selectedEvent = trackEvents.find(e => e.id === eventId);
    if (!selectedEvent) return;

    // For relay events, use the current relay entries
    const currentEntries = activeTab === 'relay' ? 
      (relayEntries[eventId] || []) : 
      athletes.filter(a => a.events.includes(selectedEvent.name));

    // Check if we should skip heats
    if (shouldSkipHeats(selectedEvent, currentEntries, schools)) {
      // Generate direct finals
      const finals = generateDirectFinals(selectedEvent, currentEntries, schools);
      
      // Update heats state
      const existingHeats = heats.filter(heat => heat.eventId !== eventId);
      setHeats([...existingHeats, finals]);
      setActiveHeats(eventId);
      
      // Show notification to user
      alert(`${selectedEvent.name} has 8 or fewer entries. A finals list has been generated directly.`);
      return;
    }

    // Generate regular heats for events with more than 8 entries
    const newHeats = generateHeats(selectedEvent, currentEntries, schools);
    
    // Update heats state
    const existingHeats = heats.filter(heat => heat.eventId !== eventId);
    setHeats([...existingHeats, ...newHeats]);
    setActiveHeats(eventId);
  };

  const handlePositionChange = (heatId: string, athleteId: string, position?: number) => {
    setHeats(prevHeats => 
      prevHeats.map(heat => {
        if (heat.id === heatId) {
          const updatedLanes = heat.lanes.map(lane => {
            if (lane.athleteId === athleteId) {
              return { ...lane, position };
            }
            return lane;
          }).sort((a, b) => {
            if (!a.position) return 1;
            if (!b.position) return -1;
            return a.position - b.position;
          });
          return { ...heat, lanes: updatedLanes };
        }
        return heat;
      })
    );
  };

  const handleRemoveAthlete = (heatId: string, athleteId: string) => {
    if (window.confirm('Are you sure you want to remove this participant from the heat?')) {
      // Get the heat and event information
      const heat = heats.find(h => h.id === heatId);
      if (!heat) return;

      // If this is a relay event, update the relay entries
      if (activeTab === 'relay') {
        setRelayEntries(prev => {
          const updatedEntries = { ...prev };
          if (updatedEntries[heat.eventId]) {
            updatedEntries[heat.eventId] = updatedEntries[heat.eventId].filter(id => id !== athleteId);
          }
          return updatedEntries;
        });

        // Also update schools' relay events
        const event = trackEvents.find(e => e.id === heat.eventId);
        if (event) {
          setSchools(prevSchools => 
            prevSchools.map(school => {
              if (school.id === athleteId) {
                return {
                  ...school,
                  relayEvents: (school.relayEvents || []).filter(e => e !== event.name)
                };
              }
              return school;
            })
          );
        }
      }

      // Remove from heats
      setHeats(prevHeats =>
        prevHeats.map(heat => {
          if (heat.id === heatId) {
            return {
              ...heat,
              lanes: heat.lanes.filter(lane => lane.athleteId !== athleteId)
            };
          }
          return heat;
        })
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>, athleteId: string, currentIndex: number) => {
    const heat = heats.find(h => h.id === selectedHeatId);
    if (!heat) return;

    if (e.key >= '1' && e.key <= '8') {
      e.preventDefault();
      handlePositionChange(heat.id, athleteId, parseInt(e.key));
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          const prevAthlete = heat.lanes[currentIndex - 1];
          setEditingPosition({
            heatId: heat.id,
            athleteId: prevAthlete.athleteId,
            position: prevAthlete.position
          });
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < heat.lanes.length - 1) {
          const nextAthlete = heat.lanes[currentIndex + 1];
          setEditingPosition({
            heatId: heat.id,
            athleteId: nextAthlete.athleteId,
            position: nextAthlete.position
          });
        }
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handlePositionChange(heat.id, athleteId, undefined);
        break;
    }
  };

  const handleAddAthlete = (heatId: string, athleteId: string) => {
    const heat = heats.find(h => h.id === heatId);
    if (!heat) return;

    // For relay events, update the relay entries
    if (activeTab === 'relay') {
      // Only add to the specific event's entries
      setRelayEntries(prev => ({
        ...prev,
        [heat.eventId]: [...(prev[heat.eventId] || []), athleteId]
      }));

      // Update school's relay events with only this specific event
      const event = trackEvents.find(e => e.id === heat.eventId);
      if (event) {
        setSchools(prevSchools => 
          prevSchools.map(school => {
            if (school.id === athleteId) {
              const currentEvents = school.relayEvents || [];
              if (!currentEvents.includes(event.name)) {
                return {
                  ...school,
                  relayEvents: [...currentEvents, event.name]
                };
              }
            }
            return school;
          })
        );
      }
    }

    // Update heats
    setHeats(prevHeats =>
      prevHeats.map(heat => {
        if (heat.id === heatId) {
          const maxLane = Math.max(...heat.lanes.map(l => l.lane), 0);
          return {
            ...heat,
            lanes: [...heat.lanes, { lane: maxLane + 1, athleteId }]
          };
        }
        return heat;
      })
    );
  };

  const selectedEventHeats = activeHeats
    ? heats.filter(heat => heat.eventId === activeHeats)
    : [];

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      <EventsList
        events={filteredAndSortedEvents}
        selectedEvent={selectedEvent}
        onEventSelect={(eventId) => {
          setSelectedEvent(eventId);
          setActiveHeats(eventId);
        }}
        onGenerateHeats={handleGenerateHeats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="flex-1 p-6 overflow-y-auto">
        {selectedEvent && selectedEventHeats.length > 0 ? (
          <div className="space-y-6">
            {selectedEventHeats.map((heat) => (
              <HeatCard
                key={heat.id}
                heat={heat}
                athletes={athletes}
                schools={schools}
                editingPosition={editingPosition}
                onPositionChange={handlePositionChange}
                onRemoveAthlete={handleRemoveAthlete}
                onAddAthlete={(heatId) => {
                  setSelectedHeatId(heatId);
                  setShowAddAthleteModal(true);
                }}
                onLaneClick={(heatId, athleteId, position) => {
                  setEditingPosition({
                    heatId,
                    athleteId,
                    position
                  });
                  setSelectedHeatId(heatId);
                }}
                onKeyDown={handleKeyDown}
                isRelay={activeTab === 'relay'}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Users className="w-12 h-12 mb-2" />
            <p>Select an event and generate heats to get started</p>
          </div>
        )}
      </div>

      {showAddAthleteModal && selectedHeatId && (
        <AddAthleteModal
          athletes={athletes}
          schools={schools}
          onClose={() => setShowAddAthleteModal(false)}
          onAddAthlete={(athleteId) => {
            handleAddAthlete(selectedHeatId, athleteId);
            setShowAddAthleteModal(false);
          }}
          isRelay={activeTab === 'relay'}
        />
      )}
    </div>
  );
}