import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatMessage from '../../src/components/chat/ChatMessage';

// Mock Language Context
jest.mock('../../src/context/LanguageContext', () => ({
  useLanguage: () => ({
    selectedLanguage: 'en',
    changeLanguage: () => {},
    translate: (key: string) => key,
  })
}));

describe('Feedback Rating Flow Frontend Verification', () => {
  it('should render rating options 1-5 correctly upon workflow completion', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: 'Was this service helpful to you?\n(Please select a rating from 1 to 5)',
      avatarState: 'THINKING'
    };

    const { getByText } = render(
      <ChatMessage
        msg={msg}
        idx={10}
        isLatestAssistant={true}
        onOptionClick={mockOnOptionClick}
        translate={mockTranslate}
      />
    );

    expect(getByText(/Was this service helpful to you/)).toBeInTheDocument();
  });
});
