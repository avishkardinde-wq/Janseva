import React, { useState } from 'react';
import { Mic, MicOff, Volume2, ExternalLink, ChevronDown, ChevronUp, CheckCircle2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { Scheme, SchemeCategory } from '@/types/scheme';

interface SchemeCardProps {
  scheme: Scheme;
}

const categoryBadgeVariant: Record<SchemeCategory, 'education' | 'health' | 'farmers' | 'women' | 'employment' | 'seniors'> = {
  education: 'education',
  health: 'health',
  farmers: 'farmers',
  women: 'women',
  employment: 'employment',
  seniors: 'seniors',
};

export const SchemeCard: React.FC<SchemeCardProps> = ({ scheme }) => {
  const { language, t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const translation = scheme.translations[language];

  const translations = {
    eligibility: { en: 'Eligibility', hi: 'पात्रता', mr: 'पात्रता' },
    documents: { en: 'Required Documents', hi: 'आवश्यक दस्तावेज', mr: 'आवश्यक कागदपत्रे' },
    benefits: { en: 'Benefits', hi: 'लाभ', mr: 'फायदे' },
    apply: { en: 'Apply Now', hi: 'अभी आवेदन करें', mr: 'आता अर्ज करा' },
    learnMore: { en: 'Learn More', hi: 'और जानें', mr: 'अधिक जाणून घ्या' },
    listenScheme: { en: 'Listen', hi: 'सुनें', mr: 'ऐका' },
    stopListening: { en: 'Stop', hi: 'रुकें', mr: 'थांबा' },
  };

  const speakSchemeDetails = () => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const text = `
        ${translation.name}. 
        ${translation.description}. 
        ${t(translations.eligibility)}: ${translation.eligibility.join('. ')}. 
        ${t(translations.benefits)}: ${translation.benefits.join('. ')}.
      `;

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set language based on current selection
      const langCodes = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
      utterance.lang = langCodes[language];
      utterance.rate = 0.85; // Slower for better understanding
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      {/* Colored top border based on category */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        scheme.category === 'women' ? 'bg-pink-400' :
        scheme.category === 'health' ? 'bg-red-400' :
        scheme.category === 'farmers' ? 'bg-green-500' :
        scheme.category === 'seniors' ? 'bg-amber-400' :
        scheme.category === 'employment' ? 'bg-purple-400' :
        'bg-blue-400'
      }`} />
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{scheme.icon}</span>
            <div>
              <h3 className="font-semibold text-foreground leading-tight line-clamp-2 font-marathi text-lg">
                {translation.name}
              </h3>
              <Badge variant={categoryBadgeVariant[scheme.category]} className="mt-2">
                {scheme.category.charAt(0).toUpperCase() + scheme.category.slice(1)}
              </Badge>
            </div>
          </div>
          
          {/* Voice button */}
          <Button
            variant="voice"
            size="iconSm"
            onClick={speakSchemeDetails}
            className={isSpeaking ? 'voice-pulse bg-accent' : ''}
            title={isSpeaking ? t(translations.stopListening) : t(translations.listenScheme)}
          >
            {isSpeaking ? <Volume2 className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
        </div>
        
        <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
          {translation.description}
        </p>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Quick benefits preview */}
        <div className="mb-4 flex flex-wrap gap-2">
          {translation.benefits.slice(0, 2).map((benefit, i) => (
            <div key={i} className="flex items-center gap-1 text-xs text-secondary">
              <CheckCircle2 className="h-3 w-3" />
              <span className="line-clamp-1">{benefit}</span>
            </div>
          ))}
        </div>

        {/* Expandable section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          {t(translations.learnMore)}
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        {expanded && (
          <div className="mt-4 space-y-4 animate-fade-in">
            {/* Eligibility */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-secondary" />
                {t(translations.eligibility)}
              </h4>
              <ul className="space-y-1">
                {translation.eligibility.map((item, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-accent mt-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Documents */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                {t(translations.documents)}
              </h4>
              <ul className="space-y-1">
                {translation.documents.map((doc, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    {doc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className="text-lg">🎁</span>
                {t(translations.benefits)}
              </h4>
              <ul className="space-y-1">
                {translation.benefits.map((benefit, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-secondary mt-1">✓</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Apply button */}
        <Button
          variant="saffron"
          className="mt-4 w-full gap-2"
          onClick={() => window.open(scheme.applyUrl, '_blank')}
        >
          {t(translations.apply)}
          <ExternalLink className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};
