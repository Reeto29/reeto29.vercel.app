export type Experience = {
  company: string;
  location: string;
  role: string;
  /** Short phrase naming what the work covered, e.g. "agent infrastructure". */
  focus: string;
  tech: string[];
  startDate: string;
  endDate: string;
  highlights: string[];
};

export type Education = {
  institution: string;
  location: string;
  degree: string;
  startDate: string;
  endDate: string;
  coursework: string[];
};

export type Project = {
  title: string;
  venue?: string;
  tech: string[];
  description: string;
  links: { label: string; href: string }[];
};

export type SkillGroup = {
  category: string;
  items: string[];
};

export type SocialLink = {
  label: string;
  href: string;
  icon: 'github' | 'linkedin' | 'email';
};

export type Album = {
  /** Stable id, also the cover filename under `public/albums/`. */
  slug: string;
  title: string;
  artist: string;
  year: number;
  /** Path to the front cover in `public/albums/`. */
  cover: string;
};
