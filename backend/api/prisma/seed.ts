import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'better-auth/crypto';
import { randomUUID } from 'node:crypto';

const prisma = new PrismaClient();
const sharedPassword = '123456ABCdef!';

const users = [
  { firstName: 'Alice', lastName: 'Martin', email: 'alice.martin@example.com' },
  { firstName: 'Ben', lastName: 'Durand', email: 'ben.durand@example.com' },
  { firstName: 'Clara', lastName: 'Moreau', email: 'clara.moreau@example.com' },
  { firstName: 'David', lastName: 'Bernard', email: 'david.bernard@example.com' },
  { firstName: 'Emma', lastName: 'Robert', email: 'emma.robert@example.com' },
  { firstName: 'Louis', lastName: 'Petit', email: 'louis.petit@example.com' },
];

const interests = [
  { name: 'Cycling', color: '#4E9F3D' },
  { name: 'Photography', color: '#2F80ED' },
  { name: 'Gaming', color: '#8B5CF6' },
  { name: 'Chess', color: '#F97316' },
  { name: 'Sport', color: '#10B981' },
  { name: 'Aviation', color: '#0EA5E9' },
];

const samplePosts = [
  {
    channelName: 'Cycling',
    authorEmail: 'alice.martin@example.com',
    content: 'Saturday route is ready: 60km along the river with a coffee stop halfway.',
    comments: [
      {
        authorEmail: 'louis.petit@example.com',
        content: 'I am in. I can bring tools and a spare tube.',
      },
    ],
  },
  {
    channelName: 'Photography',
    authorEmail: 'clara.moreau@example.com',
    content: 'Golden hour around campus was perfect today. Anyone up for a weekend photowalk?',
    comments: [
      {
        authorEmail: 'emma.robert@example.com',
        content: 'Yes, I would love to join and practice portraits.',
      },
    ],
  },
  {
    channelName: 'Gaming',
    authorEmail: 'ben.durand@example.com',
    content: 'Looking for two teammates for a relaxed tournament night this Friday.',
    comments: [],
  },
  {
    channelName: 'Chess',
    authorEmail: 'david.bernard@example.com',
    content: 'I booked a table for blitz games after lunch. All levels welcome.',
    comments: [],
  },
  {
    channelName: 'Sport',
    authorEmail: 'emma.robert@example.com',
    content: 'Running group starts at 18:30 near the entrance. Easy pace today.',
    comments: [],
  },
  {
    channelName: 'Aviation',
    authorEmail: 'louis.petit@example.com',
    content: 'There is a great documentary about flight control systems tonight in the media room.',
    comments: [],
  },
];

// Seeds the development database with login-ready users, interests, and channels.
async function main() {
  const passwordHash = await hashPassword(sharedPassword);

  for (const seedUser of users) {
    await upsertUser(seedUser, passwordHash);
  }

  for (const seedInterest of interests) {
    await upsertInterestWithChannel(seedInterest);
  }

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

  const user = await prisma.user.upsert({
    where: { email: seedUser.email },
    create: {
      id: userId,
      email: seedUser.email,
      login,
      name: fullName,
      emailVerified: true,
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
    },
    update: {},
  });
}

// Creates sample persisted posts and comments for the seeded interest channels.
async function seedChannelPosts() {
  for (const samplePost of samplePosts) {
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
}) {
  const existingPost = await prisma.post.findFirst({
    where: post,
  });

  if (existingPost) return existingPost;

  return prisma.post.create({
    data: post,
  });
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
