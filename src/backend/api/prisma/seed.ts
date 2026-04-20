import { PrismaClient, FriendRequestStatus, InterestLevel } from '@prisma/client';

const prisma = new PrismaClient();

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  // 0. Nettoyage (ordre important à cause des foreign keys)
  await prisma.user_Interest.deleteMany({});
  await prisma.friendRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.interest.deleteMany({});

  // 1. Créer 15 intérêts
  const interestNames = [
    'Sport', 'Musique', 'Cuisine', 'Cinéma', 'Lecture',
    'Voyage', 'Gaming', 'Photographie', 'Peinture', 'Danse',
    'Randonnée', 'Yoga', 'Programmation', 'Jardinage', 'Astronomie',
  ];
  const interests = await Promise.all(
    interestNames.map(name =>
      prisma.interest.create({ data: { name, parentId: null } })
    )
  );

  // 2. Créer 10 users
  const userLogins = [
    'alice', 'bob', 'carol', 'david', 'emma',
    'frank', 'grace', 'henry', 'iris', 'jack',
  ];
  const users = await Promise.all(
    userLogins.map(login =>
      prisma.user.create({
        data: {
          email:    `${login}@test.com`,
          login,
          password: 'hash',
        },
      })
    )
  );

  // 3. Assigner à chaque user entre 10 et 13 intérêts aléatoires
  const userInterests: { userId: number; interestId: number; interestLvl: InterestLevel }[] = [];
  for (const user of users) {
    const nbInterets = 10 + Math.floor(Math.random() * 4); // 10 à 13
    const chosen = pickRandom(interests, nbInterets);
    for (const interest of chosen) {
      userInterests.push({
        userId:      user.id,
        interestId:  interest.id,
        interestLvl: InterestLevel.High,
      });
    }
  }
  await prisma.user_Interest.createMany({ data: userInterests });

  // 4. Créer 2 amitiés pour tester l'exclusion (alice amie avec bob et carol)
  const [alice, bob, carol] = users;
  await prisma.friendRequest.createMany({
    data: [
      { senderId: alice.id, receiverId: bob.id,   status: FriendRequestStatus.Accepted },
      { senderId: carol.id, receiverId: alice.id, status: FriendRequestStatus.Accepted },
    ],
  });

  // 5. Log de vérification
  console.log('✅ Seed terminé');
  console.log(`   ${interests.length} intérêts créés`);
  console.log(`   ${users.length} users créés`);
  console.log(`   ${userInterests.length} associations user-intérêt créées`);
  console.log(`   2 amitiés créées : alice <-> bob, alice <-> carol\n`);

  // Affiche le détail pour chaque user (pratique pour vérifier manuellement)
  for (const user of users) {
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      include: { interests: { include: { interest: true } } },
    });
    if (!full) continue;
    const names = full.interests.map(i => i.interest.name).join(', ');
    console.log(`   ${user.login.padEnd(7)} (id ${user.id}) : ${names}`);
  }

  console.log(`\n   Test : GET /suggestions/${alice.id}  (alice)`);
  console.log(`   → bob et carol doivent être exclus (amis)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
