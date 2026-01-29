import React from 'react';

interface BrandTextProps {
  text: string;
}

export const BrandText: React.FC<BrandTextProps> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(mais|\+)/gi);
  return (
    <>
      {parts.map((part, index) => {
        if (part.toLowerCase() === 'mais' || part === '+') {
          return (
            <span key={index} className="text-tranquili-yellow font-bold">
              +
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default BrandText;
