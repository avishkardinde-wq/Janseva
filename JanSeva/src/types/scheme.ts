export type Language = 'en' | 'hi' | 'mr';

export type SchemeCategory = 
  | 'education'
  | 'health'
  | 'farmers'
  | 'women'
  | 'employment'
  | 'seniors';

export interface SchemeTranslation {
  name: string;
  description: string;
  eligibility: string[];
  documents: string[];
  benefits: string[];
}

export interface Scheme {
  id: string;
  category: SchemeCategory;
  icon: string;
  applyUrl: string;
  translations: {
    en: SchemeTranslation;
    hi: SchemeTranslation;
    mr: SchemeTranslation;
  };
  faqs: {
    question: { en: string; hi: string; mr: string };
    answer: { en: string; hi: string; mr: string };
  }[];
}

export interface FAQ {
  question: string;
  answer: string;
}
