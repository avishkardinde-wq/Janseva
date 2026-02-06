import React, { useState, useMemo } from 'react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { HeroSection } from '@/components/HeroSection';
import { CategoryFilter } from '@/components/CategoryFilter';
import { SchemeCard } from '@/components/SchemeCard';
import { AskJanSeva } from '@/components/AskJanSeva';
import { schemes } from '@/data/schemes';

const IndexContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const translations = {
    schemesTitle: { 
      en: 'Government Schemes', 
      hi: 'सरकारी योजनाएं', 
      mr: 'सरकारी योजना' 
    },
    schemesSubtitle: { 
      en: 'Explore schemes designed for your benefit', 
      hi: 'आपके लाभ के लिए बनाई गई योजनाओं को देखें', 
      mr: 'तुमच्या फायद्यासाठी तयार केलेल्या योजना पहा' 
    },
    askTitle: { 
      en: 'Need Help?', 
      hi: 'मदद चाहिए?', 
      mr: 'मदत हवी आहे?' 
    },
    askSubtitle: { 
      en: 'Ask our AI assistant about any scheme in your language', 
      hi: 'हमारे AI सहायक से किसी भी योजना के बारे में अपनी भाषा में पूछें', 
      mr: 'आमच्या AI सहाय्यकाला तुमच्या भाषेत कोणत्याही योजनेबद्दल विचारा' 
    },
    noResults: {
      en: 'No schemes found. Try a different search or category.',
      hi: 'कोई योजना नहीं मिली। कोई अलग खोज या श्रेणी आज़माएं।',
      mr: 'कोणतीही योजना सापडली नाही. वेगळी शोध किंवा श्रेणी वापरून पहा.'
    }
  };

  const filteredSchemes = useMemo(() => {
    return schemes.filter((scheme) => {
      const matchesCategory = activeCategory === 'all' || scheme.category === activeCategory;
      
      if (!searchQuery) return matchesCategory;
      
      const translation = scheme.translations[language];
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        translation.name.toLowerCase().includes(searchLower) ||
        translation.description.toLowerCase().includes(searchLower) ||
        translation.benefits.some(b => b.toLowerCase().includes(searchLower));
      
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery, language]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection onSearch={handleSearch} />

        {/* Schemes Section */}
        <section id="schemes" className="py-16 md:py-24">
          <div className="container">
            {/* Section header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl font-marathi">
                {t(translations.schemesTitle)}
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                {t(translations.schemesSubtitle)}
              </p>
            </div>

            {/* Category filter */}
            <div className="mb-12">
              <CategoryFilter
                activeCategory={activeCategory}
                onCategoryChange={setActiveCategory}
              />
            </div>

            {/* Schemes grid */}
            {filteredSchemes.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSchemes.map((scheme, index) => (
                  <div
                    key={scheme.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <SchemeCard scheme={scheme} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <p className="text-lg text-muted-foreground">
                  {t(translations.noResults)}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Ask JanSeva Section */}
        <section id="ask" className="bg-muted/30 py-16 md:py-24">
          <div className="container">
            {/* Section header */}
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl font-marathi">
                {t(translations.askTitle)}
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                {t(translations.askSubtitle)}
              </p>
            </div>

            <AskJanSeva />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <LanguageProvider>
      <IndexContent />
    </LanguageProvider>
  );
};

export default Index;
