import type { Experience as ExperienceEntry } from '../types';
import { experience, socials } from '../content';
import { ExternalArrow } from './icons';

function Entry({ entry }: { entry: ExperienceEntry }) {
  const startYear = entry.startDate.slice(-4);
  const endYear = entry.endDate.slice(-4);

  return (
    <li className="row">
      <div className="row__meta">
        {/*
          Company leads and the role sits under it. Reading the list by employer
          first is how it is actually scanned, and it gives the linked name the
          prominence the link deserves.
        */}
        <a className="row__title sweep" href={entry.url} target="_blank" rel="noopener noreferrer">
          {entry.company}
          <ExternalArrow className="inline-arrow" />
          <span className="visually-hidden"> (opens in new tab)</span>
        </a>

        <span className="row__org">{entry.role}</span>

        <span className="row__dates">
          {startYear === endYear ? startYear : `${startYear} – ${endYear}`}
        </span>
        <span className="row__where">{entry.location}</span>
      </div>

      <div className="row__body">
        {/*
            What the company is and how big it is, before what the work there was.
            It sits at the top of the body rather than under the company name
            because that column is 13rem wide and the sentence would wrap to six or
            seven lines there.
          */}
        <p className="row__blurb">{entry.blurb}</p>

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
