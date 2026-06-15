import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Announcements from '../../src/lib/accessibility/announcements';

describe('PRP Accessibility Announcements', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'rakku-live-announcer';
    container.className = 'sr-only';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('triggers a polite live region announcement when calling announcements helper', (done) => {
    Announcements.announce('Verified details loaded successfully.', 'polite');

    setTimeout(() => {
      expect(container.textContent).toBe('Verified details loaded successfully.');
      done();
    }, 150);
  });

  it('announces manual entry selection correctly', (done) => {
    Announcements.announce('Manual entry selected.', 'polite');

    setTimeout(() => {
      expect(container.textContent).toBe('Manual entry selected.');
      done();
    }, 150);
  });
});
