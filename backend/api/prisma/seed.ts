import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const sharedPassword = '123456ABCdef!';
const maxFriendsPerUser = 10;
const minBootstrapFriendsForNonSeededUsers = 3;
const maxRootPostsPerChannel = 5;
const minSeedPostAgeMs = 2 * 60 * 60 * 1000;
const maxSeedPostAgeMs = 7 * 24 * 60 * 60 * 1000;

type SeedUser = {
  firstName: string;
  lastName: string;
  email: string;
  interests: string[];
  role?: 'GUEST' | 'USER' | 'ADMIN';
};

type SeedPost = {
  channelName: string;
  authorEmail: string;
  content: string;
  comments: Array<{
    authorEmail: string;
    content: string;
  }>;
};

type SeedProject = {
  name: string;
  slug: string;
  color: string;
  description: string;
  sortOrder: number;
};

const users: SeedUser[] = [
  {
    firstName: 'Alice',
    lastName: 'Martin',
    email: 'amartin@example.com',
    interests: ['Cycling', 'Photography'],
  },
  {
    firstName: 'Ben',
    lastName: 'Durand',
    email: 'bdurand@example.com',
    interests: ['Gaming', 'Chess'],
  },
  {
    firstName: 'Clara',
    lastName: 'Moreau',
    email: 'cmoreau@example.com',
    interests: ['Photography', 'Aviation', 'Chess'],
  },
  {
    firstName: 'David',
    lastName: 'Bernard',
    email: 'dbernard@example.com',
    interests: ['Chess'],
  },
  {
    firstName: 'Emma',
    lastName: 'Robert',
    email: 'erobert@example.com',
    interests: ['Sport', 'Photography'],
  },
  {
    firstName: 'Louis',
    lastName: 'Petit',
    email: 'lpetit@example.com',
    interests: ['Aviation', 'Cycling', 'Gaming'],
  },
  {
    firstName: 'Nina',
    lastName: 'Laurent',
    email: 'nlaurent@example.com',
    interests: ['Music', 'Design'],
  },
  {
    firstName: 'Omar',
    lastName: 'Garcia',
    email: 'ogarcia@example.com',
    interests: ['Cooking', 'Hiking'],
  },
  {
    firstName: 'Sofia',
    lastName: 'Renaud',
    email: 'srenaud@example.com',
    interests: ['Robotics', 'AI'],
  },
  {
    firstName: 'Hugo',
    lastName: 'Lambert',
    email: 'hlambert@example.com',
    interests: ['Web Dev', 'Gaming'],
  },
  {
    firstName: 'Lea',
    lastName: 'Fournier',
    email: 'lfournier@example.com',
    interests: ['Cinema', 'Literature'],
  },
  {
    firstName: 'Noah',
    lastName: 'Girard',
    email: 'ngirard@example.com',
    interests: ['Climbing', 'Sport'],
  },
  {
    firstName: 'Maya',
    lastName: 'Blanc',
    email: 'mblanc@example.com',
    interests: ['Music', 'Photography'],
  },
  {
    firstName: 'Theo',
    lastName: 'Garnier',
    email: 'tgarnier@example.com',
    interests: ['Robotics', 'Web Dev', 'AI'],
  },
  {
    firstName: 'Ines',
    lastName: 'Chevalier',
    email: 'ichevalier@example.com',
    interests: ['Cooking', 'Design'],
  },
  {
    firstName: 'Gabriel',
    lastName: 'Muller',
    email: 'gmuller@example.com',
    interests: ['Hiking', 'Cycling'],
  },
  {
    firstName: 'Chloe',
    lastName: 'Perrin',
    email: 'cperrin@example.com',
    interests: ['Cinema', 'Music'],
  },
  {
    firstName: 'Adam',
    lastName: 'Faure',
    email: 'afaure@example.com',
    interests: ['AI', 'Chess'],
  },
  {
    firstName: 'Julie',
    lastName: 'Andre',
    email: 'jandre@example.com',
    interests: ['Climbing', 'Hiking', 'Sport'],
  },
  {
    firstName: 'Rayan',
    lastName: 'Mercier',
    email: 'rmercier@example.com',
    interests: ['Web Dev', 'Design'],
  },
  {
    firstName: 'Camille',
    lastName: 'Dupont',
    email: 'cdupont@example.com',
    interests: ['Literature', 'Photography'],
  },
  {
    firstName: 'Nathan',
    lastName: 'Henry',
    email: 'nhenry@example.com',
    interests: ['Gaming', 'Robotics'],
  },
  {
    firstName: 'Sarah',
    lastName: 'Roche',
    email: 'sroche@example.com',
    interests: ['Aviation', 'AI'],
  },
  {
    firstName: 'Tom',
    lastName: 'Roy',
    email: 'troy@example.com',
    interests: ['Sport', 'Cycling'],
  },
  {
    firstName: 'Eva',
    lastName: 'Colin',
    email: 'ecolin@example.com',
    interests: ['Cooking', 'Music'],
  },
  {
    firstName: 'Maxime',
    lastName: 'Renard',
    email: 'mrenard@example.com',
    interests: ['Design', 'Cinema'],
  },
  {
    firstName: 'Lina',
    lastName: 'Gauthier',
    email: 'lgauthier@example.com',
    interests: ['Hiking', 'Photography'],
  },
  {
    firstName: 'Paul',
    lastName: 'Marchand',
    email: 'pmarchand@example.com',
    interests: ['Chess', 'Web Dev'],
  },
  {
    firstName: 'Zoe',
    lastName: 'Schmitt',
    email: 'zschmitt@example.com',
    interests: ['Climbing', 'Cycling'],
  },
  {
    firstName: 'Yanis',
    lastName: 'Noel',
    email: 'ynoel@example.com',
    interests: ['Gaming', 'AI'],
  },
  {
    firstName: 'Manon',
    lastName: 'Dufour',
    email: 'mdufour@example.com',
    interests: ['Literature', 'Cinema'],
  },
  {
    firstName: 'Ethan',
    lastName: 'Caron',
    email: 'ecaron@example.com',
    interests: ['Robotics', 'Aviation'],
  },
  {
    firstName: 'Jade',
    lastName: 'Lemoine',
    email: 'jlemoine@example.com',
    interests: ['Sport', 'Cooking'],
  },
  {
    firstName: 'Leo',
    lastName: 'Aubry',
    email: 'laubry@example.com',
    interests: ['Music', 'Web Dev'],
  },
  {
    firstName: 'Ambre',
    lastName: 'Vidal',
    email: 'avidal@example.com',
    interests: ['Design', 'Photography'],
  },
  {
    firstName: 'Ilyes',
    lastName: 'Arnaud',
    email: 'iarnaud@example.com',
    interests: ['Hiking', 'Climbing'],
  },
  {
    firstName: 'Rose',
    lastName: 'Picard',
    email: 'rpicard@example.com',
    interests: ['Chess', 'Gaming'],
  },
  {
    firstName: 'Victor',
    lastName: 'Leclerc',
    email: 'vleclerc@example.com',
    interests: ['Aviation', 'Cycling'],
  },
  {
    firstName: 'Nora',
    lastName: 'Boucher',
    email: 'nboucher@example.com',
    interests: ['AI', 'Robotics'],
  },
  {
    firstName: 'Enzo',
    lastName: 'Payet',
    email: 'epayet@example.com',
    interests: ['Cinema', 'Sport'],
  },
  {
    firstName: 'Lola',
    lastName: 'Meyer',
    email: 'lmeyer@example.com',
    interests: ['Cooking', 'Literature'],
  },
  {
    firstName: 'Samy',
    lastName: 'Baron',
    email: 'sbaron@example.com',
    interests: ['Web Dev', 'AI'],
  },
];

