export const calculateAgeCategory = (dateOfBirth: string, year: number = new Date().getFullYear()): 'U9' | 'U11' | 'U13' | 'U15' | 'Open' => {
  const dob = new Date(dateOfBirth);
  const birthYear = dob.getFullYear();
  
  // Calculate age at the end of the current year
  const age = year - birthYear;

  // Define age ranges for each category
  if (age <= 8) return 'U9';      // Born 2016-2017 for 2024
  if (age <= 10) return 'U11';    // Born 2014-2015 for 2024
  if (age <= 12) return 'U13';    // Born 2012-2013 for 2024
  if (age <= 14) return 'U15';    // Born 2010-2011 for 2024
  return 'Open';                  // Born 2010-2013 for 2024
};

export const getAgeCategoryYears = (year: number = new Date().getFullYear()): Record<string, { start: number; end: number }> => {
  return {
    'U9': { start: year - 8, end: year - 7 },     // 7-8 years old
    'U11': { start: year - 10, end: year - 9 },   // 9-10 years old
    'U13': { start: year - 12, end: year - 11 },  // 11-12 years old
    'U15': { start: year - 14, end: year - 13 },  // 13-14 years old
    'Open': { start: year - 14, end: year - 11 }  // Born 2010-2013 for 2024
  };
};

export const parseAgeCategory = (category: string): 'U9' | 'U11' | 'U13' | 'U15' | 'Open' => {
  const normalized = category.toUpperCase().trim();
  
  if (normalized.includes('OPEN')) return 'Open';
  if (normalized.includes('U9')) return 'U9';
  if (normalized.includes('U11')) return 'U11';
  if (normalized.includes('U13')) return 'U13';
  if (normalized.includes('U15')) return 'U15';
  
  return 'Open';
};