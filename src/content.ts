import type { Education, Experience, Project, SocialLink } from './types';

/**
 * Section ids in page order. `SectionList` and the nav are derived from this so a
 * link can never point at a section that does not exist.
 */
export const SECTION_IDS = ['work', 'projects', 'education', 'records'] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/**
 * Display names for the sections, used by the table of contents. Every id is its
 * own label except the record shelf, which reads as data rather than as the
 * listening shelf it is; its id stays `records` so its anchor and aria wiring are
 * unchanged, only the words on screen move.
 */
export const SECTION_LABELS: Record<SectionId, string> = {
  records: 'music i like',
  work: 'work',
  projects: 'projects',
  education: 'education',
};

export const profile = {
  name: 'reeto ghosh',
  nameTitle: 'Reeto Ghosh',
  location: 'Waterloo, ON',
  email: 'reeto.ghosh@uwaterloo.ca',
  degree: 'B.Math (Honors), Statistics & Computational Mathematics',
  summary:
    "i'm in my last year at waterloo, graduating april 2027. currently looking for full time " +
    'software engineering roles.',
} as const;

export const socials: SocialLink[] = [
  { label: 'github', href: 'https://github.com/Reeto29', icon: 'github' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/reetoghosh/', icon: 'linkedin' },
  { label: 'email', href: 'mailto:reeto.ghosh@uwaterloo.ca', icon: 'email' },
];

export const experience: Experience[] = [
  {
    company: 'Theory Ventures',
    url: 'https://theoryvc.com/',
    blurb:
      '15-person venture firm led by tomasz tunguz, investing in ai and data companies with $688m across just two funds.',
    location: 'San Francisco, CA',
    role: 'AI Engineer Intern',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'GCP', 'FastMCP'],
    startDate: 'May 2026',
    endDate: 'Aug 2026',
    highlights: [
      'Architected a notifications system using FastAPI, PostgreSQL, and FastMCP on Cloud Run, routing scheduled workflows to investors while executing background due diligence to autonomously surface companies and founders.',
      'Deployed isolated agent sandboxes to securely dispatch automated research tasks to interactive Google Chat cards.',
      'Instrumented eval sets using investor workflows to benchmark open models, refine tool descriptions, and optimize skills.',
      'Re-architected JSON pipelines to SQL for 107k+ entities, slashing deal scan runtimes from 9.5 minutes to under 30 seconds.',
    ],
  },
  {
    company: 'Wealthsimple',
    url: 'https://www.wealthsimple.com/en-ca',
    blurb:
      'canadian fintech valued at $10 billion, managing $155.6 billion in assets for 3.6 million clients.',
    location: 'Toronto, ON',
    role: 'Software Engineer Intern',
    tech: ['Python', 'SQL', 'dbt', 'Airflow', 'Preset'],
    startDate: 'Jan 2026',
    endDate: 'Apr 2026',
    highlights: [
      'Shipped dbt models that merged mobile event data into 169k+ records, and adoption of the resulting metrics doubled.',
      'Hardened Airflow DAGs against bad upstream data; the geocoding job now processes 4,100+ addresses at a 99.7% match rate.',
      'Rewrote SQL models to stitch together legacy sources, recovering 18+ months of dropped metrics and 40k monthly sessions.',
      'Reconciled ML enrichments across 117M+ transactions and surfaced a 1.3M record coverage gap.',
    ],
  },
  {
    company: 'Toronto Stock Exchange',
    url: 'https://www.tsx.com/',
    blurb:
      'canada\u2019s main stock exchange, home to about 40% of the world\u2019s public mining companies, more than any other market.',
    location: 'Toronto, ON',
    role: 'Software Engineer Intern',
    tech: ['Python', 'SQL', 'Presto', 'Hive', 'Apache Spark'],
    startDate: 'May 2025',
    endDate: 'Aug 2025',
    highlights: [
      'Put a trader classification model into production scoring 50k+ participants a day, which improved anomaly detection by 15%.',
      'Maintained Python and SQL pipelines on Presto carrying 5TB+ of daily trading data.',
      'Moved 500+ recurring analytical queries to Athena, cutting p95 latency 70% and compute spend 20%.',
    ],
  },
  {
    company: 'Bank of Canada',
    url: 'https://www.bankofcanada.ca/',
    blurb:
      'canada\u2019s central bank: sets interest rates for a ca$3 trillion economy and is the sole issuer of its banknotes.',
    location: 'Ottawa, ON',
    role: 'Software Engineer Intern',
    tech: ['Python', 'PyTorch', 'Databricks', 'Azure Data Factory'],
    startDate: 'Sep 2024',
    endDate: 'Dec 2024',
    highlights: [
      'Standardized 10M+ daily commodities records through Databricks and PySpark, registered in Unity Catalog.',
      'Ran a fine-tuned BERT classifier over 100k+ news articles to score sentiment daily.',
      'Fitted ARIMA and GAM models to macroeconomic series for a co-authored GDP estimation paper.',
    ],
  },
  {
    company: 'École de Technologie Supérieure',
    url: 'https://www.etsmtl.ca/',
    blurb:
      'montreal\u2019s engineering school: a quarter of quebec\u2019s new engineers graduate from here, 2nd in canada for engineering degrees.',
    location: 'Montreal, QC',
    role: 'Research Intern',
    tech: ['C', 'Python', 'SimGrid', 'ytopt'],
    startDate: 'Jan 2024',
    endDate: 'Apr 2024',
    highlights: [
      'Conducted NSERC-funded research in high-performance computing, using SimGrid and Bayesian optimization to tune large-scale simulations.',
      'Implemented compiler optimization techniques in C, achieving a 10% reduction in overall simulation runtime.',
      'Validated Bayesian-optimized simulations against baselines by analyzing Pearson correlation and Euclidean distance.',
    ],
  },
  {
    company: 'Ciena Corporation',
    url: 'https://www.ciena.com/',
    blurb:
      'the #1 optical networking supplier to cloud providers worldwide, with $4.77 billion in fiscal 2025 revenue.',
    location: 'Ottawa, ON',
    role: 'Software Engineer Intern',
    tech: ['Python', 'SQL'],
    startDate: 'May 2023',
    endDate: 'Aug 2023',
    highlights: [
      'Built a keyword-detection pipeline over 5GB+ of daily logs that files JIRA issues automatically.',
      'Shipped an OpenSearch dashboard for error triage that 70+ engineers use.',
      'Designed a Flask + PostgreSQL service for test results, saving the team 200+ hours a year.',
    ],
  },
];

