import React from 'react';

interface BrandTextProps {
  text: string;
}

export const BrandText: React.FC<BrandTextProps> = ({ text }) => {
  if (!text) return null;
  const parts = text.split(/(\+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part === '+') {
          return (
            <span key={index} className="text-tranquili-yellow font-bold">
              {part}
            </span>
          );
        }
        return <span key={index}>{part}</span>;
      })}
    </>
  );
};

export default BrandText;
