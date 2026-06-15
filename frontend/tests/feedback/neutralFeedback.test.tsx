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

describe('Neutral Feedback Flow (Rating 3)', () => {
  it('asks for optional comments and presents a Skip option', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: 'Would you like to tell us more? (Optional)',
      avatarState: 'TALKING'
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

    expect(getByText(/Would you like to tell us more/)).toBeInTheDocument();
  });
});
