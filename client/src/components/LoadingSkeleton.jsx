import React from 'react';

/**
 * Loading skeleton placeholders while notes are fetching
 */
export function LoadingSkeleton({ count = 6, viewMode = 'grid' }) {
  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <div
      className={`notes-container ${viewMode === 'list' ? 'list-view' : 'grid-view'}`}
      aria-label="Loading notes..."
      aria-busy="true"
    >
      {items.map((key) => (
        <div key={key} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-line title" />
          <div className="skeleton-line" />
          <div className="skeleton-line" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default LoadingSkeleton;
