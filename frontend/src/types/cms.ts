export interface CmsSeo {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  canonicalUrl: string;
}

export interface CmsAppearance {
  brandName: string;
  badgeText: string;
  primaryColor: string;
  accentColor: string;
  themeMode: 'dark' | 'light' | 'auto';
}

export interface CmsBanner {
  enabled: boolean;
  badge: string;
  text: string;
  linkText: string;
  linkUrl: string;
}

export interface CmsHeroStat {
  label: string;
  value: string;
}

export interface CmsHero {
  badge: string;
  headline: string;
  subtitle: string;
  primaryCta: {
    text: string;
    link: string;
  };
  secondaryCta: {
    text: string;
    link: string;
  };
  heroImage: string;
  stats: CmsHeroStat[];
}

export interface CmsAboutFeature {
  title: string;
  desc: string;
}

export interface CmsAbout {
  badge: string;
  title: string;
  subtitle: string;
  story: string;
  features: CmsAboutFeature[];
}

export interface CmsFeature {
  id: string;
  title: string;
  desc: string;
  icon: string;
  tag: string;
  enabled: boolean;
}

export interface CmsHowStep {
  number: string;
  title: string;
  desc: string;
}

export interface CmsHowItWorks {
  badge: string;
  title: string;
  subtitle: string;
  steps: CmsHowStep[];
}

export interface CmsBenefit {
  title: string;
  desc: string;
}

export interface CmsForSchools {
  badge: string;
  title: string;
  subtitle: string;
  benefits: CmsBenefit[];
}

export interface CmsTechItem {
  title: string;
  desc: string;
  badge: string;
}

export interface CmsTechnology {
  badge: string;
  title: string;
  subtitle: string;
  items: CmsTechItem[];
}

export interface CmsGalleryItem {
  id: string;
  title: string;
  category: 'schools' | 'watches' | 'platform';
  url: string;
  alt: string;
  createdAt?: string;
}

export interface CmsNewsItem {
  id: string;
  title: string;
  date: string;
  summary: string;
}

export interface CmsContact {
  phone: string;
  mobile: string;
  email: string;
  address: string;
  workingHours: string;
  telegram: string;
  instagram?: string;
  youtube?: string;
}

export interface CmsNavLink {
  id?: string;
  label: string;
  href: string;
}

export interface CmsNavigation {
  headerLinks: CmsNavLink[];
  footerLinks: CmsNavLink[];
}

export interface CmsData {
  seo: CmsSeo;
  appearance: CmsAppearance;
  banner: CmsBanner;
  hero: CmsHero;
  about: CmsAbout;
  features: CmsFeature[];
  howItWorks: CmsHowItWorks;
  forSchools: CmsForSchools;
  technology: CmsTechnology;
  gallery: CmsGalleryItem[];
  news: CmsNewsItem[];
  contact: CmsContact;
  navigation: CmsNavigation;
}

export interface CmsHistoryItem {
  id: string;
  version: string;
  publishedAt: string;
  publishedBy: string;
  summary: string;
}

export interface SystemServiceStatus {
  id: string;
  name: string;
  status: 'Operational' | 'Degraded' | 'Offline' | 'Unknown';
  latencyMs: number;
  description: string;
}

export interface SystemStatusResponse {
  success: boolean;
  overall: 'Operational' | 'Degraded' | 'Offline';
  timestamp: string;
  totalResponseTimeMs: number;
  services: SystemServiceStatus[];
}