const interests = [
  {
    name: 'Cycling',
    color: '#4E9F3D',
    description:
      'Plan rides, share routes, and talk gear for every cycling level.',
  },
  {
    name: 'Photography',
    color: '#2F80ED',
    description: 'Share shots, organize photowalks, and trade editing tips.',
  },
  {
    name: 'Gaming',
    color: '#8B5CF6',
    description:
      'Find teammates, discuss releases, and set up casual sessions.',
  },
  {
    name: 'Chess',
    color: '#F97316',
    description: 'Analyze games, share puzzles, and arrange friendly matches.',
  },
  {
    name: 'Sport',
    color: '#10B981',
    description:
      'Coordinate workouts, matches, and active meetups around campus.',
  },
  {
    name: 'Aviation',
    color: '#0EA5E9',
    description:
      'Talk aircraft, flight tracking, simulators, and aviation news.',
  },
  {
    name: 'Music',
    color: '#EC4899',
    description: 'Share playlists, jam plans, concerts, and music discoveries.',
  },
  {
    name: 'Cooking',
    color: '#F59E0B',
    description: 'Swap recipes, meal ideas, kitchen hacks, and food plans.',
  },
  {
    name: 'Robotics',
    color: '#64748B',
    description: 'Build, debug, and share robotics projects and experiments.',
  },
  {
    name: 'Design',
    color: '#E11D48',
    description: 'Discuss product design, visuals, workflows, and feedback.',
  },
  {
    name: 'Hiking',
    color: '#84CC16',
    description: 'Plan trails, share outdoor tips, and find hiking partners.',
  },
  {
    name: 'Cinema',
    color: '#6366F1',
    description:
      'Recommend films, plan screenings, and discuss what you watched.',
  },
  {
    name: 'Literature',
    color: '#A855F7',
    description: 'Share books, essays, writing, and reading recommendations.',
  },
  {
    name: 'Web Dev',
    color: '#14B8A6',
    description: 'Talk frontend, backend, tooling, bugs, and project ideas.',
  },
  {
    name: 'AI',
    color: '#06B6D4',
    description:
      'Explore AI tools, papers, projects, and practical experiments.',
  },
  {
    name: 'Climbing',
    color: '#D946EF',
    description: 'Find climbing partners, routes, gyms, and training advice.',
  },
];

