// Age group order for consistent sorting
export const ageGroupOrder = {
  'U9': 1,
  'U11': 2,
  'U13': 3,
  'U15': 4,
  'Open': 5
};

// Sort events by age group, gender, and name
export const sortEvents = (events: any[]) => {
  return [...events].sort((a, b) => {
    // First sort by age group
    const ageA = ageGroupOrder[a.ageGroup] || 999;
    const ageB = ageGroupOrder[b.ageGroup] || 999;
    if (ageA !== ageB) return ageA - ageB;

    // Then by gender (Girls before Boys)
    if (a.gender !== b.gender) {
      return a.gender === 'F' ? -1 : 1;
    }

    // Finally by event name
    return a.name.localeCompare(b.name);
  });
};

// Sort entries by age group and gender
export const sortEntries = (entries: any[]) => {
  return entries.sort((a, b) => {
    // First sort by age category
    const ageA = ageGroupOrder[a.ageCategory || a.ageGroup] || 999;
    const ageB = ageGroupOrder[b.ageCategory || b.ageGroup] || 999;
    if (ageA !== ageB) return ageA - ageB;

    // Then by gender (Girls before Boys)
    const genderA = a.gender === 'F' || a.gender === 'Girls' ? 'F' : 'M';
    const genderB = b.gender === 'F' || b.gender === 'Girls' ? 'F' : 'M';
    if (genderA !== genderB) {
      return genderA === 'F' ? -1 : 1;
    }

    // Finally by event name
    return a.event.localeCompare(b.event);
  });
};