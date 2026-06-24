import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const read = (p: string) => readFileSync(path.join(root, p), 'utf-8');

describe('superfícies ativas não usam o posicionamento "Segundo Cérebro"', () => {
  it('layout.tsx (title/meta) não contém "Segundo Cérebro"', () => {
    expect(read('app/layout.tsx')).not.toMatch(/Segundo Cérebro/i);
  });

  it('Home.tsx não contém "Segundo Cérebro"', () => {
    expect(read('components/screens/Home.tsx')).not.toMatch(/Segundo Cérebro/i);
  });

  it('cliniq-v9.html (estático, servível em /public) não contém "Segundo Cérebro"', () => {
    expect(read('public/cliniq-v9.html')).not.toMatch(/Segundo Cérebro/i);
  });
});

describe('relatório do médico não exibe dados fictícios nem economia unitária', () => {
  it('CaseIntelligenceReport.tsx não contém constantes EXAMPLE_* fictícias', () => {
    expect(read('components/screens/CaseIntelligenceReport.tsx')).not.toMatch(/EXAMPLE_/);
  });

  it('CaseIntelligenceReport.tsx não contém a aba de Margem (economia unitária)', () => {
    const src = read('components/screens/CaseIntelligenceReport.tsx');
    expect(src).not.toMatch(/Margem/);
    expect(src).not.toMatch(/Wallet/);
  });

  it('app/page.tsx não contém casos de demonstração fictícios (DEMO_CASES)', () => {
    expect(read('app/page.tsx')).not.toMatch(/DEMO_CASES/);
  });
});

describe('CompleteCase.tsx não simula upload de exames', () => {
  it('não contém lógica de upload falso (handleFileUpload)', () => {
    const src = read('components/screens/CompleteCase.tsx');
    expect(src).not.toMatch(/handleFileUpload/);
    expect(src).toMatch(/Anexos clínicos estarão disponíveis em uma próxima etapa/);
  });
});
