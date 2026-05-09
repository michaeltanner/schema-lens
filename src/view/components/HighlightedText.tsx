import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
  title?: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({ text, highlight, className, title }) => {
  if (!highlight.trim()) {
    return <span className={className} title={title}>{text}</span>;
  }

  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  return (
    <span className={className} title={title}>
      {parts.map((part, i) => (
        regex.test(part) ? (
          <mark key={i} className="search-highlight">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      ))}
    </span>
  );
};
