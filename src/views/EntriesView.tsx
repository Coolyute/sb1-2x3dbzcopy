import React, { useState, useRef } from 'react';
import { Search, Plus, Upload, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import { sortEntries } from '../utils/sortUtils';
import * as XLSX from 'xlsx';
import { EntryForm } from '../components/EntryForm';
import { EntryImporter } from '../components/entries/EntryImporter';
import { EntriesTable } from '../components/entries/EntriesTable';

export function EntriesView() {
  const { 
    athletes, 
    setAthletes, 
    schools, 
    trackEvents,
    relayEntries,
    setRelayEntries 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'individual' | 'relay'>('individual');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ athleteId: string; eventName: string } | null>(null);

  const handleExport = () => {
    const exportData = entries.map(entry => ({
      Name: activeTab === 'individual' && 'athleteName' in entry ? entry.athleteName : '',
      Team: entry.school,
      Gender: entry.gender === 'M' ? 'Boys' : 'Girls',
      'Age Category': activeTab === 'individual' ? entry.ageCategory : entry.ageGroup,
      Event: entry.event
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Entries');
    XLSX.writeFile(wb, 'event_entries.xlsx');
  };

  const handleImportComplete = (newAthletes: any[], newRelayEntries: Record<string, string[]>) => {
    if (activeTab === 'individual') {
      setAthletes(newAthletes);
    } else {
      setRelayEntries(newRelayEntries);
    }
  };

  const handleRemoveEntry = (entryId: string) => {
    if (entryId.startsWith('relay')) {
      const [_, schoolId, eventId] = entryId.split('-');
      const event = trackEvents.find(e => e.id === eventId);
      const school = schools.find(s => s.id === schoolId);
      
      if (event && school && window.confirm(`Are you sure you want to remove ${school.name} from ${event.name}?`)) {
        setRelayEntries(prev => {
          const updated = { ...prev };
          if (updated[eventId]) {
            updated[eventId] = updated[eventId].filter(id => id !== schoolId);
          }
          return updated;
        });
      }
    } else {
      const [athleteId, eventName] = entryId.split('-');
      setAthletes(prevAthletes => prevAthletes.map(athlete => {
        if (athlete.id === athleteId) {
          return {
            ...athlete,
            events: athlete.events.filter(e => e !== eventName)
          };
        }
        return athlete;
      }));
    }
  };

  const handleEntrySubmit = (entry: { athleteId: string; eventId: string }) => {
    const event = trackEvents.find(e => e.id === entry.eventId);
    if (!event) return;

    if (activeTab === 'relay') {
      setRelayEntries(prev => ({
        ...prev,
        [entry.eventId]: [...(prev[entry.eventId] || []), entry.athleteId]
      }));
    } else {
      setAthletes(prevAthletes => prevAthletes.map(athlete => {
        if (athlete.id === entry.athleteId) {
          const updatedEvents = [...athlete.events];
          if (editingEntry) {
            const index = updatedEvents.indexOf(editingEntry.eventName);
            if (index !== -1) {
              updatedEvents[index] = event.name;
            }
          } else {
            updatedEvents.push(event.name);
          }
          return { ...athlete, events: updatedEvents };
        }
        return athlete;
      }));
    }
    setShowEntryForm(false);
    setEditingEntry(null);
  };

  // Get individual entries
  const individualEntries = athletes.flatMap(athlete => 
    athlete.events
      .filter(eventName => {
        const event = trackEvents.find(e => e.name === eventName);
        return event && event.type !== 'relay';
      })
      .map((eventName, index) => ({
        id: `${athlete.id}-${eventName}-${index}`,
        athleteName: athlete.name,
        school: schools.find(s => s.id === athlete.schoolId)?.name || '',
        gender: athlete.gender,
        dateOfBirth: athlete.dateOfBirth,
        ageCategory: athlete.ageCategory,
        event: eventName,
        athleteId: athlete.id
      }))
  );

  // Get relay entries
  const relayEventEntries = trackEvents
    .filter(event => event.type === 'relay')
    .flatMap(event => {
      const eventSchools = relayEntries[event.id] || [];
      return eventSchools.map(schoolId => {
        const school = schools.find(s => s.id === schoolId);
        return {
          id: `relay-${schoolId}-${event.id}`,
          school: school?.name || '',
          gender: event.gender === 'M' ? 'Boys' : 'Girls',
          ageGroup: event.ageGroup,
          event: event.name,
          schoolId: schoolId,
          eventId: event.id,
          athleteId: schoolId
        };
      });
    });

  const entries = activeTab === 'individual' ? sortEntries(individualEntries) : sortEntries(relayEventEntries);

  const filteredEntries = entries.filter(entry =>
    entry.school.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (activeTab === 'individual' && entry.athleteName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Event Entries</h2>
          <p className="text-gray-600 mt-2">Manage event registrations</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="flex rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('individual')}
              className={`px-4 py-2 ${
                activeTab === 'individual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Individual Events
            </button>
            <button
              onClick={() => setActiveTab('relay')}
              className={`px-4 py-2 ${
                activeTab === 'relay'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Relay Events
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search entries..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>

          <EntryImporter
            ref={fileInputRef}
            activeTab={activeTab}
            athletes={athletes}
            schools={schools}
            trackEvents={trackEvents}
            relayEntries={relayEntries}
            onImportComplete={handleImportComplete}
          />

          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-5 h-5 mr-2" />
            Import Excel
          </button>

          <button 
            onClick={handleExport}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5 mr-2" />
            Export Excel
          </button>

          <button 
            onClick={() => setShowEntryForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      <EntriesTable
        entries={filteredEntries}
        activeTab={activeTab}
        onRemoveEntry={handleRemoveEntry}
      />

      {showEntryForm && (
        <EntryForm
          entry={editingEntry}
          onSubmit={handleEntrySubmit}
          onClose={() => {
            setShowEntryForm(false);
            setEditingEntry(null);
          }}
          activeTab={activeTab}
        />
      )}
    </div>
  );
}