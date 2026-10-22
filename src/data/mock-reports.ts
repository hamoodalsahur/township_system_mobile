
export type DemoReport = {
  id: string;
  category: string;
  description: string;
  impact: string;
  reviewState: 'unverified' | 'corroborated';
  location: string;
};

export const MOCK_REPORTS: DemoReport[] = [
  {
    id: 'DEMO-001',
    category: 'Flooding',
    description: 'Fictional surface water near an example junction.',
    impact: 'Caution',
    reviewState: 'unverified',
    location: 'Bandar Bukit Raja',
  },
  {
    id: 'DEMO-002',
    category: 'Fallen Tree',
    description: 'Fictional fallen branches near a roadside.',
    impact: 'Partial obstruction',
    reviewState: 'corroborated',
    location: 'Bandar Bukit Raja',
  },
  {
    id: 'DEMO-003',
    category: 'Pothole',
    description: 'Fictional road surface damage for demonstration.',
    impact: 'Caution',
    reviewState: 'unverified',
    location: 'Bandar Bukit Raja',
  },
];
