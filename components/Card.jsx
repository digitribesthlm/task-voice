import React from 'react';

const Card = ({ children, className = '' }) => {
  return (
    <div className={`bg-[#1B2234] border border-slate-700 rounded-xl p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
