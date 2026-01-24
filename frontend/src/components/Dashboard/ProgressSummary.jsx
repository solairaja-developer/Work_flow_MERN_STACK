import React from 'react';

const ProgressSummary = ({ stats }) => {
  if (!stats) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const calculatePercentage = (value) => {
    const total = stats.total || 1;
    return Math.round((value / total) * 100);
  };

  const progressItems = [
    { label: 'Completed', value: stats.completed || 0, color: 'success' },
    { label: 'In Progress', value: stats.inProgress || 0, color: 'primary' },
    { label: 'Pending', value: stats.pending || 0, color: 'warning' },
    { label: 'Overdue', value: stats.overdue || 0, color: 'danger' }
  ];

  return (
    <div className="progress-summary">
      {progressItems.map((item, index) => {
        const percentage = calculatePercentage(item.value);
        return (
          <div key={index} className="mb-3">
            <div className="d-flex justify-content-between mb-1">
              <span>{item.label}</span>
              <span>{percentage}% ({item.value})</span>
            </div>
            <div className="progress">
              <div
                className={`progress-bar bg-${item.color}`}
                style={{ width: `${percentage}%` }}
                role="progressbar"
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProgressSummary;