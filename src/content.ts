import type { Education, Experience, Project, SkillGroup, SocialLink } from './types';

/**
 * Section ids in page order. `SectionList` and the nav are derived from this so a
 * link can never point at a section that does not exist.
 */
export const SECTION_IDS = ['work', 'projects', 'skills', 'education', 'contact'] as const;

export type SectionId = (typeof SECTION_IDS)[number];

export const profile = {
  name: 'reeto ghosh',
  nameTitle: 'Reeto Ghosh',
  location: 'Waterloo, ON',
  email: 'reeto.ghosh@uwaterloo.ca',
  resumePath: '/ReetoGhosh_Resume.pdf',
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
    location: 'San Francisco, CA',
    role: 'AI Engineer Intern',
    focus: 'agent infrastructure, due diligence pipelines',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'GCP', 'FastMCP'],
    startDate: 'May 2026',
    endDate: 'Aug 2026',
    highlights: [
      'Rebuilt the deal scan pipeline from JSON files into SQL over 107k+ entities, taking a full run from 9.5 minutes to under 30 seconds.',
      'Built the notification service on FastAPI and FastMCP, running on Cloud Run and dispatching investor research tasks into isolated sandboxes.',
      'Assembled eval sets from real investor workflows and used them to compare open models on the same tasks.',
    ],
  },
  {
    company: 'Wealthsimple',
    location: 'Toronto, ON',
    role: 'Software Engineer Intern',
    focus: 'product analytics, data quality',
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
    location: 'Toronto, ON',
    role: 'Software Engineer Intern',
    focus: 'market surveillance, query cost',
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
    location: 'Ottawa, ON',
    role: 'Software Engineer Intern',
    focus: 'commodities pipelines, applied nlp',
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
    company: 'Ciena Corporation',
    location: 'Ottawa, ON',
    role: 'Software Engineer Intern',
    focus: 'log triage, internal tooling',
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
    links: [{ label: 'github', href: 'https://github.com/Reeto29' }],
  },
];

export const skills: SkillGroup[] = [
  {
    category: 'Languages',
    items: ['Python', 'SQL', 'TypeScript', 'JavaScript', 'C', 'Bash', 'Racket'],
  },
  {
    category: 'Frameworks',
    items: [
      'FastAPI',
      'Pydantic',
      'SQLAlchemy',
      'Alembic',
      'Docker',
      'FastMCP',
      'ASGI / Uvicorn',
      'REST APIs',
      'JSONB',
    ],
  },
  {
    category: 'Cloud',
    items: [
      'GCP (Cloud Run, Cloud Run Jobs, Cloud Scheduler, Cloud SQL)',
      'Secret Manager',
      'Workload Identity Federation',
      'PostgreSQL',
    ],
  },
  {
    category: 'Data & ML',
    items: [
      'dbt',
      'Airflow',
      'Databricks',
      'PySpark',
      'Redshift',
      'Presto',
      'PyTorch',
      'Transformers',
      'scikit-learn',
      'MotherDuck',
    ],
  },
  {
    category: 'Agents & tooling',
    items: [
      'Sail SDK (Sailboxes)',
      'OpenCode',
      'ContextVars',
      'W3C Tracing',
      'OAuth / OIDC',
      'HMAC',
      'pytest',
      'uv',
      'Ruff',
    ],
  },
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
