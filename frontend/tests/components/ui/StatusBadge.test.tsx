import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
  it('renders status badge with correct label for Submitted', () => {
    const { getByText } = render(<StatusBadge status="Submitted" />);
    expect(getByText('Submitted')).toBeInTheDocument();
  });

  it('renders status badge with correct label for Verification In Progress', () => {
    const { getByText } = render(<StatusBadge status="Verification In Progress" />);
    expect(getByText('Verification In Progress')).toBeInTheDocument();
  });
});
