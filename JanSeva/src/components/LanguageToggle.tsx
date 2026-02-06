import React from 'react';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage, languageNames } from '@/contexts/LanguageContext';
import { Language } from '@/types/scheme';

const languages: Language[] = ['mr', 'hi', 'en'];

interface LanguageToggleProps {
  compact?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
      {!compact && (
        <Globe className="ml-2 h-4 w-4 text-muted-foreground" />
      )}
      {languages.map((lang) => (
        <Button
          key={lang}
          variant={language === lang ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setLanguage(lang)}
          className={`
            min-w-[60px] text-xs font-medium
            ${language === lang 
              ? 'bg-primary text-primary-foreground shadow-sm' 
              : 'text-muted-foreground hover:text-foreground'
            }
          `}
        >
          {languageNames[lang]}
        </Button>
      ))}
    </div>
  );
};