const projectColors = {
  c: '#2B9E8F',
  cpp: '#7F77DD',
  infra: '#C8870A',
  network: '#667085',
  docs: '#21A67A',
  web: '#2F80ED',
};

let projectSortOrder = 0;

const projects: SeedProject[] = [
  createSeedProject('Libft', 'libft', projectColors.c, 'Your own C library -- strings, memory, lists'),
  createSeedProject('get_next_line', 'get_next_line', projectColors.c, 'Read files line by line -- buffers, static state, file descriptors'),
  createSeedProject('ft_printf', 'ft_printf', projectColors.c, 'Recreate printf -- variadic functions, formatting, conversions'),
  createSeedProject('Born2beroot', 'born2beroot', projectColors.infra, 'Virtual machine administration -- users, sudo, monitoring, security'),
  createSeedProject('push_swap', 'push_swap', projectColors.c, 'Sorting with two stacks -- algorithms, operations, complexity'),
  createSeedProject('pipex', 'pipex', projectColors.c, 'Unix pipes -- fork, execve, dup2, redirections'),
  createSeedProject('minitalk', 'minitalk', projectColors.c, 'Client/server signals -- bit encoding, SIGUSR1, SIGUSR2'),
  createSeedProject('so_long', 'so_long', projectColors.c, 'Small 2D game -- maps, sprites, input, MiniLibX'),
  createSeedProject('FdF', 'fdf', projectColors.c, 'Wireframe renderer -- projections, parsing, MiniLibX'),
  createSeedProject('fract-ol', 'fract-ol', projectColors.c, 'Fractal explorer -- complex numbers, zoom, rendering'),
  createSeedProject('Philosophers', 'philosophers', projectColors.c, 'Dining philosophers -- threads, mutexes, timing'),
  createSeedProject('minishell', 'minishell', projectColors.c, 'A small shell -- parsing, pipes, redirections, signals'),
  createSeedProject('NetPractice', 'netpractice', projectColors.network, 'Networking basics -- subnetting, routing, TCP/IP'),
  createSeedProject('cub3d', 'cub3d', projectColors.c, 'Raycasting engine -- Wolfenstein-style 3D maze'),
  createSeedProject('miniRT', 'minirt', projectColors.c, 'Raytracing engine -- primitives, lighting, cameras'),
  createSeedProject('CPP 00 - 04', 'cpp-00-04', projectColors.cpp, 'C++ fundamentals -- classes, memory, operators, inheritance, polymorphism'),
  createSeedProject('CPP 05 - 09', 'cpp-05-09', projectColors.cpp, 'Advanced C++ practice -- exceptions, casts, templates, STL'),
  createSeedProject('Inception', 'inception', projectColors.infra, 'Docker infrastructure -- WordPress, MariaDB, NGINX'),
  createSeedProject('webserv', 'webserv', projectColors.cpp, 'HTTP server in C++98 -- config, CGI, methods'),
  createSeedProject('ft_irc', 'ft_irc', projectColors.cpp, 'IRC server in C++98 -- channels, operators, authentication'),
  createSeedProject('ft_transcendence', 'ft_transcendence', projectColors.web, 'Full-stack web app -- Pong, chat, auth, user management'),
  createSeedProject('Collaborative_resume', 'collaborative_resume', projectColors.docs, 'Collaborative resume work -- feedback, structure, final polish'),
];

