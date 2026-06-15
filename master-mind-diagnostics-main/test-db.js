import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env file manually
const envPath = path.resolve('.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = (match[2] || '').trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value;
  }
});

let supabaseUrl = env.SUPABASE_URL;
if (supabaseUrl) {
  if (supabaseUrl.endsWith('/rest/v1/')) {
    supabaseUrl = supabaseUrl.slice(0, -9);
  } else if (supabaseUrl.endsWith('/rest/v1')) {
    supabaseUrl = supabaseUrl.slice(0, -8);
  }
}
const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY;

console.log('Testing connection with URL:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY is missing in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  try {
    console.log('1. Testando tabela "alunos"...');
    const { data: alunosData, error: alunosError } = await supabase
      .from('alunos')
      .select('*')
      .limit(1);

    if (alunosError) {
      console.error('  ❌ Erro na tabela alunos:', alunosError.message);
    } else {
      console.log('  ✅ Tabela "alunos" acessível! Registros:', alunosData?.length ?? 0);
    }

    console.log('2. Testando tabela "dash"...');
    const { data: dashData, error: dashError } = await supabase
      .from('dash')
      .select('*')
      .limit(1);

    if (dashError) {
      console.error('  ❌ Erro na tabela dash:', dashError.message);
    } else {
      console.log('  ✅ Tabela "dash" acessível! Registros:', dashData?.length ?? 0);
    }

    console.log('3. Testando tabela "usuarios"...');
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);

    if (usuariosError) {
      console.error('  ❌ Erro na tabela usuarios:', usuariosError.message);
    } else {
      console.log('  ✅ Tabela "usuarios" acessível! Registros:', usuariosData?.length ?? 0);
    }

    console.log('\n🎉 Teste concluído!');
  } catch (err) {
    console.error('Erro de rede ou inicialização:', err);
  }
}

runTest();
