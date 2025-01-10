import React from 'react';
import FurnitureItem from './FurnitureItem';

const FurnitureGrid = ({ products }) => {
  return (
    <div className='container-fluid mt-4'>
      <div className="row row-cols-1 row-cols-md-2 g-4">
        {products.map((element, index) => (
          <div className="col" key={element.url || index}>
            <div className="card shadow-sm">
              <FurnitureItem 
                name={element.name} 
                mrp={element.mrp} 
                url={element.url} 
                image_url={element.image_url}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FurnitureGrid;
