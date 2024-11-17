import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export function EditableMeetName() {
  const [meetName, setMeetName] = useLocalStorage('meetName', 'SESETA DA MEET 2024');
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(meetName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim()) {
      setMeetName(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(meetName);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-4xl font-bold text-center text-orange-700 bg-transparent border-b-2 border-orange-300 focus:border-orange-500 focus:outline-none px-2"
        />
        <button
          onClick={handleSave}
          className="p-1 text-green-600 hover:text-green-700"
          title="Save"
        >
          <Check className="w-6 h-6" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 hover:text-red-700"
          title="Cancel"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <h1 className="text-4xl font-bold text-center text-orange-700">
        {meetName}
      </h1>
      <button
        onClick={() => setIsEditing(true)}
        className="p-1 text-gray-400 hover:text-orange-600"
        title="Edit meet name"
      >
        <Edit2 className="w-5 h-5" />
      </button>
    </div>
  );
}