import { profile, socials } from './content';
import { useHashScroll } from './hooks/useHashScroll';
import { useScrollReveal } from './hooks/useScrollReveal';
import { PhotoGrid } from './components/PhotoGrid';
import { Work } from './components/Work';
import { RecordShelf } from './components/RecordShelf';
import { Education, Projects } from './components/Sections';
import { TableOfContents } from './components/TableOfContents';
import { ExternalArrow } from './components/icons';

export default function App() {
  useHashScroll();
  useScrollReveal();

  return (
    <>
      <a className="skip-link" href="#main">
        skip to content
      </a>

      <TableOfContents />

      <div className="grain" aria-hidden="true" />

      {/*
        The hero sits outside the centred column so the photo grid can bleed to
        the viewport edges, while its own inner .shell keeps the type aligned
        with the rest of the page.
      */}
      <div className="hero">
        <PhotoGrid />

        <div className="shell shell--hero">
          <header className="masthead">
            <h1 className="masthead__name">{profile.name}</h1>
            <p className="masthead__meta">
              <span>
                <span className="masthead__at">@</span>
                {profile.location}
              </span>
              <span className="masthead__degree">{profile.degree}</span>
            </p>

            <p className="masthead__summary">{profile.summary}</p>

            {/*
              Contact lives here rather than in a section at the bottom: the intro
              says what is being looked for, so the way to get in touch sits right
              under it, where a reader already is.
            */}
            <p className="masthead__reach">
              <span className="masthead__reach-label">find me</span>
              <a className="sweep" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
              {socials
                .filter((link) => link.icon !== 'email')
                .map((link) => (
                  <a
                    key={link.href}
                    className="sweep"
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                    <ExternalArrow className="inline-arrow" />
                    <span className="visually-hidden"> (opens in new tab)</span>
                  </a>
                ))}
            </p>
          </header>
        </div>
      </div>

      <div className="shell">
        <main id="main" tabIndex={-1}>
          <Work />
          <Projects />
          <Education />
          <RecordShelf />
        </main>

        <footer className="site-footer">
          <span>
            © {new Date().getFullYear()} {profile.nameTitle}
          </span>
          <ul className="site-footer__links">
            {socials.map((link) => (
              <li key={link.href}>
                <a
                  className="sweep"
                  href={link.href}
                  {...(link.icon === 'email'
                    ? {}
                    : { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {link.label}
                  <span className="visually-hidden">
                    {link.icon === 'email' ? '' : ' (opens in new tab)'}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </footer>
      </div>
    </>
  );
}
