// Publica um plano de treino no Firestore para um usuário específico.
// Uso: node publish-plan.js --uid <uid-do-usuario>
// Requer: serviceAccountKey.json na mesma pasta (Firebase Console > Configurações > Contas de serviço)
//         plan.json na mesma pasta (gerado pelo Claude Code)

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
  console.error('Gere em: Firebase Console > Configurações do projeto > Contas de serviço > Gerar nova chave privada');
  process.exit(1);
}
if (!fs.existsSync(planPath)) {
  console.error('Arquivo plan.json não encontrado.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const plan           = JSON.parse(fs.readFileSync(planPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.collection('users').doc(uid).set({ plan: plan }, { merge: true })
  .then(function () {
    console.log('✅ Plano publicado com sucesso para uid:', uid);
    console.log('   Treinos:', plan.map(function(d){ return d.name; }).join(', '));
    process.exit(0);
  })
  .catch(function (err) {
    console.error('❌ Erro ao publicar plano:', err.message);
    process.exit(1);
  });
