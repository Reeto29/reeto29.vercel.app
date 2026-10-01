import { profile, socials } from '../content';
import { ExternalArrow } from './icons';

export function Contact() {
  return (
    <section className="section" id="contact" aria-labelledby="contact-heading">
      <h2 className="label section__label" id="contact-heading">
        contact
      </h2>

      <div className="section__body">
        <p className="contact__line">
          <a className="sweep" href={`mailto:${profile.email}`}>
            {profile.email}
          </a>
        </p>

        <p className="contact__line">
          {socials.map((link, index) => (
            <span key={link.href}>
              {index > 0 && <span className="contact__sep"> / </span>}
              <a
                className="sweep"
                href={link.href}
                {...(link.icon === 'email' ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
              >
                {link.label}
                {link.icon !== 'email' && (
                  <>
                    <ExternalArrow className="inline-arrow" />
                    <span className="visually-hidden"> (opens in new tab)</span>
                  </>
                )}
              </a>
            </span>
          ))}
        </p>

        <p className="contact__note">graduating april 2027. open to 2027 new grad roles.</p>
      </div>
    </section>
  );
}
