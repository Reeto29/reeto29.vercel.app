import { describe, expect, it } from 'vitest';
import { education, experience, profile, projects, SECTION_IDS, skills, socials } from '../content';

describe('content integrity', () => {
  it('exposes an email', () => {
    expect(profile.email).toMatch(/@/);
  });

  it('publishes no résumé path', () => {
    // The résumé is not part of the site, so nothing in the content should point
    // at a downloadable document.
    expect(JSON.stringify(profile)).not.toMatch(/\.pdf/i);
  });

  it('has complete experience entries in reverse-chronological order', () => {
    expect(experience.length).toBeGreaterThan(0);

    for (const entry of experience) {
      expect(entry.company).not.toBe('');
      expect(entry.role).not.toBe('');
      expect(entry.focus).not.toBe('');
      expect(entry.tech.length).toBeGreaterThan(0);
      expect(entry.highlights.length).toBeGreaterThan(0);
    }

    const years = experience.map((entry) => Number(entry.startDate.slice(-4)));
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });

  it('keeps the most recent internship first', () => {
    expect(experience[0].company).toBe('Theory Ventures');
  });

  it('has no duplicate highlight text within an entry', () => {
    for (const entry of experience) {
      expect(new Set(entry.highlights).size).toBe(entry.highlights.length);
    }
  });

  it('backs each role with at least one quantified claim', () => {
    // Guards against the resume-padding failure mode: every role has to carry
    // something measurable.
    for (const entry of experience) {
      const quantified = entry.highlights.filter((highlight) => /\d/.test(highlight));
      expect(quantified.length, `no quantified highlight at ${entry.company}`).toBeGreaterThan(0);
    }
  });

  it('avoids filler phrasing in the copy', () => {
    const copy = JSON.stringify({ profile, experience, projects, skills });

    for (const filler of [
      'seamless',
      'revolutioniz',
      'supercharge',
      'streamlin',
      'empower',
      'unlock the power',
      'not just',
      'cutting-edge',
      'leverage',
      'synergy',
      'passionate',
      'results-driven',
      'agentic',
      'stood up',
      'best-in-class',
      'world-class',
      'innovative',
      'transformative',
      'spearhead',
    ]) {
      expect(copy.toLowerCase(), `filler phrase: ${filler}`).not.toContain(filler);
    }
  });

  it('keeps em dashes out of the prose', () => {
    // The education year range legitimately uses an en dash; prose should not.
    const prose = JSON.stringify({ profile, experience, projects, skills });

    expect(prose).not.toContain('—');
  });

  it('gives every project at least one external link', () => {
    for (const project of projects) {
      expect(project.links.length).toBeGreaterThan(0);
      for (const link of project.links) {
        expect(link.href).toMatch(/^https?:\/\//);
      }
    }
  });

  it('has no duplicate skill entries within a group', () => {
    for (const group of skills) {
      expect(new Set(group.items).size).toBe(group.items.length);
    }
  });

  it('lists each course once', () => {
    for (const entry of education) {
      expect(new Set(entry.coursework).size, `duplicate course at ${entry.institution}`).toBe(
        entry.coursework.length,
      );
      expect(entry.coursework.length).toBeGreaterThan(0);
    }
  });

  it('uses https for every outbound link and mailto for email', () => {
    for (const link of socials) {
      if (link.icon === 'email') {
        expect(link.href).toMatch(/^mailto:/);
      } else {
        expect(link.href).toMatch(/^https:\/\//);
      }
    }
  });

  it('has unique section ids', () => {
    expect(new Set(SECTION_IDS).size).toBe(SECTION_IDS.length);
  });
});
