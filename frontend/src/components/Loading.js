import React from 'react';

const Loading = () => {
  return (
    <div className="container">
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '50vh' }}>
        <div className="text-center">
          <div className="loading-spinner mb-3"></div>
          <p>Loading...</p>
        </div>
      </div>
    </div>
  );
};

export default Loading;
