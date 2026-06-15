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

describe('Positive Feedback Flow (Rating 4-5)', () => {
  it('displays the thank you message immediately without asking for mandatory comments', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: '👮 Thank you for your feedback! It helps me learn and serve you better.',
      avatarState: 'SUCCESS'
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

    expect(getByText(/Thank you for your feedback/)).toBeInTheDocument();
  });
});