export const projects: Project[] = [
  {
    title: 'Code from Captures',
    venue: 'CUCAI',
    tech: ['Python', 'TensorFlow', 'Transformers'],
    description:
      'Multimodal pipeline that turns UI screenshots into HTML and CSS. Wrote the vision-to-code model and presented the comparative results at the Canadian Undergraduate Conference on AI.',
    links: [
      {
        label: 'paper',
        href: 'https://drive.google.com/file/d/1aSMlfpieOhFJwanJBxsmo3vzqLbcT-Ge/view',
      },
    ],
  },
];

/**
 * Live performance clips, shown under the shelf.
 *
 * Thumbnails are self-hosted in `public/videos/` rather than hotlinked, so nothing
 * reaches YouTube until someone actually presses play.
 */
export type Video = {
  /** YouTube video id, taken from the `youtu.be` link. */
  id: string;
  artist: string;
  venue: string;
};

export const videos: Video[] = [
  { id: 'QrR_gm6RqCo', artist: 'Mac Miller', venue: 'NPR Tiny Desk Concert' },
  { id: 'PBKa-AAy_vo', artist: 'Daniel Caesar', venue: 'NPR Tiny Desk Concert' },
  { id: 'LTzmjU8aOR4', artist: 'Saba', venue: 'NPR Tiny Desk Concert' },
  { id: 'l0MqlDbZ_as', artist: 'Aminé', venue: 'NPR Tiny Desk Concert' },
];

export const education: Education[] = [
  {
    institution: 'University of Waterloo',
    location: 'Waterloo, ON',
    degree: 'B.Math (Honors), Statistics & Computational Mathematics',
    startDate: 'Sep 2022',
    endDate: 'Apr 2027',
    coursework: [
      'Statistical Classification',
      'Machine Learning in Economics',
      'Computational Statistics & Data Analysis',
      'Linear Models',
      'Stochastic Processes',
      'Data Structures & Algorithms',
    ],
  },
];
