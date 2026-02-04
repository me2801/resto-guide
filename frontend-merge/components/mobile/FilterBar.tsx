'use client';

import { Tag } from '@/lib/mobile/api';

interface FilterBarProps {
  tags: Tag[];
  selectedTags: string[];
  onTagToggle: (slug: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
}

export default function FilterBar({
  tags,
  selectedTags,
  onTagToggle,
  priceRange,
  onPriceChange,
}: FilterBarProps) {
  const cuisineTags = tags.filter((t) => t.kind === 'cuisine');
  const vibeTags = tags.filter((t) => t.kind === 'vibe');

  const priceLabels = ['$', '$$', '$$$', '$$$$'];

  return (
    <div className="filter-bar">
      {/* Price filter */}
      <div className="chips">
        {priceLabels.map((label, index) => {
          const level = index + 1;
          const isActive = level >= priceRange[0] && level <= priceRange[1];
          return (
            <button
              key={level}
              className={`chip ${isActive ? 'chip--active' : ''}`}
              onClick={() => {
                if (priceRange[0] === level && priceRange[1] === level) {
                  onPriceChange([1, 4]);
                } else {
                  onPriceChange([level, level]);
                }
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Cuisine tags */}
      {cuisineTags.map((tag) => (
        <button
          key={tag.id}
          className={`chip chip--cuisine ${selectedTags.includes(tag.slug) ? 'chip--active' : ''}`}
          onClick={() => onTagToggle(tag.slug)}
        >
          {tag.name}
        </button>
      ))}

      {/* Vibe tags */}
      {vibeTags.map((tag) => (
        <button
          key={tag.id}
          className={`chip chip--vibe ${selectedTags.includes(tag.slug) ? 'chip--active' : ''}`}
          onClick={() => onTagToggle(tag.slug)}
        >
          {tag.name}
        </button>
      ))}
    </div>
  );
}
