import React from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/schemes';
import { SchemeCategory } from '@/types/scheme';

interface CategoryFilterProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onCategoryChange,
}) => {
  const { language } = useLanguage();

  return (
    <div className="flex flex-wrap justify-center gap-3">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={activeCategory === category.id ? 'categoryActive' : 'category'}
          onClick={() => onCategoryChange(category.id)}
          className="gap-2"
        >
          <span className="text-lg">{category.icon}</span>
          <span>{category.label[language]}</span>
        </Button>
      ))}
    </div>
  );
};
