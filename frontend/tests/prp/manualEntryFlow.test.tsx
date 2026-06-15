import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../../src/components/chat/ChatMessage';

// Mock language context for components that need it
jest.mock('../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    selectedLanguage: 'en',
    changeLanguage: () => {},
    translate: (key: string) => key,
  })
}));

describe('PRP Manual Entry Flow', () => {
  it('renders input prompts sequentially when manual entry is selected', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: "What is your full name? (Please type your full name matching your ID)",
      avatarState: 'TALKING'
    };

    const { getByText } = render(
      <ChatMessage
        msg={msg}
        idx={2}
        isLatestAssistant={true}
        onOptionClick={mockOnOptionClick}
        translate={mockTranslate}
      />
    );

    expect(getByText(/What is your full name/)).toBeInTheDocument();
  });
});
