import React, { forwardRef, useRef, ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import { findMatchingSchool } from '../../utils/schoolUtils';
import { parseAgeCategory } from '../../utils/categoryUtils';
import { formatExcelDate } from '../../utils/dateUtils';
import { parseEvents } from '../../utils/eventUtils';

interface EntryImporterProps {
  activeTab: 'individual' | 'relay';
  athletes: any[];
  schools: any[];
  trackEvents: any[];
  relayEntries: Record<string, string[]>;
  onImportComplete: (newAthletes: any[], newRelayEntries: Record<string, string[]>) => void;
}

export const EntryImporter = forwardRef<HTMLInputElement, EntryImporterProps>(({
  activeTab,
  athletes,
  schools,
  trackEvents,
  relayEntries,
  onImportComplete
}, ref) => {
  // Check if an individual entry already exists
  const isIndividualEntryDuplicate = (athleteId: string, eventName: string) => {
    return athletes.some(athlete => 
      athlete.id === athleteId && 
      athlete.events.includes(eventName)
    );
  };

  // Check if a relay entry already exists
  const isRelayEntryDuplicate = (schoolId: string, eventId: string) => {
    return relayEntries[eventId]?.includes(schoolId);
  };

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let failedCount = 0;
        let duplicateCount = 0;
        let newAthletes = [...athletes];
        let newRelayEntries = { ...relayEntries };
        let errors: string[] = [];

        // Process each row
        jsonData.forEach((row: any) => {
          try {
            const school = findMatchingSchool(row.Team, schools);
            if (!school) {
              errors.push(`School not found: ${row.Team}`);
              failedCount++;
              return;
            }

            // Parse gender consistently
            const genderStr = String(row.Gender || '').toLowerCase();
            const gender = genderStr.includes('boy') || genderStr.includes('m') ? 'M' : 
                         genderStr.includes('girl') || genderStr.includes('f') ? 'F' : null;

            if (!gender) {
              errors.push(`Invalid gender for ${activeTab === 'relay' ? row.Team : row.Name}: ${row.Gender}`);
              failedCount++;
              return;
            }

            const ageCategory = parseAgeCategory(row['Age Category']);
            const events = parseEvents(row.Event);

            if (events.length === 0) {
              errors.push(`No valid events found for ${activeTab === 'relay' ? row.Team : row.Name}`);
              failedCount++;
              return;
            }

            if (activeTab === 'relay') {
              // Process relay entries
              events.forEach(eventName => {
                const event = trackEvents.find(e => 
                  e.type === 'relay' && 
                  e.name === eventName &&
                  e.gender === gender &&
                  e.ageGroup === ageCategory
                );

                if (event) {
                  if (isRelayEntryDuplicate(school.id, event.id)) {
                    duplicateCount++;
                    errors.push(`Duplicate relay entry: ${school.name} - ${eventName} (${gender}, ${ageCategory})`);
                    return;
                  }

                  if (!newRelayEntries[event.id]) {
                    newRelayEntries[event.id] = [];
                  }
                  newRelayEntries[event.id] = [...newRelayEntries[event.id], school.id];
                  successCount++;
                } else {
                  errors.push(`No matching relay event found for ${eventName} (${gender}, ${ageCategory})`);
                  failedCount++;
                }
              });
            } else {
              // Process individual entries
              let dateOfBirth;
              try {
                dateOfBirth = formatExcelDate(row.DOB);
              } catch (error) {
                errors.push(`Invalid date format for ${row.Name}`);
                failedCount++;
                return;
              }

              let athlete = newAthletes.find(a => 
                a.name.toLowerCase() === row.Name.toLowerCase().trim() && 
                a.schoolId === school.id
              );

              if (!athlete) {
                athlete = {
                  id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${school.id}`,
                  name: row.Name.trim(),
                  schoolId: school.id,
                  gender,
                  dateOfBirth,
                  ageCategory,
                  events: [],
                  personalBests: {}
                };
                newAthletes.push(athlete);
              }

              const athleteIndex = newAthletes.findIndex(a => a.id === athlete!.id);
              const newEvents = events.filter(event => {
                if (isIndividualEntryDuplicate(athlete!.id, event)) {
                  duplicateCount++;
                  errors.push(`Duplicate entry: ${athlete!.name} - ${event}`);
                  return false;
                }
                return true;
              });

              if (newEvents.length > 0) {
                newAthletes[athleteIndex] = {
                  ...athlete,
                  events: [...athlete.events, ...newEvents]
                };
                successCount += newEvents.length;
              }
            }
          } catch (error) {
            errors.push(`Error processing row: ${error.message}`);
            failedCount++;
          }
        });

        // Reset file input
        if (ref && 'current' in ref && ref.current) {
          ref.current.value = '';
        }

        // Show import results
        const message = `Import completed!\n\n` +
                       `Successful entries: ${successCount}\n` +
                       `Duplicate entries: ${duplicateCount}\n` +
                       `Failed entries: ${failedCount}\n\n` +
                       (errors.length > 0 ? `Error details:\n${errors.join('\n')}` : '');

        alert(message);

        // Update state with new data
        onImportComplete(newAthletes, newRelayEntries);

      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error importing data. Please check the file format and try again.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <input
      type="file"
      ref={ref}
      onChange={handleImport}
      accept=".xlsx,.xls"
      className="hidden"
    />
  );
});

EntryImporter.displayName = 'EntryImporter';