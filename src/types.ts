export type Experience = {
  company: string;
  /** Company site the company name links to. */
  url: string;
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
  /**
   * Title of the one track this record plays, chosen by hand rather than taken
   * from whichever track Apple happens to list first.
   */
  trackName: string;
  /**
   * Apple's 30 second preview clip for that track, on Apple's CDN.
   *
   * Verified against the Canadian storefront for every record: each album's own
   * track list was looked up and matched on collection name, so a preview can
   * never belong to the wrong record. The Canadian store is the one that carries
   * the region-locked releases (Freudian, The Lo-Fis) the US storefront omits.
   */
  previewUrl: string;
  /** Apple Music page for the track, offered as a way out to the full album. */
  link: string;
};
