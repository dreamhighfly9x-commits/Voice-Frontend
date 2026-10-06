import { describe, it, expect } from 'vitest';
import { MATRIX_ROWS, canOpenPage, slugifyRole, toggleCell } from './permissionMatrix';

const row = (id) => MATRIX_ROWS.find((r) => r.id === id);
const canFrom = (perms) => (p) => perms.includes(p);

describe('permission matrix', () => {
  it('turns on page access when an action is granted', () => {
    const next = toggleCell(new Set(), row('projects'), 'delete', null, true);
    expect([...next].sort()).toEqual(['projects.delete', 'projects.read']);
  });
  it('removes every action when page access is revoked', () => {
    const next = toggleCell(new Set(['projects.read', 'projects.update', 'tts.create']), row('projects'), 'view', null, false);
    expect([...next]).toEqual(['tts.create']);
  });
  it('gates pages and the admin screen by permission', () => {
    expect(canOpenPage('home', canFrom([]))).toBe(true);
    expect(canOpenPage('batch', canFrom([]))).toBe(false);
    expect(canOpenPage('batch', canFrom(['batch.use']))).toBe(true);
    expect(canOpenPage('admin', canFrom(['roles.manage']))).toBe(true);
    expect(canOpenPage('admin', canFrom(['tts.create']))).toBe(false);
  });
  it('slugifies Vietnamese role names', () => {
    expect(slugifyRole('Kế toán - Đội 2')).toBe('ke_toan_doi_2');
    expect(slugifyRole('2 Biên tập')).toBe('bien_tap');
    expect(slugifyRole('!')).toBe('');
  });
});
