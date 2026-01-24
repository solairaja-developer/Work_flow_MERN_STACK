import React from 'react';

const StatsCards = ({ title, value, icon, color, change }) => {
  return (
    <div className={`stats-card ${color}`}>
      <div className="stats-icon">
        <i className={icon}></i>
      </div>
      <div className="stats-content">
        <h3>{value}</h3>
        <p>{title}</p>
        {change && (
          <small className={change.startsWith('+') ? 'text-success' : 'text-danger'}>
            <i className={`fas fa-arrow-${change.startsWith('+') ? 'up' : 'down'} me-1`}></i>
            {change}
          </small>
        )}
      </div>
    </div>
  );
};

export default StatsCards;