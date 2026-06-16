#!/usr/bin/env node
// Publica um plano de treino no Firestore para um usuário específico.
// Uso: node publish-plan.js --uid <uid-do-usuario>
// Requer: serviceAccountKey.json na mesma pasta, plan.json com o plano gerado.

const admin = require('firebase-admin');
const fs    = require('fs');
const path  = require('path');

const args = process.argv.slice(2);
const uidIdx = args.indexOf('--uid');
if (uidIdx === -1 || !args[uidIdx + 1]) {
  console.error('Uso: node publish-plan.js --uid <uid-do-usuario>');
  process.exit(1);
}
const uid = args[uidIdx + 1];

const keyPath  = path.join(__dirname, 'serviceAccountKey.json');
const planPath = path.join(__dirname, 'plan.json');

if (!fs.existsSync(keyPath)) {
  console.error('Arquivo serviceAccountKey.json não encontrado.');
  console.error('Gere em: Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova chave privada');
  process.exit(1);
}
if (!fs.existsSync(planPath)) {
  console.error('Arquivo plan.json não encontrado. Peça ao Claude para gerar o plano primeiro.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const plan           = JSON.parse(fs.readFileSync(planPath, 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const ref = db.collection('users').doc(uid);
  const doc = await ref.get();
  if (!doc.exists) {
    console.error('Usuário não encontrado no Firestore (uid: ' + uid + ')');
    console.error('O usuário precisa ter feito login no app ao menos uma vez.');
    process.exit(1);
  }
  await ref.update({ plan: plan, updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  console.log('✓ Plano publicado com sucesso para uid:', uid);
  console.log('  ' + plan.length + ' treino(s):', plan.map(function(d){ return d.name; }).join(', '));
  process.exit(0);
}

main().catch(function(err) {
  console.error('Erro ao publicar plano:', err.message);
  process.exit(1);
});
