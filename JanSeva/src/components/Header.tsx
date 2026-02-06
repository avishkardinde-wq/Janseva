import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const translations = {
    title: { en: 'JanSeva', hi: 'जनसेवा', mr: 'जनसेवा' },
    subtitle: { en: 'Government Scheme Navigator', hi: 'सरकारी योजना नेविगेटर', mr: 'सरकारी योजना मार्गदर्शक' },
    home: { en: 'Home', hi: 'होम', mr: 'मुख्यपृष्ठ' },
    schemes: { en: 'Schemes', hi: 'योजनाएं', mr: 'योजना' },
    askJanSeva: { en: 'Ask JanSeva', hi: 'जनसेवा से पूछें', mr: 'जनसेवाला विचारा' },
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      {/* Saffron accent stripe at top */}
      <div className="h-1 w-full saffron-stripe" />
      
      <div className="container flex h-16 items-center justify-between md:h-20">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-2xl md:h-12 md:w-12">
            🏛️
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary md:text-xl font-marathi">
              {t(translations.title)}
            </h1>
            <p className="hidden text-xs text-muted-foreground md:block">
              {t(translations.subtitle)}
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#schemes" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            {t(translations.schemes)}
          </a>
          <a href="#ask" className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            {t(translations.askJanSeva)}
          </a>
        </nav>

        {/* Language Toggle & Mobile Menu */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LanguageToggle />
          </div>
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-card p-4 md:hidden">
          <nav className="flex flex-col gap-3">
            <a 
              href="#schemes" 
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(translations.schemes)}
            </a>
            <a 
              href="#ask" 
              className="rounded-lg px-4 py-3 text-sm font-medium text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t(translations.askJanSeva)}
            </a>
            <div className="pt-2">
              <LanguageToggle />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
