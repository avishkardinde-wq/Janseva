import React from 'react';
import { Search, Mic, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroSectionProps {
  onSearch: (query: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onSearch }) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = React.useState('');

  const translations = {
    title: { 
      en: 'Your Gateway to Government Benefits', 
      hi: 'सरकारी लाभों का आपका द्वार', 
      mr: 'सरकारी लाभांचे तुमचे प्रवेशद्वार' 
    },
    subtitle: { 
      en: 'Find and apply for Maharashtra government schemes in your language', 
      hi: 'महाराष्ट्र सरकार की योजनाओं को अपनी भाषा में खोजें और आवेदन करें', 
      mr: 'महाराष्ट्र सरकारच्या योजना तुमच्या भाषेत शोधा आणि अर्ज करा' 
    },
    searchPlaceholder: { 
      en: 'Search for schemes...', 
      hi: 'योजनाएं खोजें...', 
      mr: 'योजना शोधा...' 
    },
    exploreSchemes: { 
      en: 'Explore Schemes', 
      hi: 'योजनाएं देखें', 
      mr: 'योजना पहा' 
    },
    askAssistant: { 
      en: 'Ask Assistant', 
      hi: 'सहायक से पूछें', 
      mr: 'सहाय्यकाला विचारा' 
    },
    stats: {
      schemes: { en: '50+ Schemes', hi: '50+ योजनाएं', mr: '50+ योजना' },
      citizens: { en: '1Cr+ Citizens', hi: '1 करोड़+ नागरिक', mr: '1 कोटी+ नागरिक' },
      languages: { en: '3 Languages', hi: '3 भाषाएं', mr: '3 भाषा' },
    }
  };

  const handleSearch = () => {
    onSearch(searchQuery);
    const schemesSection = document.getElementById('schemes');
    schemesSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative overflow-hidden hero-gradient min-h-[80vh] flex items-center">
      {/* Decorative elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container relative z-10 py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Emblem/Logo */}
          <div className="mb-8 inline-flex items-center justify-center rounded-full bg-white/10 p-4 backdrop-blur-sm">
            <span className="text-5xl md:text-6xl">🏛️</span>
          </div>

          {/* Title */}
          <h1 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl font-marathi">
            {t(translations.title)}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/80 md:text-xl">
            {t(translations.subtitle)}
          </p>

          {/* Search bar */}
          <div className="mx-auto mb-8 flex max-w-xl gap-2 rounded-2xl bg-white/10 p-2 backdrop-blur-sm">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/60" />
              <Input
                type="text"
                placeholder={t(translations.searchPlaceholder)}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="h-14 border-0 bg-transparent pl-12 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0 text-lg"
              />
            </div>
            <Button 
              variant="hero" 
              size="lg" 
              onClick={handleSearch}
              className="h-14 px-8"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          {/* Action buttons */}
          <div className="mb-12 flex flex-wrap justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:text-white"
              onClick={() => document.getElementById('schemes')?.scrollIntoView({ behavior: 'smooth' })}
            >
              {t(translations.exploreSchemes)}
            </Button>
            <Button
              variant="hero"
              size="lg"
              onClick={() => document.getElementById('ask')?.scrollIntoView({ behavior: 'smooth' })}
            >
              <Mic className="h-5 w-5" />
              {t(translations.askAssistant)}
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {Object.entries(translations.stats).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-white md:text-3xl">
                  {t(value)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-8 w-8 text-white/60" />
        </div>
      </div>
    </section>
  );
};
