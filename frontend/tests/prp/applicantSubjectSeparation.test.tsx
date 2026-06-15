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

describe('PRP Applicant/Subject Separation', () => {
  it('correctly parses and renders distinct details for Applicant and Subject in separate cards', () => {
    const mockOnOptionClick = jest.fn();
    const mockTranslate = jest.fn((k) => k);

    // Mock review text format from chat.service.ts
    const text = `👮 **Please review your application.**

Applicant Name: **Vikram Sen**
Applicant Mobile: **9876543210**

**Review Candidate Details**
Subject Information Source: **✓ Provided Manually**
Subject Name: **Rahul Sen**
Subject Address: **Ayodhya Cantt**
District: **Ayodhya**
Purpose: **Job**

**Validation Status**
✓ Subject Name Valid
✓ Ready for Submission`;

    const msg = {
      role: 'assistant' as const,
      text,
      isStreaming: false,
      avatarState: 'COMPLETED'
    };

    const { getByText, container } = render(
      <ChatMessage
        msg={msg}
        idx={3}
        isLatestAssistant={false}
        onOptionClick={mockOnOptionClick}
        translate={mockTranslate}
      />
    );

    // Should find containers for review cards
    const reviewContainer = container.querySelector('#prp-review-container');
    expect(reviewContainer).toBeInTheDocument();

    // Verify Applicant details are present in the document
    expect(getByText('Vikram Sen')).toBeInTheDocument();
    expect(getByText('9876543210')).toBeInTheDocument();

    // Verify Subject details are present in the document
    expect(getByText('Rahul Sen')).toBeInTheDocument();
    expect(getByText('Ayodhya Cantt')).toBeInTheDocument();
  });
});
