import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import { SECTION_IDS, SECTION_LABELS } from '../content';

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
      window.location.hash = '#skills';
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
