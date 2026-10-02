import type { Experience as ExperienceEntry } from '../types';
import { experience, socials } from '../content';
import { ExternalArrow } from './icons';

function Entry({ entry }: { entry: ExperienceEntry }) {
  const startYear = entry.startDate.slice(-4);
  const endYear = entry.endDate.slice(-4);

  return (
    <li className="row">
      <div className="row__meta">
        <span className="row__title">{entry.role}</span>
        <span className="row__org">
          <span className="row__at">@</span>
          {entry.company}
        </span>
        <span className="row__dates">
          {startYear === endYear ? startYear : `${startYear} – ${endYear}`}
        </span>
        <span className="row__where">{entry.location}</span>
      </div>

      <div className="row__body">
        <p className="row__desc">{entry.focus}</p>

        <ul className="row__notes">
          {entry.highlights.map((highlight) => (
            <li key={highlight}>{highlight}</li>
          ))}
        </ul>

        <p className="row__stack">{entry.tech.join(', ')}</p>
      </div>
    </li>
  );
}

export function Work() {
  return (
    <section className="section" id="work" aria-labelledby="work-heading">
      <h2 className="label section__label" id="work-heading">
        work
      </h2>

      <div className="section__body">
        <ul className="rows">
          {experience.map((entry) => (
            <Entry key={`${entry.company}-${entry.role}`} entry={entry} />
          ))}
        </ul>

        <p className="footnote">
          everything else on{' '}
          <a className="sweep" href={socials[0].href} target="_blank" rel="noopener noreferrer">
            github
            <ExternalArrow className="inline-arrow" />
            <span className="visually-hidden"> (opens in new tab)</span>
          </a>
        </p>
      </div>
    </section>
  );
}