const samplePosts: SeedPost[] = [
  {
    channelName: 'Cycling',
    authorEmail: 'amartin@example.com',
    content:
      'Saturday route is ready: 60km along the river with a coffee stop halfway.',
    comments: [
      {
        authorEmail: 'lpetit@example.com',
        content: 'I am in. I can bring tools and a spare tube.',
      },
    ],
  },
  {
    channelName: 'Cycling',
    authorEmail: 'gmuller@example.com',
    content: 'I mapped a beginner-friendly hill session for Thursday evening.',
    comments: [],
  },
  {
    channelName: 'Photography',
    authorEmail: 'cmoreau@example.com',
    content:
      'Golden hour around campus was perfect today. Anyone up for a weekend photowalk?',
    comments: [
      {
        authorEmail: 'erobert@example.com',
        content: 'Yes, I would love to join and practice portraits.',
      },
    ],
  },
  {
    channelName: 'Photography',
    authorEmail: 'mblanc@example.com',
    content:
      'I can lend two prime lenses for the next photowalk if anyone wants to try them.',
    comments: [],
  },
  {
    channelName: 'Gaming',
    authorEmail: 'bdurand@example.com',
    content:
      'Looking for two teammates for a relaxed tournament night this Friday.',
    comments: [],
  },
  {
    channelName: 'Gaming',
    authorEmail: 'nhenry@example.com',
    content: 'Retro co-op night is open. Bring controllers if you have spares.',
    comments: [],
  },
  {
    channelName: 'Chess',
    authorEmail: 'dbernard@example.com',
    content:
      'I booked a table for blitz games after lunch. All levels welcome.',
    comments: [],
  },
  {
    channelName: 'Chess',
    authorEmail: 'rpicard@example.com',
    content: 'I will run through two endgame positions before the blitz games.',
    comments: [],
  },
  {
    channelName: 'Sport',
    authorEmail: 'erobert@example.com',
    content:
      'Running group starts at 18:30 near the entrance. Easy pace today.',
    comments: [],
  },
  {
    channelName: 'Sport',
    authorEmail: 'troy@example.com',
    content: 'Anyone up for a recovery stretching session after the run?',
    comments: [],
  },
  {
    channelName: 'Aviation',
    authorEmail: 'lpetit@example.com',
    content:
      'There is a great documentary about flight control systems tonight in the media room.',
    comments: [],
  },
  {
    channelName: 'Aviation',
    authorEmail: 'sroche@example.com',
    content:
      'I found a clear simulator checklist for basic radio navigation practice.',
    comments: [],
  },
  {
    channelName: 'Music',
    authorEmail: 'nlaurent@example.com',
    content:
      'Open jam in the lounge tonight. Acoustic sets first, synths later.',
    comments: [],
  },
  {
    channelName: 'Music',
    authorEmail: 'laubry@example.com',
    content:
      'I can record the jam and share stems for anyone who wants to mix.',
    comments: [],
  },
  {
    channelName: 'Cooking',
    authorEmail: 'ogarcia@example.com',
    content:
      'Batch cooking session this Sunday: cheap meals for the whole week.',
    comments: [],
  },
  {
    channelName: 'Cooking',
    authorEmail: 'jlemoine@example.com',
    content:
      'I am bringing a vegetarian chili recipe that scales well for groups.',
    comments: [],
  },
  {
    channelName: 'Robotics',
    authorEmail: 'srenaud@example.com',
    content:
      'The line-following robot finally handles sharp turns. Demo after lunch.',
    comments: [],
  },
  {
    channelName: 'Robotics',
    authorEmail: 'ecaron@example.com',
    content: 'I printed extra sensor mounts if another team needs them.',
    comments: [],
  },
  {
    channelName: 'Design',
    authorEmail: 'rmercier@example.com',
    content: 'Quick critique session for portfolio layouts tomorrow morning.',
    comments: [],
  },
  {
    channelName: 'Design',
    authorEmail: 'avidal@example.com',
    content:
      'I collected a few dashboard references for the design channel board.',
    comments: [],
  },
  {
    channelName: 'Hiking',
    authorEmail: 'lgauthier@example.com',
    content: 'Weather looks good for a short forest hike on Saturday.',
    comments: [],
  },
  {
    channelName: 'Hiking',
    authorEmail: 'iarnaud@example.com',
    content: 'I added a gear checklist for the weekend route.',
    comments: [],
  },
  {
    channelName: 'Cinema',
    authorEmail: 'lfournier@example.com',
    content: 'Screening a short film selection in the common room at 20:00.',
    comments: [],
  },
  {
    channelName: 'Cinema',
    authorEmail: 'mrenard@example.com',
    content:
      'I can lead a quick discussion after the screening for anyone interested.',
    comments: [],
  },
  {
    channelName: 'Literature',
    authorEmail: 'cdupont@example.com',
    content:
      'Book swap box is now near the coffee machine. Add your name inside covers.',
    comments: [],
  },
  {
    channelName: 'Literature',
    authorEmail: 'lmeyer@example.com',
    content: 'I am starting a short story reading group next week.',
    comments: [],
  },
  {
    channelName: 'Web Dev',
    authorEmail: 'hlambert@example.com',
    content:
      'Pair debugging session for frontend routing issues this afternoon.',
    comments: [],
  },
  {
    channelName: 'Web Dev',
    authorEmail: 'sbaron@example.com',
    content:
      'I wrote a small checklist for reviewing API calls in React pages.',
    comments: [],
  },
  {
    channelName: 'AI',
    authorEmail: 'tgarnier@example.com',
    content: 'I am comparing small local models for code search experiments.',
    comments: [],
  },
  {
    channelName: 'AI',
    authorEmail: 'nboucher@example.com',
    content: 'Prompt evaluation meetup tomorrow: bring one workflow to test.',
    comments: [],
  },
  {
    channelName: 'Climbing',
    authorEmail: 'jandre@example.com',
    content: 'Bouldering group leaves at 18:00. Beginners welcome.',
    comments: [],
  },
  {
    channelName: 'Climbing',
    authorEmail: 'zschmitt@example.com',
    content: 'I reserved two extra rental shoes for first-timers.',
    comments: [],
  },
];

