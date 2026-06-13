import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Onboarding from '../components/Onboarding';
import Today from '../components/Today';
import TrendsView from '../components/TrendsView';
import HelpSOS from '../components/HelpSOS';
import Layout from '../components/Layout';

const noop = () => {};

describe('Onboarding', () => {
  it('renders the welcome screen with the non-clinical disclaimer', () => {
    render(<Onboarding onComplete={noop} />);
    expect(screen.getByText('Welcome to MindEase')).toBeInTheDocument();
    expect(screen.getByText(/NOT a clinical therapy/i)).toBeInTheDocument();
  });
});

describe('Today', () => {
  it('renders the check-in form with the mood meter', () => {
    render(<Today exam="JEE" localOnly={false} onEntryLogged={noop} />);
    expect(screen.getByText('How is your day going?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anxious' })).toBeInTheDocument();
  });
});

describe('TrendsView', () => {
  it('shows an empty state when there are no entries', async () => {
    render(<TrendsView localOnly={true} refreshTrigger={0} />);
    expect(await screen.findByText('No Trends Available Yet')).toBeInTheDocument();
  });
});

describe('HelpSOS', () => {
  it('renders helplines and launches the box-breathing exercise', async () => {
    render(<HelpSOS onDataWiped={noop} />);
    expect(screen.getByText(/Tele-MANAS/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /box breathing/i }));
    expect(screen.getByText('Breathe In…')).toBeInTheDocument();
  });
});

describe('Layout', () => {
  it('keeps a one-tap SOS reachable that opens crisis resources', async () => {
    render(
      <Layout activeTab="today" setActiveTab={noop}>
        <div>content</div>
      </Layout>
    );
    await userEvent.click(screen.getByRole('button', { name: /immediate crisis support/i }));
    expect(screen.getByText('Emergency Crisis Support')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /call 14416/i })).toBeInTheDocument();
  });
});
