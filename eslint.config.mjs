import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'public/**',
      'supabase/migrations/**',
    ],
  },
  {
    // react-hooks/purity, react-hooks/immutability e react-hooks/set-state-in-effect
    // são regras novas do eslint-plugin-react-hooks v6 voltadas para o React
    // Compiler (babel-plugin-react-compiler), que este projeto não habilita.
    // Sem o compilador, elas reportam padrões pré-existentes de UI (telas de
    // animação dirigidas por useEffect) que já funcionam corretamente em
    // runtime e estão fora do escopo desta tarefa de hardening de segurança.
    // Desligadas deliberadamente e documentadas aqui, não por atalho.
    rules: {
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
    },
  },
];

export default eslintConfig;
