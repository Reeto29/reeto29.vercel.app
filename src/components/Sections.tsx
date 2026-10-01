import { education, projects, skills } from '../content';
import { ExternalArrow } from './icons';

export function Projects() {
  return (
    <section className="section" id="projects" aria-labelledby="projects-heading">
      <h2 className="label section__label" id="projects-heading">
        projects
      </h2>

      <div className="section__body">
        <ul className="rows">
          {projects.map((project) => (
            <li className="row" key={project.title}>
              <div className="row__meta">
                <span className="row__title">{project.title}</span>
                {project.venue && <span className="row__dates">{project.venue}</span>}
              </div>

              <div className="row__body">
                <p className="row__desc">{project.description}</p>

                <p className="row__stack">{project.tech.join(', ')}</p>

                <ul className="row__links">
                  {project.links.map((link) => (
                    <li key={link.href}>
                      <a
                        className="row__link sweep-host"
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="sweep">{link.label}</span>
                        <ExternalArrow className="row__arrow" />
                        <span className="visually-hidden"> (opens in new tab)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Skills() {
  return (
    <section className="section" id="skills" aria-labelledby="skills-heading">
      <h2 className="label section__label" id="skills-heading">
        skills
      </h2>

      <div className="section__body">
        <dl className="skills">
          {skills.map((group) => (
            <div className="skills__row" key={group.category}>
              <dt className="skills__key">{group.category}</dt>
              <dd className="skills__val">{group.items.join(', ')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Education() {
  const [degree] = education;

  return (
    <section className="section" id="education" aria-labelledby="education-heading">
      <h2 className="label section__label" id="education-heading">
        education
      </h2>

      <div className="section__body">
        <div className="row row--static">
          <div className="row__meta">
            <span className="row__title row__title--serif">{degree.degree}</span>
            <span className="row__dates">
              {degree.startDate.slice(-4)} – {degree.endDate.slice(-4)}
            </span>
          </div>

          <div className="row__body">
            <p className="row__desc">
              {degree.institution}, {degree.location}
            </p>
          </div>
        </div>

        <dl className="skills skills--inset">
          <div className="skills__row">
            <dt className="skills__key">coursework</dt>
            <dd className="skills__val">{degree.coursework.join(', ')}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
