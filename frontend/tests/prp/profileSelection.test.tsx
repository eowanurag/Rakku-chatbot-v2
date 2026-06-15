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

describe('PRP Profile Selection Screen', () => {
  it('should render the verified profile choice prompt and trigger option click', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    const msg = {
      role: 'assistant' as const,
      text: 'I found a verified profile:\n\nName: **Juhi Pandey**\n\nHow would you like to proceed?\n\n- [Use My Verified Details](option:Use My Verified Details)\n- [Apply For Someone Else](option:Apply For Someone Else)',
      avatarState: 'PRP_CHOICE'
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

    // Verify option buttons exist and can be clicked
    const btnUse = getByText('Use My Verified Details');
    const btnSomeone = getByText('Apply For Someone Else');

    expect(btnUse).toBeInTheDocument();
    expect(btnSomeone).toBeInTheDocument();

    fireEvent.click(btnUse);
    expect(mockOnOptionClick).toHaveBeenCalledWith('Use My Verified Details');

    fireEvent.click(btnSomeone);
    expect(mockOnOptionClick).toHaveBeenCalledWith('Apply For Someone Else');
  });
});
