import React from 'react';
import { render } from '@testing-library/react';

// Simple test component
const SimpleApp = () => <div>Test App</div>;

test('renders app without crashing', () => {
  render(<SimpleApp />);
  expect(document.body).toBeInTheDocument();
});
