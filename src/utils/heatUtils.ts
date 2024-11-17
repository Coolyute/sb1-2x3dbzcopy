import { TrackEvent, Athlete, School } from '../types';
import { shuffleArray } from './arrayUtils';

const MIN_ENTRIES_FOR_HEATS = 9; // More than 8 entries needed for heats
const LANES_PER_HEAT = 8;

// Get all entries for an event
export const getEventEntries = (
  event: TrackEvent,
  entries: any[],
  schools: School[]
): { id: string; name: string; schoolId: string }[] => {
  if (event.type === 'relay') {
    // For relay events, use the provided entries (school IDs)
    return entries.map(schoolId => {
      const school = schools.find(s => s.id === schoolId);
      return {
        id: schoolId,
        name: school?.name || '',
        schoolId: schoolId
      };
    });
  } else {
    // For individual events, filter athletes by event criteria
    return (entries as Athlete[])
      .filter(athlete => 
        athlete.events.includes(event.name) &&
        athlete.gender === event.gender &&
        athlete.ageCategory === event.ageGroup
      )
      .map(athlete => ({
        id: athlete.id,
        name: athlete.name,
        schoolId: athlete.schoolId
      }));
  }
};

// Check if event should skip heats
export const shouldSkipHeats = (
  event: TrackEvent,
  entries: any[],
  schools: School[]
): boolean => {
  // Special case for 1200m and 800m events - always straight to finals
  if (event.name.includes('1200m') || event.name.includes('800m')) {
    return true;
  }

  const eventEntries = getEventEntries(event, entries, schools);
  return eventEntries.length <= MIN_ENTRIES_FOR_HEATS - 1;
};

// Generate finals directly for events with 8 or fewer entries or special events
export const generateDirectFinals = (
  event: TrackEvent,
  entries: any[],
  schools: School[]
): any => {
  const eventEntries = getEventEntries(event, entries, schools);
  
  // For 1200m and 800m events, use a different lane assignment pattern
  const isDistanceEvent = event.name.includes('1200m') || event.name.includes('800m');
  
  // Create a single heat as finals
  return {
    id: `${event.id}-finals-${Date.now()}`,
    eventId: event.id,
    heatNumber: 1,
    lanes: eventEntries.map((entry, index) => ({
      lane: isDistanceEvent ? index + 1 : index + 1,
      athleteId: entry.id,
      position: undefined
    })),
    status: 'pending',
    isFinals: true,
    isDistanceEvent
  };
};

// Distribute athletes across heats ensuring school diversity
const distributeAthletes = (athletes: any[], numHeats: number): any[][] => {
  // Group athletes by school
  const schoolGroups = athletes.reduce((groups: Record<string, any[]>, athlete) => {
    if (!groups[athlete.schoolId]) {
      groups[athlete.schoolId] = [];
    }
    groups[athlete.schoolId].push(athlete);
    return groups;
  }, {});

  // Create empty heats
  const heats: any[][] = Array.from({ length: numHeats }, () => []);
  let currentHeat = 0;

  // First pass: distribute one athlete from each school across heats
  Object.values(schoolGroups).forEach(schoolAthletes => {
    shuffleArray(schoolAthletes); // Randomize athletes within each school
    schoolAthletes.forEach(athlete => {
      if (heats[currentHeat].length < LANES_PER_HEAT) {
        heats[currentHeat].push(athlete);
        currentHeat = (currentHeat + 1) % numHeats;
      }
    });
  });

  // Second pass: fill any remaining spots
  const flattenedHeats = heats.flat();
  const remainingAthletes = athletes.filter(athlete => 
    !flattenedHeats.some(a => a.id === athlete.id)
  );

  if (remainingAthletes.length > 0) {
    shuffleArray(remainingAthletes);
    remainingAthletes.forEach(athlete => {
      // Find the heat with the fewest athletes from this school
      const heatIndex = heats.reduce((bestHeat, heat, index) => {
        const currentSchoolCount = heat.filter(a => a.schoolId === athlete.schoolId).length;
        const bestSchoolCount = heats[bestHeat].filter(a => a.schoolId === athlete.schoolId).length;
        return currentSchoolCount < bestSchoolCount ? index : bestHeat;
      }, 0);

      if (heats[heatIndex].length < LANES_PER_HEAT) {
        heats[heatIndex].push(athlete);
      }
    });
  }

  // Final shuffle of lane assignments within each heat
  return heats.map(heat => shuffleArray(heat));
};

// Generate heats for events with more than 8 entries
export const generateHeats = (
  event: TrackEvent,
  entries: any[],
  schools: School[]
): any[] => {
  const eventEntries = getEventEntries(event, entries, schools);
  const totalEntries = eventEntries.length;
  const numHeats = Math.ceil(totalEntries / LANES_PER_HEAT);

  // Distribute athletes across heats
  const distributedHeats = distributeAthletes(eventEntries, numHeats);

  // Create heat objects
  return distributedHeats.map((heatEntries, index) => ({
    id: `${event.id}-heat-${index + 1}-${Date.now()}`,
    eventId: event.id,
    heatNumber: index + 1,
    lanes: heatEntries.map((entry, laneIndex) => ({
      lane: laneIndex + 1,
      athleteId: entry.id,
      position: undefined
    })),
    status: 'pending'
  }));
};