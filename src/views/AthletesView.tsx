import React, { useState, useRef } from 'react';
import { Search, Plus, Pencil, Trash2, Upload, Download } from 'lucide-react';
import { AthleteForm } from '../components/AthleteForm';
import { Athlete } from '../types';
import { useData } from '../context/DataContext';
import * as XLSX from 'xlsx';
import { calculateAgeCategory } from '../utils/categoryUtils';
import { formatExcelDate } from '../utils/dateUtils';
import { findMatchingSchool } from '../utils/schoolUtils';

export function AthletesView() {
  const { athletes, setAthletes, schools } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const exportData = athletes.map(athlete => ({
      Name: athlete.name,
      School: schools.find(s => s.id === athlete.schoolId)?.name || '',
      DOB: athlete.dateOfBirth,
      Gender: athlete.gender === 'M' ? 'Male' : 'Female',
      'Age Category': athlete.ageCategory,
      Events: athlete.events.join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Athletes');
    XLSX.writeFile(wb, 'athletes.xlsx');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          let successCount = 0;
          let failedCount = 0;
          let newAthletes = [...athletes];
          let errors: string[] = [];

          jsonData.forEach((row: any) => {
            try {
              if (!row.Name || !row.School || !row.DOB || !row.Gender || !row['Age Category']) {
                errors.push(`Missing required fields for athlete: ${row.Name || 'Unknown'}`);
                failedCount++;
                return;
              }

              const school = findMatchingSchool(row.School, schools);
              if (!school) {
                errors.push(`School not found: ${row.School} for athlete ${row.Name}`);
                failedCount++;
                return;
              }

              let dateOfBirth;
              try {
                dateOfBirth = formatExcelDate(row.DOB);
              } catch (error) {
                errors.push(`Invalid date format for athlete ${row.Name}`);
                failedCount++;
                return;
              }

              const gender = row.Gender?.toString().toLowerCase().startsWith('m') ? 'M' : 'F';
              const declaredCategory = row['Age Category'].toString().trim();
              const birthYear = new Date(dateOfBirth).getFullYear();

              // Validate age category
              if (declaredCategory === 'Open') {
                // For Open category, validate birth year is between 2010-2013
                if (birthYear < 2010 || birthYear > 2013) {
                  errors.push(`Invalid birth year for Open category athlete ${row.Name}. Must be born between 2010-2013`);
                  failedCount++;
                  return;
                }
              } else {
                // For other categories, calculate and validate
                const calculatedCategory = calculateAgeCategory(dateOfBirth);
                if (calculatedCategory !== declaredCategory) {
                  errors.push(`Age category mismatch for athlete ${row.Name}. Declared: ${declaredCategory}, Calculated: ${calculatedCategory}`);
                  failedCount++;
                  return;
                }
              }

              const existingAthlete = newAthletes.find(a => 
                a.name.toLowerCase() === row.Name.toLowerCase().trim() && 
                a.schoolId === school.id
              );

              if (!existingAthlete) {
                const newAthlete: Athlete = {
                  id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${school.id}`,
                  name: row.Name.trim(),
                  schoolId: school.id,
                  gender,
                  dateOfBirth,
                  ageCategory: declaredCategory as 'U9' | 'U11' | 'U13' | 'U15' | 'Open',
                  events: [],
                  personalBests: {}
                };
                newAthletes.push(newAthlete);
                successCount++;
              } else {
                const athleteIndex = newAthletes.findIndex(a => a.id === existingAthlete.id);
                newAthletes[athleteIndex] = {
                  ...existingAthlete,
                  gender,
                  dateOfBirth,
                  ageCategory: declaredCategory as 'U9' | 'U11' | 'U13' | 'U15' | 'Open'
                };
                successCount++;
              }
            } catch (error) {
              errors.push(`Error processing athlete ${row.Name}: ${error.message}`);
              failedCount++;
            }
          });

          setAthletes(newAthletes);

          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }

          if (errors.length > 0) {
            const errorReport = errors.join('\n');
            alert(`Import completed with errors!\n\nSuccessful entries: ${successCount}\nFailed entries: ${failedCount}\n\nError details:\n${errorReport}`);
          } else {
            alert(`Import completed successfully!\nSuccessful entries: ${successCount}`);
          }
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Error importing data. Please check the file format and try again.');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const handleAddAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    const newAthlete = {
      ...athleteData,
      id: `${Date.now()}`,
    };
    setAthletes([...athletes, newAthlete]);
    setShowForm(false);
  };

  const handleEditAthlete = (athleteData: Omit<Athlete, 'id'>) => {
    if (!selectedAthlete) return;
    const updatedAthletes = athletes.map(athlete =>
      athlete.id === selectedAthlete.id ? { ...athleteData, id: athlete.id } : athlete
    );
    setAthletes(updatedAthletes);
    setShowForm(false);
    setSelectedAthlete(undefined);
  };

  const handleDeleteAthlete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this athlete?')) {
      setAthletes(athletes.filter(athlete => athlete.id !== id));
    }
  };

  const filteredAthletes = athletes.filter(athlete =>
    athlete.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Athletes</h2>
          <p className="text-gray-600 mt-2">Manage student participants</p>
        </div>
        
        <div className="flex space-x-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search athletes..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".xlsx,.xls"
            className="hidden"
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
            onClick={() => {
              setSelectedAthlete(undefined);
              setShowForm(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Athlete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Events</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAthletes.map(athlete => (
              <tr key={athlete.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {schools.find(s => s.id === athlete.schoolId)?.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{new Date(athlete.dateOfBirth).toLocaleDateString()}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{athlete.gender}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                    {athlete.ageCategory}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {athlete.events.join(', ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => {
                      setSelectedAthlete(athlete);
                      setShowForm(true);
                    }}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteAthlete(athlete.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <AthleteForm
          athlete={selectedAthlete}
          onSubmit={selectedAthlete ? handleEditAthlete : handleAddAthlete}
          onClose={() => {
            setShowForm(false);
            setSelectedAthlete(undefined);
          }}
        />
      )}
    </div>
  );
}