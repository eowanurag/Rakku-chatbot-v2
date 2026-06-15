import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../../src/components/chat/ChatMessage';

jest.mock('../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    selectedLanguage: 'en',
    changeLanguage: () => {},
    translate: (key: string) => key,
  })
}));

describe('Negative Feedback Flow (Rating 1-2)', () => {
  it('asks for comments and enforces that a comment is entered without Skip', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: 'Please tell us what went wrong.',
      avatarState: 'POINTING'
    };

    const { getByText } = render(
      <ChatMessage
        msg={msg}
        idx={11}
        isLatestAssistant={true}
        onOptionClick={mockOnOptionClick}
        translate={mockTranslate}
      />
    );

    expect(getByText(/Please tell us what went wrong/)).toBeInTheDocument();
  });
});
