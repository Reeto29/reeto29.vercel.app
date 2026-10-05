import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { experience, profile, SECTION_IDS, SECTION_LABELS, socials } from '../content';

beforeEach(() => {
  window.location.hash = '';
});

describe('App', () => {
  it('renders the name and degree', () => {
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: 'reeto ghosh' })).toBeInTheDocument();
    expect(screen.getAllByText(/Statistics & Computational Mathematics/).length).toBeGreaterThan(0);
  });

  it('renders a table of contents linking every section, marking the active one', () => {
    render(<App />);

    const toc = screen.getByRole('navigation', { name: /table of contents/i });

    // One link per section, in the same order the sections are laid out.
    const links = within(toc).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(
      SECTION_IDS.map((id) => SECTION_LABELS[id]),
    );

    for (const id of SECTION_IDS) {
      expect(within(toc).getByRole('link', { name: SECTION_LABELS[id] })).toHaveAttribute(
        'href',
        `#${id}`,
      );
    }

    // Exactly one item is marked current; jsdom lays every section out at the top,
    // so the last one wins the reading line.
    expect(toc.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
  });

  it('renders every section named by SECTION_IDS', () => {
    render(<App />);

    for (const id of SECTION_IDS) {
      const section = document.getElementById(id);
      expect(section, `missing section #${id}`).not.toBeNull();
      expect(section?.tagName).toBe('SECTION');
    }
  });

  it('renders the sections in the order SECTION_IDS declares', () => {
    const { container } = render(<App />);

    // The page order and the nav order come from the same list, so the table of
    // contents can never point at a different order than the page itself shows.
    const rendered = [...container.querySelectorAll('main section[id]')].map(
      (section) => section.id,
    );

    expect(rendered).toEqual([...SECTION_IDS]);
  });

  it('gives each section an accessible name via a labelled heading', () => {
    const { container } = render(<App />);

    for (const section of container.querySelectorAll('section[id]')) {
      const labelledBy = section.getAttribute('aria-labelledby');
      expect(labelledBy, `#${section.id} has no aria-labelledby`).toBeTruthy();
      expect(container.querySelector(`#${labelledBy}`)).not.toBeNull();
    }
  });

  it('renders all six internships with company and year', () => {
    render(<App />);

    for (const company of [
      'Theory Ventures',
      'Wealthsimple',
      'Toronto Stock Exchange',
      'Bank of Canada',
      'École de Technologie Supérieure',
      'Ciena Corporation',
    ]) {
      expect(screen.getByText(company)).toBeInTheDocument();
    }
  });

  it('leads each work entry with the company and puts the role under it', () => {
    const { container } = render(<App />);

    // Scoped to the work section: the projects row shares .row__title but is a
    // plain project name, not a linked employer.
    const rows = [...container.querySelectorAll('#work .rows > .row')];
    expect(rows.length).toBeGreaterThan(0);

    for (const row of rows) {
      const meta = row.querySelector('.row__meta');
      const title = meta?.querySelector('.row__title');
      const org = meta?.querySelector('.row__org');

      // The company is the heading and carries the link out; the role sits below it
      // in the secondary colour. Reading the list by employer is how it gets scanned.
      expect(title?.tagName).toBe('A');
      expect(title?.getAttribute('href')).toMatch(/^https:\/\//);
      expect(org?.tagName).toBe('SPAN');
      expect(org?.textContent).toMatch(/\S/);
      expect(org?.querySelector('a')).toBeNull();

      // And the company really does come first in document order.
      const order = [...(meta?.children ?? [])];
      expect(order.indexOf(title as Element)).toBeLessThan(order.indexOf(org as Element));
    }
  });

  it('gives every company a blurb carrying a figure for its size', () => {
    const { container } = render(<App />);

    const rows = [...container.querySelectorAll('#work .rows > .row')];
    expect(rows).toHaveLength(experience.length);

    for (const row of rows) {
      const blurb = row.querySelector('.row__blurb');
      const text = blurb?.textContent ?? '';

      // A sentence about what the company is, with something countable in it, so
      // a reader knows the scale before reading a word about the work.
      expect(text.trim().length).toBeGreaterThan(40);
      expect(text, `no figure in: ${text}`).toMatch(/\d/);
      expect(text.endsWith('.')).toBe(true);

      // Collapsed, the description is the body of the entry: it sits opposite the
      // company, above the toggle, and stays visible when the details are shut.
      expect(blurb?.closest('.row__body')).not.toBeNull();
      expect(blurb?.closest('.row__details')).toBeNull();
    }
  });

  it('keeps the details behind a see more toggle under the description', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    const rows = [...container.querySelectorAll<HTMLElement>('#work .rows > .row')];

    rows.forEach((row, index) => {
      const toggle = row.querySelector('.row__toggle');
      const details = row.querySelector('.row__details');

      expect(toggle?.textContent).toMatch(/^›see more/);
      expect(toggle?.textContent).toContain(experience[index].company);
      expect(toggle?.previousElementSibling).toHaveClass('row__blurb');
      expect(toggle).toHaveAttribute('aria-expanded', 'false');
      expect(toggle?.getAttribute('aria-controls')).toBe(details?.id);

      // Collapsed details cannot be tabbed into or read out.
      expect(details).toHaveAttribute('inert');
    });

    const [first, second] = rows;
    await user.click(first.querySelector('.row__toggle') as HTMLElement);

    expect(first.querySelector('.row__toggle')).toHaveAttribute('aria-expanded', 'true');
    expect(first.querySelector('.row__toggle')?.textContent).toMatch(/see less/);
    expect(first.querySelector('.row__details')).not.toHaveAttribute('inert');
    expect(first.querySelectorAll('.row__notes li')).toHaveLength(experience[0].highlights.length);

    // Opening one leaves the others as they were.
    expect(second.querySelector('.row__toggle')).toHaveAttribute('aria-expanded', 'false');

    await user.click(first.querySelector('.row__toggle') as HTMLElement);
    expect(first.querySelector('.row__details')).toHaveAttribute('inert');
  });

  it('puts the contact links under the intro instead of in a section', () => {
    const { container } = render(<App />);

    const reach = container.querySelector('.masthead .masthead__reach');
    expect(reach?.textContent).toMatch(/find me/i);

    const hrefs = [...(reach?.querySelectorAll('a') ?? [])].map((link) =>
      link.getAttribute('href'),
    );
    expect(hrefs).toContain(`mailto:${profile.email}`);
    for (const link of socials.filter((social) => social.icon !== 'email')) {
      expect(hrefs).toContain(link.href);
    }

    expect(container.querySelector('#contact')).toBeNull();
  });

  it('offers a skip link as the first focusable element', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.tab();

    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveFocus();
  });

  it('scrolls to the section named in the URL hash on load', () => {
    const scrollIntoView = vi.fn();
    const original = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = scrollIntoView;

    try {
      window.location.hash = '#education';
      render(<App />);

      expect(scrollIntoView).toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
    }
  });

  it('sets rel on every link that opens a new tab', () => {
    render(<App />);

    const external = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('target') === '_blank');
    expect(external.length).toBeGreaterThan(0);

    for (const link of external) {
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  it('offers no résumé download anywhere on the page', () => {
    render(<App />);

    // Deliberately a negative assertion: the résumé is not published, so there
    // must be no link to a PDF and no file sitting behind one.
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toMatch(/\.pdf$/i);
      expect(link).not.toHaveAttribute('download');
    }

    expect(document.body.textContent ?? '').not.toMatch(/r[ée]sum[ée]/i);
  });

  it('has no links pointing at a dead href', () => {
    render(<App />);

    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href') ?? '';
      expect(href, `dead link: ${href}`).not.toBe('#');
      expect(href).not.toBe('');
    }
  });

  it('links out to real profiles and an email address', () => {
    render(<App />);

    const githubLinks = screen.getAllByRole('link', { name: /^github/ });
    for (const link of githubLinks) {
      expect(link).toHaveAttribute('href', 'https://github.com/Reeto29');
    }

    const emailLinks = screen.getAllByRole('link', { name: /reeto\.ghosh@uwaterloo\.ca/ });
    for (const link of emailLinks) {
      expect(link).toHaveAttribute('href', 'mailto:reeto.ghosh@uwaterloo.ca');
    }
  });
  it('states who he is and what he is looking for in the intro', () => {
    render(<App />);

    const summary = document.querySelector('.masthead__summary')?.textContent ?? '';

    expect(summary.toLowerCase()).toContain('waterloo');
    expect(summary.toLowerCase()).toContain('april 2027');
    expect(summary.toLowerCase()).toMatch(/full time|full-time/);
  });

  it('describes the photo grid once instead of per image', () => {
    const { container } = render(<App />);

    const stage = container.querySelector('.grid__stage');
    expect(stage).not.toBeNull();
    expect(stage).toHaveAttribute('aria-label');

    // Decorative images carry empty alt; the descriptive copy lives in photos.ts.
    for (const img of container.querySelectorAll('.grid__img')) {
      expect(img.getAttribute('alt')).toBe('');
    }
  });

  it('overlays the name on the photo grid rather than stacking them', () => {
    const { container } = render(<App />);

    const name = container.querySelector('h1');
    const stage = container.querySelector('.grid__stage');

    expect(name).not.toBeNull();
    expect(stage).not.toBeNull();

    // Same hero: the type sits on the band, and the scrim keeps it legible.
    expect(name!.closest('.hero')).toBe(stage!.closest('.hero'));
    expect(name!.closest('.hero')!.querySelector('.grid__scrim')).not.toBeNull();
  });

  it('does not use emoji as icons or bullets', () => {
    const { container } = render(<App />);

    // Matches emoji blocks only, so typographic marks like © and — are fine.
    const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F000}-\u{1F2FF}]|\u{FE0F}|\u{20E3}/u;

    expect(container.textContent ?? '').not.toMatch(emoji);
  });
});
