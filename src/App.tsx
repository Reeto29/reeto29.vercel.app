import { profile, socials } from './content';
import { useHashScroll } from './hooks/useHashScroll';
import { useScrollReveal } from './hooks/useScrollReveal';
import { PhotoGrid } from './components/PhotoGrid';
import { Work } from './components/Work';
import { RecordShelf } from './components/RecordShelf';
import { Education, Projects, Skills } from './components/Sections';
import { Contact } from './components/Contact';

export default function App() {
  useHashScroll();
  useScrollReveal();

  return (
    <>
      <a className="skip-link" href="#main">
        skip to content
      </a>

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
          </header>
        </div>
      </div>

      <div className="shell">
        <main id="main" tabIndex={-1}>
          <Work />
          <Projects />
          <RecordShelf />
          <Skills />
          <Education />
          <Contact />
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