const seedUsersWithoutFriends = new Set([
  'ngirard@example.com',
  'zschmitt@example.com',
]);
const seededFriendships = buildSeededFriendships();

// Seeds the development database with login-ready users, interests, and channels.
async function main() {
  validateSeedData();
  const passwordHash = await hashPassword(sharedPassword);

  for (const seedUser of users) {
    await upsertUser(seedUser, passwordHash);
  }

  for (const seedInterest of interests) {
    await upsertInterestWithChannel(seedInterest);
  }

  for (const seedProject of projects) {
    await upsertProject(seedProject);
  }

  for (const seedUser of users) {
    await seedJoinedInterests(seedUser);
  }

  await seedFriendships();
  await seedPrivateChatsForAcceptedFriendships();
  await seedChannelPosts();
}

// Creates or updates one better-auth email/password user and its profile.
async function upsertUser(
  seedUser: (typeof users)[number],
  passwordHash: string,
) {
  const existingUser = await prisma.user.findUnique({
    where: { email: seedUser.email },
  });

  const userId = existingUser?.id ?? randomUUID();
  const fullName = `${seedUser.firstName} ${seedUser.lastName}`;
  const login = `${seedUser.firstName[0]}${seedUser.lastName}`.toLowerCase();

  const role = seedUser.role ?? 'USER';

  const user = await prisma.user.upsert({
    where: { email: seedUser.email },
    create: {
      id: userId,
      email: seedUser.email,
      login,
      name: fullName,
      emailVerified: true,
      role,
      profile: {
        create: {
          firstname: seedUser.firstName,
          lastname: seedUser.lastName,
          pseudo: login,
          level: 0,
        },
      },
    },
    update: {
      login,
      name: fullName,
      emailVerified: true,
      role,
      profile: {
        upsert: {
          create: {
            firstname: seedUser.firstName,
            lastname: seedUser.lastName,
            pseudo: login,
            level: 0,
          },
          update: {
            firstname: seedUser.firstName,
            lastname: seedUser.lastName,
            pseudo: login,
          },
        },
      },
    },
  });

  await prisma.account.upsert({
    where: { id: `credential-${user.id}` },
    create: {
      id: `credential-${user.id}`,
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
    },
    update: {
      accountId: user.id,
      providerId: 'credential',
      password: passwordHash,
    },
  });
}

// Creates or updates one interest and guarantees its matching channel exists.
async function upsertInterestWithChannel(
  seedInterest: (typeof interests)[number],
) {
  const interest = await prisma.interest.upsert({
    where: { name: seedInterest.name },
    create: {
      name: seedInterest.name,
      color: seedInterest.color,
      parentId: null,
    },
    update: {
      color: seedInterest.color,
      parentId: null,
    },
  });

  await prisma.channel.upsert({
    where: { interestId: interest.id },
    create: {
      interestId: interest.id,
      description: seedInterest.description,
    },
    update: {
      description: seedInterest.description,
    },
  });
}

async function upsertProject(seedProject: SeedProject) {
  await prisma.project.upsert({
    where: { slug: seedProject.slug },
    create: seedProject,
    update: {
      name: seedProject.name,
      color: seedProject.color,
      description: seedProject.description,
      sortOrder: seedProject.sortOrder,
    },
  });
}

// Joins a seeded user to 1-3 interests and their matching channels.
async function seedJoinedInterests(seedUser: (typeof users)[number]) {
  const user = await prisma.user.findUnique({
    where: { email: seedUser.email },
  });

  if (!user) return;

  for (const interestName of seedUser.interests) {
    const interest = await prisma.interest.findUnique({
      where: { name: interestName },
      include: { channel: true },
    });

    if (!interest) continue;

    await prisma.user_Interest.upsert({
      where: {
        userId_interestId: {
          userId: user.id,
          interestId: interest.id,
        },
      },
      create: {
        userId: user.id,
        interestId: interest.id,
      },
      update: {},
    });

    if (!interest.channel) continue;

    await prisma.user_Channel.upsert({
      where: {
        userId_channelId: {
          userId: user.id,
          channelId: interest.channel.id,
        },
      },
      create: {
        userId: user.id,
        channelId: interest.channel.id,
        isFavorite: false,
      },
      update: {},
    });
  }
}

// Creates accepted friendships only between users who share at least one interest.
async function seedFriendships() {
  const seededUsers = await prisma.user.findMany({
    where: {
      email: {
        in: users.map((user) => user.email),
      },
    },
    select: {
      id: true,
    },
  });
  const seededUserIds = seededUsers.map((user) => user.id);

  await prisma.friendRequest.deleteMany({
    where: {
      AND: [
        { senderId: { in: seededUserIds } },
        { receiverId: { in: seededUserIds } },
      ],
    },
  });

  for (const [senderEmail, receiverEmail] of seededFriendships) {
    const sender = await prisma.user.findUnique({
      where: { email: senderEmail },
    });
    const receiver = await prisma.user.findUnique({
      where: { email: receiverEmail },
    });

    if (!sender || !receiver) continue;
    const pairKey = friendPairKey(sender.id, receiver.id);

    await prisma.friendRequest.upsert({
      where: {
        pairKey,
      },
      create: {
        senderId: sender.id,
        receiverId: receiver.id,
        pairKey,
        status: 'Accepted',
      },
      update: {
        status: 'Accepted',
      },
    });
  }

  await seedBootstrapFriendshipsForNonSeededUsers(seededUserIds);
}

async function seedBootstrapFriendshipsForNonSeededUsers(
  seededUserIds: string[],
) {
  const nonSeededUsers = await prisma.user.findMany({
    where: {
      id: {
        notIn: seededUserIds,
      },
    },
    include: {
      interests: true,
    },
  });

  if (nonSeededUsers.length === 0) return;

  const seededCandidateUsers = await prisma.user.findMany({
    where: {
      id: {
        in: seededUserIds,
      },
    },
    include: {
      interests: true,
    },
  });

  for (const user of nonSeededUsers) {
    const existingFriendIds = new Set(await getAcceptedFriendIds(user.id));
    const missingFriendsCount =
      minBootstrapFriendsForNonSeededUsers - existingFriendIds.size;

    if (missingFriendsCount <= 0) continue;

    const candidates = seededCandidateUsers
      .filter((candidate) => candidate.id !== user.id)
      .filter((candidate) => !existingFriendIds.has(candidate.id))
      .sort((first, second) => {
        const sharedDifference =
          countSharedInterestIds(user.interests, second.interests) -
          countSharedInterestIds(user.interests, first.interests);

        if (sharedDifference !== 0) return sharedDifference;

        return userDisplayName(first).localeCompare(userDisplayName(second));
      })
      .slice(0, missingFriendsCount);

    for (const candidate of candidates) {
      const pairKey = friendPairKey(user.id, candidate.id);

      await prisma.friendRequest.upsert({
        where: {
          pairKey,
        },
        create: {
          senderId: user.id,
          receiverId: candidate.id,
          pairKey,
          status: 'Accepted',
        },
        update: {
          status: 'Accepted',
        },
      });
    }
  }
}

async function seedPrivateChatsForAcceptedFriendships() {
  const acceptedFriendships = await prisma.friendRequest.findMany({
    where: {
      status: 'Accepted',
    },
    select: {
      senderId: true,
      receiverId: true,
    },
  });

  for (const friendship of acceptedFriendships) {
    await prisma.chat.upsert({
      where: {
        privateKey: friendPairKey(friendship.senderId, friendship.receiverId),
      },
      create: {
        name: 'Private chat',
        type: 'Private',
        privateKey: friendPairKey(friendship.senderId, friendship.receiverId),
        users: {
          connect: [{ id: friendship.senderId }, { id: friendship.receiverId }],
        },
      },
      update: {
        name: 'Private chat',
        type: 'Private',
        users: {
          connect: [{ id: friendship.senderId }, { id: friendship.receiverId }],
        },
      },
    });
  }
}

function buildSeededFriendships() {
  const friendships: Array<[string, string]> = [];
  const friendCounts = new Map(users.map((user) => [user.email, 0]));
  const userIndexes = new Map(users.map((user, index) => [user.email, index]));
  const friendshipKeys = new Set<string>();

  for (let index = 0; index < users.length; index += 1) {
    const user = users[index];
    const targetCount = desiredSeedFriendCount(user, index);

    while ((friendCounts.get(user.email) ?? 0) < targetCount) {
      const candidate = users
        .filter((other) => other.email !== user.email)
        .filter((other) => {
          const otherIndex = userIndexes.get(other.email) ?? 0;
          const otherTargetCount = desiredSeedFriendCount(other, otherIndex);

          return (
            otherTargetCount > 0 &&
            (friendCounts.get(other.email) ?? 0) < otherTargetCount
          );
        })
        .filter((other) => sharedInterestCount(user, other) > 0)
        .filter(
          (other) => !friendshipKeys.has(emailPairKey(user.email, other.email)),
        )
        .sort((first, second) => {
          const sharedDifference =
            sharedInterestCount(second, user) -
            sharedInterestCount(first, user);
          if (sharedDifference !== 0) return sharedDifference;

          const firstCount = friendCounts.get(first.email) ?? 0;
          const secondCount = friendCounts.get(second.email) ?? 0;
          if (firstCount !== secondCount) return firstCount - secondCount;

          return first.email.localeCompare(second.email);
        })[0];

      if (!candidate) break;

      const key = emailPairKey(user.email, candidate.email);
      friendshipKeys.add(key);
      friendships.push([user.email, candidate.email]);
      friendCounts.set(user.email, (friendCounts.get(user.email) ?? 0) + 1);
      friendCounts.set(
        candidate.email,
        (friendCounts.get(candidate.email) ?? 0) + 1,
      );
    }
  }

  return friendships;
}

function desiredSeedFriendCount(user: SeedUser, index: number) {
  if (seedUsersWithoutFriends.has(user.email)) return 0;
  return 1 + ((index * 7) % maxFriendsPerUser);
}

function sharedInterestCount(firstUser: SeedUser, secondUser: SeedUser) {
  return firstUser.interests.filter((interest) =>
    secondUser.interests.includes(interest),
  ).length;
}

function countSharedInterestIds(
  firstInterests: Array<{ interestId: number }>,
  secondInterests: Array<{ interestId: number }>,
) {
  const secondInterestIds = new Set(
    secondInterests.map((interest) => interest.interestId),
  );

  return firstInterests.filter((interest) =>
    secondInterestIds.has(interest.interestId),
  ).length;
}

function emailPairKey(firstEmail: string, secondEmail: string) {
  return [firstEmail, secondEmail].sort().join(':');
}

function validateSeedData() {
  if (users.length !== 42) {
    throw new Error(
      `Seed must contain exactly 42 users, found ${users.length}`,
    );
  }

  if (interests.length !== 16) {
    throw new Error(
      `Seed must contain exactly 16 interests, found ${interests.length}`,
    );
  }

  if (projects.length !== 22) {
    throw new Error(
      `Seed must contain exactly 22 projects, found ${projects.length}`,
    );
  }

  validateSeededUsers();
  validateSeededProjects();
  validateSeededPosts();
  validateSeededFriendships();
}

function validateSeededUsers() {
  const emails = new Set<string>();
  const logins = new Set<string>();
  const interestNames = new Set(interests.map((interest) => interest.name));

  for (const user of users) {
    if (emails.has(user.email)) {
      throw new Error(`Duplicate seeded user email: ${user.email}`);
    }

    const login = `${user.firstName[0]}${user.lastName}`.toLowerCase();
    if (logins.has(login)) {
      throw new Error(`Duplicate seeded user login: ${login}`);
    }

    if (user.interests.length === 0 || user.interests.length > 3) {
      throw new Error(`Seeded user must have 1-3 interests: ${user.email}`);
    }

    for (const interest of user.interests) {
      if (!interestNames.has(interest)) {
        throw new Error(
          `Unknown interest "${interest}" for seeded user ${user.email}`,
        );
      }
    }

    emails.add(user.email);
    logins.add(login);
  }
}

function validateSeededPosts() {
  const rootPostCounts = new Map<string, number>();
  const interestNames = new Set(interests.map((interest) => interest.name));

  for (const samplePost of samplePosts) {
    if (!interestNames.has(samplePost.channelName)) {
      throw new Error(
        `Seeded post references an unknown channel: ${samplePost.channelName}`,
      );
    }

    assertUserCanPostInChannel(samplePost.authorEmail, samplePost.channelName);

    rootPostCounts.set(
      samplePost.channelName,
      (rootPostCounts.get(samplePost.channelName) ?? 0) + 1,
    );

    for (const comment of samplePost.comments) {
      assertUserCanPostInChannel(comment.authorEmail, samplePost.channelName);
    }
  }

  for (const [channelName, count] of rootPostCounts) {
    if (count > maxRootPostsPerChannel) {
      throw new Error(
        `Seeded channel has more than 5 root posts: ${channelName}`,
      );
    }
  }
}

function validateSeededProjects() {
  const names = new Set<string>();
  const slugs = new Set<string>();
  const sortOrders = new Set<number>();

  for (const project of projects) {
    if (names.has(project.name)) {
      throw new Error(`Duplicate seeded project name: ${project.name}`);
    }

    if (slugs.has(project.slug)) {
      throw new Error(`Duplicate seeded project slug: ${project.slug}`);
    }

    if (sortOrders.has(project.sortOrder)) {
      throw new Error(`Duplicate seeded project order: ${project.sortOrder}`);
    }

    names.add(project.name);
    slugs.add(project.slug);
    sortOrders.add(project.sortOrder);
  }
}

function assertUserCanPostInChannel(email: string, channelName: string) {
  const user = users.find((seedUser) => seedUser.email === email);

  if (!user) {
    throw new Error(`Seeded post references an unknown author: ${email}`);
  }

  if (!user.interests.includes(channelName)) {
    throw new Error(
      `Seeded author ${email} is not interested in ${channelName}`,
    );
  }
}

function validateSeededFriendships() {
  const friendCounts = new Map(users.map((user) => [user.email, 0]));

  for (const [firstEmail, secondEmail] of seededFriendships) {
    const firstUser = users.find((user) => user.email === firstEmail);
    const secondUser = users.find((user) => user.email === secondEmail);

    if (!firstUser || !secondUser) {
      throw new Error(
        `Seeded friendship references an unknown user: ${firstEmail}, ${secondEmail}`,
      );
    }

    if (sharedInterestCount(firstUser, secondUser) === 0) {
      throw new Error(
        `Seeded friendship has no shared interest: ${firstEmail}, ${secondEmail}`,
      );
    }

    friendCounts.set(firstEmail, (friendCounts.get(firstEmail) ?? 0) + 1);
    friendCounts.set(secondEmail, (friendCounts.get(secondEmail) ?? 0) + 1);
  }

  for (const [email, count] of friendCounts) {
    if (count > maxFriendsPerUser) {
      throw new Error(
        `Seeded user has more than ${maxFriendsPerUser} friends: ${email}`,
      );
    }
  }
}

function friendPairKey(firstUserId: string, secondUserId: string) {
  return [firstUserId, secondUserId].sort().join(':');
}

async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendRequests = await prisma.friendRequest.findMany({
    where: {
      status: 'Accepted',
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: {
      senderId: true,
      receiverId: true,
    },
  });

  return friendRequests.map((request) =>
    request.senderId === userId ? request.receiverId : request.senderId,
  );
}

function userDisplayName(user: {
  login: string | null;
  name: string | null;
  email: string;
}) {
  return user.login ?? user.name ?? user.email.split('@')[0];
}

// Creates sample persisted posts and comments for the seeded interest channels.
async function seedChannelPosts() {
  for (const samplePost of samplePosts) {
    const rootPostCreatedAt = randomSeedPostDate();
    const channel = await prisma.channel.findFirst({
      where: {
        interest: {
          name: samplePost.channelName,
        },
      },
    });
    const author = await prisma.user.findUnique({
      where: { email: samplePost.authorEmail },
    });

    if (!channel || !author) continue;

    const post = await findOrCreatePost({
      authorId: author.id,
      channelId: channel.id,
      content: samplePost.content,
      parentId: null,
      createdAt: rootPostCreatedAt,
    });

    for (const sampleComment of samplePost.comments) {
      const commentAuthor = await prisma.user.findUnique({
        where: { email: sampleComment.authorEmail },
      });

      if (!commentAuthor) continue;

      await findOrCreatePost({
        authorId: commentAuthor.id,
        channelId: channel.id,
        content: sampleComment.content,
        parentId: post.id,
        createdAt: randomSeedPostDate(rootPostCreatedAt),
      });
    }
  }
}

// Reuses an existing seeded post when the same author already posted the same text.
async function findOrCreatePost(post: {
  authorId: string;
  channelId: number;
  content: string;
  parentId: number | null;
  createdAt: Date;
}) {
  const existingPost = await prisma.post.findFirst({
    where: {
      authorId: post.authorId,
      channelId: post.channelId,
      content: post.content,
      parentId: post.parentId,
    },
  });

  if (existingPost) {
    return prisma.post.update({
      where: { id: existingPost.id },
      data: { createdAt: post.createdAt },
    });
  }

  return prisma.post.create({
    data: post,
  });
}

function randomSeedPostDate(after?: Date): Date {
  const latest = Date.now() - minSeedPostAgeMs;
  const earliest = after
    ? Math.min(after.getTime() + 10 * 60 * 1000, latest)
    : Date.now() - maxSeedPostAgeMs;
  const timestamp = earliest + Math.random() * (latest - earliest);

  return new Date(timestamp);
}

function createSeedProject(
  name: string,
  slug: string,
  color: string,
  description: string,
): SeedProject {
  return {
    name,
    slug,
    color,
    description,
    sortOrder: projectSortOrder++,
  };
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
