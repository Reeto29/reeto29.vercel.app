import { useId, useState } from 'react';
import type { Experience as ExperienceEntry } from '../types';
import { experience, socials } from '../content';
import { ExternalArrow } from './icons';

function Entry({ entry }: { entry: ExperienceEntry }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();

  const startYear = entry.startDate.slice(-4);
  const endYear = entry.endDate.slice(-4);

  return (
    <li className="row" data-open={open ? 'true' : undefined}>
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
          Collapsed, the body is just what the company is. The work itself sits
          behind "see more", so the list scans as a run of employers first.
        */}
        <p className="row__blurb">{entry.blurb}</p>

        <button
          type="button"
          className="row__toggle"
          aria-expanded={open}
          aria-controls={detailsId}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="row__chevron" aria-hidden="true">
            ›
          </span>
          {open ? 'see less' : 'see more'}
          <span className="visually-hidden"> about {entry.company}</span>
        </button>

        {/*
          Collapsed by animating the grid row from 0fr to 1fr, which lets the
          details slide to their natural height without measuring them. While
          closed they are inert, so nothing hidden can be tabbed to or read out.
        */}
        <div className="row__details" id={detailsId} inert={!open}>
          <div className="row__details-inner">
            <ul className="row__notes">
              {entry.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            <p className="row__stack">{entry.tech.join(', ')}</p>
          </div>
        </div>
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
