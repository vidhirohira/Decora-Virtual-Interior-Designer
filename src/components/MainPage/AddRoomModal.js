import React, { useState } from 'react';
import { X } from 'lucide-react';

function AddRoomModal({ isOpen, onClose, onAdd }) {
  const [roomName, setRoomName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (roomName.trim()) {
      onAdd(roomName.trim());
      setRoomName('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
        <h2 className="modal-title">Add New Room</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter room name"
            className="modal-input"
            autoFocus
          />
          <button type="submit" className="modal-button">
            Add Room
          </button>
        </form>
      </div>
    </div>
  );
}