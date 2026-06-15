import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import enCommon from '../../src/locales/en/common.json';
import hiCommon from '../../src/locales/hi/common.json';
import hinglishCommon from '../../src/locales/hinglish/common.json';
import ApplicantReviewCard from '../../src/components/review/ApplicantReviewCard';

// Simple mock for useTranslation hook
jest.mock('../../src/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'prp.applicant') return 'Applicant';
      if (key === 'prp.profile_source') return 'Profile Source';
      return key;
    }
  })
}));

describe('PRP Localization keys verification', () => {
  it('has all required PRP keys in all language packs', () => {
    const prpKeys = [
      'title',
      'use_verified_profile',
      'apply_for_someone_else',
      'profile_source',
      'verified_profile',
      'manual_entry',
      'applicant',
      'subject'
    ];

    prpKeys.forEach((key) => {
      expect((enCommon.prp as any)[key]).toBeDefined();
      expect((hiCommon.prp as any)[key]).toBeDefined();
      expect((hinglishCommon.prp as any)[key]).toBeDefined();
    });
  });

  it('renders localized labels in review card component', () => {
    const { getByText } = render(
      <ApplicantReviewCard
        name="Vikram Sen"
        mobile="9876543210"
        location="Lucknow"
        address="Noida"
        profileSource="VERIFIED_PROFILE"
      />
    );

    // Verify localized title is displayed
    expect(getByText('Applicant')).toBeInTheDocument();
    expect(getByText('Profile Source')).toBeInTheDocument();
  });
});
