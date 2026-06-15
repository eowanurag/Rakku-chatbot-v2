import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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

describe('PRP Verified Profile Flow', () => {
  it('renders prefilled profile information and provides Continue option', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: 'I will use your verified details for this application.\n\nName: **Juhi Pandey**\nAddress: **Ayodhya**\n\n[Continue](option:Continue)',
      avatarState: 'PRP_CONFIRM'
    };

    const { getByText } = render(
      <ChatMessage
        msg={msg}
        idx={1}
        isLatestAssistant={true}
        onOptionClick={mockOnOptionClick}
        translate={mockTranslate}
      />
    );

    expect(getByText(/I will use your verified details/)).toBeInTheDocument();
    expect(getByText('Juhi Pandey')).toBeInTheDocument();

    const continueBtn = getByText('Continue');
    expect(continueBtn).toBeInTheDocument();
    fireEvent.click(continueBtn);
    expect(mockOnOptionClick).toHaveBeenCalledWith('Continue');
  });
});
