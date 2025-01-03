import React from 'react';
import { Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function RoomCard({ title, isAdd = false, onAdd, onDelete }) {

  const navigate = useNavigate();
  const handleEdit = () =>{
    navigate('/floorplan2d')
  }
  
  return (
    <div className={`room-card ${isAdd ? 'room-card-add' : ''}`}>
      {isAdd ? (
        <>
          <Plus className="icon" onClick={onAdd} />
          <span className="add-text" >Add New Room</span>
        </>
      ) : (
        <>
          <div className="room-image" onClick={handleEdit}></div>
          <span className="room-title">{title}</span>
          {onDelete && (
            <button className="delete-btn" onClick={() => onDelete(title)}>
              Delete
            </button>
          )}
        </>
      )}
    </div>
  );
}


export default RoomCard;
