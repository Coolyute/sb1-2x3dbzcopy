import React, { useRef } from 'react';
import { AlertTriangle, Trash2, RefreshCw, Download, Upload, Database, Sun, Moon } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useTheme } from '../context/ThemeContext';

export function SettingsView() {
  const { 
    schools, 
    setSchools, 
    athletes, 
    setAthletes, 
    meets, 
    setMeets, 
    trackEvents, 
    setTrackEvents,
    heats,
    setHeats,
    relayEntries,
    setRelayEntries
  } = useData();
  const { theme, toggleTheme } = useTheme();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      setSchools([]);
      setAthletes([]);
      setMeets([]);
      setTrackEvents([]);
      setHeats([]);
      setRelayEntries({});
      localStorage.clear();
      alert('All data has been cleared successfully.');
    }
  };

  const handleClearTeams = () => {
    if (window.confirm('Are you sure you want to clear all teams? This will also remove related athletes and entries.')) {
      setSchools([]);
      setAthletes([]);
      setRelayEntries({});
      alert('All teams and related data have been cleared successfully.');
    }
  };

  const handleClearAthletes = () => {
    if (window.confirm('Are you sure you want to clear all athletes and their entries?')) {
      setAthletes([]);
      alert('All athletes and their entries have been cleared successfully.');
    }
  };

  const handleClearEvents = () => {
    if (window.confirm('Are you sure you want to clear all events? This will also clear related meets and heats.')) {
      setTrackEvents([]);
      setMeets([]);
      setHeats([]);
      setRelayEntries({});
      alert('All events and related data have been cleared successfully.');
    }
  };

  const handleClearResults = () => {
    if (window.confirm('Are you sure you want to clear all heats and finals results?')) {
      setHeats([]);
      localStorage.removeItem('finalPositions');
      alert('All results have been cleared successfully.');
    }
  };

  const handleClearEntries = () => {
    if (window.confirm('Are you sure you want to clear all event entries? Athletes will remain but their event registrations will be removed.')) {
      setAthletes(prevAthletes => prevAthletes.map(athlete => ({
        ...athlete,
        events: []
      })));
      setRelayEntries({});
      setSchools(prevSchools => prevSchools.map(school => ({
        ...school,
        relayEvents: []
      })));
      alert('All event entries have been cleared successfully.');
    }
  };

  const handleBackup = () => {
    const backupData = {
      schools,
      athletes,
      meets,
      trackEvents,
      heats,
      relayEntries,
      finalPositions: localStorage.getItem('finalPositions'),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trackmaster-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        // Validate backup data structure
        if (!backupData.schools || !backupData.athletes || !backupData.trackEvents) {
          throw new Error('Invalid backup file format');
        }

        // Restore all data
        setSchools(backupData.schools);
        setAthletes(backupData.athletes);
        setMeets(backupData.meets || []);
        setTrackEvents(backupData.trackEvents);
        setHeats(backupData.heats || []);
        setRelayEntries(backupData.relayEntries || {});
        
        if (backupData.finalPositions) {
          localStorage.setItem('finalPositions', backupData.finalPositions);
        }

        alert('Data restored successfully!');
      } catch (error) {
        alert('Error restoring data. Please check the backup file format.');
        console.error('Restore error:', error);
      }
    };
    reader.readAsText(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage application data and preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Appearance</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center">
            {theme === 'dark' ? (
              <Moon className="w-6 h-6 text-gray-500 dark:text-gray-400 mr-4" />
            ) : (
              <Sun className="w-6 h-6 text-yellow-500 mr-4" />
            )}
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Theme</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Switch between light and dark mode
              </p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Backup & Restore</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/50 rounded-lg">
            <div className="flex items-start">
              <Database className="w-6 h-6 text-blue-500 dark:text-blue-400 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200">Data Management</h4>
                <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                  Backup your data to a file or restore from a previous backup
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleBackup}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5 mr-2" />
                Backup Data
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleRestore}
                accept=".json"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Upload className="w-5 h-5 mr-2" />
                Restore Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Data Management</h3>

        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="w-6 h-6 text-red-500 dark:text-red-400 mr-4 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-red-800 dark:text-red-200">Danger Zone</h4>
                <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                  These actions cannot be undone. Please be certain before proceeding.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <button
                onClick={handleClearAllData}
                className="w-full flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Clear All Data
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={handleClearTeams}
                  className="flex items-center justify-center px-4 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Clear Teams
                </button>

                <button
                  onClick={handleClearAthletes}
                  className="flex items-center justify-center px-4 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Clear Athletes
                </button>

                <button
                  onClick={handleClearEvents}
                  className="flex items-center justify-center px-4 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Clear Events
                </button>

                <button
                  onClick={handleClearResults}
                  className="flex items-center justify-center px-4 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Clear Results
                </button>

                <button
                  onClick={handleClearEntries}
                  className="flex items-center justify-center px-4 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Clear Entries
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}