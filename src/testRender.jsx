import { render as baseRender } from '@testing-library/react';
import { AuthContext } from './lib/AuthContext';
export * from '@testing-library/react';
export const testUser = { id: 'test-user', email: 'tester@example.invalid', name: 'Tester', roles: ['admin'], permissions: ['users.list','users.update','system.view_audit_log','tts.create','voices.read','clones.create','recordings.download','script.use','batch.use','roles.manage'], limits: { max_chars_month: 200000, max_chars_request: 5000 } };
export function render(ui, options = {}) {
  return baseRender(<AuthContext.Provider value={{ status: 'authenticated', user: testUser, logout: async () => {} }}>{ui}</AuthContext.Provider>, options);
}
