#!/usr/bin/env tsx

/**
 * TCWatch Database Seed Script
 *
 * This script populates the database with sample data for development and testing.
 * It creates realistic True Crime content, cases, and user data to support
 * feature development and testing.
 */

import { PrismaClient } from '@prisma/client';
import { ContentType, TrackingStatus, ListPrivacy, FriendshipStatus, ChallengeType, ChallengeStatus, ParticipantStatus, AchievementType, CaseStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clean existing data in reverse order of dependencies
    console.log('🧹 Cleaning existing data...');
    await prisma.challengeProgress.deleteMany();
    await prisma.challengeParticipant.deleteMany();
    await prisma.challengeContent.deleteMany();
    await prisma.challenge.deleteMany();
    await prisma.userAchievement.deleteMany();
    await prisma.contentCaseLink.deleteMany();
    await prisma.syncJob.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.socialActivity.deleteMany();
    await prisma.friendship.deleteMany();
    await prisma.listItem.deleteMany();
    await prisma.customList.deleteMany();
    await prisma.episodeProgress.deleteMany();
    await prisma.userContent.deleteMany();
    await prisma.content.deleteMany();
    await prisma.contentCase.deleteMany();
    await prisma.userProfile.deleteMany();

    // Create Criminal Cases
    console.log('📂 Creating criminal cases...');
    const cases = await createCriminalCases();

    // Create Content
    console.log('🎬 Creating content...');
    const content = await createContent(cases);

    // Create Users
    console.log('👥 Creating user profiles...');
    const users = await createUsers();

    // Create User Content Tracking
    console.log('📊 Creating user content tracking...');
    await createUserContent(users, content);

    // Create Episode Progress
    console.log('📺 Creating episode progress...');
    await createEpisodeProgress(users, content);

    // Create Custom Lists
    console.log('📝 Creating custom lists...');
    const lists = await createCustomLists(users, content);

    // Create Friendships
    console.log('🤝 Creating friendships...');
    await createFriendships(users);

    // Create Social Activities
    console.log('🔄 Creating social activities...');
    await createSocialActivities(users, content, lists);

    // Create Notifications
    console.log('🔔 Creating notifications...');
    await createNotifications(users);

    // Create Challenges
    console.log('🏆 Creating challenges...');
    const challenges = await createChallenges(content);

    // Create Challenge Participants
    console.log('🏃 Creating challenge participants...');
    await createChallengeParticipants(users, challenges, content);

    // Create User Achievements
    console.log('🏅 Creating user achievements...');
    await createUserAchievements(users);

    // Create Sync Jobs
    console.log('⚙️ Creating sync jobs...');
    await createSyncJobs(content);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

async function createCriminalCases() {
  const casesData = [
    {
      caseName: "Ted Bundy Murders",
      caseSlug: "ted-bundy-murders",
      description: "A series of murders committed by Ted Bundy across multiple states in the 1970s.",
      perpetrators: ["Ted Bundy"],
      victims: ["Elizabeth Kloepfer", "Carol Ann Boone", "Multiple victims"],
      locations: ["Washington", "Oregon", "Utah", "Colorado", "Idaho", "Florida"],
      timePeriod: "1970s",
      caseStatus: CaseStatus.SOLVED,
      wikipediaUrl: "https://en.wikipedia.org/wiki/Ted_Bundy"
    },
    {
      caseName: "Zodiac Killer",
      caseSlug: "zodiac-killer",
      description: "A serial killer who operated in Northern California in the late 1960s and early 1970s.",
      perpetrators: ["Unknown"],
      victims: ["Betty Lou Jensen", "David Arthur Faraday", "Darlene Elizabeth Ferrin", "Others"],
      locations: ["San Francisco Bay Area", "California"],
      timePeriod: "1960s-1970s",
      caseStatus: CaseStatus.UNSOLVED,
      wikipediaUrl: "https://en.wikipedia.org/wiki/Zodiac_Killer"
    },
    {
      caseName: "Golden State Killer",
      caseSlug: "golden-state-killer",
      description: "A serial killer, rapist, and burglar who committed at least 13 murders, 50 rapes, and 120 burglaries across California.",
      perpetrators: ["Joseph James DeAngelo"],
      victims: ["Multiple victims"],
      locations: ["California"],
      timePeriod: "1970s-1980s",
      caseStatus: CaseStatus.SOLVED,
      wikipediaUrl: "https://en.wikipedia.org/wiki/Golden_State_Killer"
    },
    {
      caseName: "BTK Killer",
      caseSlug: "btk-killer",
      description: "Dennis Rader who murdered ten people in Sedgwick County, Kansas.",
      perpetrators: ["Dennis Rader"],
      victims: ["Joseph Otero", "Julie Otero", "Josephine Otero", "Others"],
      locations: ["Kansas"],
      timePeriod: "1970s-1990s",
      caseStatus: CaseStatus.SOLVED,
      wikipediaUrl: "https://en.wikipedia.org/wiki/Dennis_Rader"
    },
    {
      caseName: "JonBenét Ramsey Case",
      caseSlug: "jonbenet-ramsey-case",
      description: "The unsolved murder of six-year-old beauty queen JonBenét Ramsey in Boulder, Colorado.",
      perpetrators: ["Unknown"],
      victims: ["JonBenét Ramsey"],
      locations: ["Boulder, Colorado"],
      timePeriod: "1996",
      caseStatus: CaseStatus.UNSOLVED,
      wikipediaUrl: "https://en.wikipedia.org/wiki/Murder_of_JonBen%C3%A9t_Ramsey"
    }
  ];

  const cases = [];
  for (const caseData of casesData) {
    const caseRecord = await prisma.contentCase.create({ data: caseData });
    cases.push(caseRecord);
  }

  return cases;
}

async function createContent(cases: any[]) {
  const contentData = [
    // Movies
    {
      externalId: "tmdb_12345",
      title: "Extremely Wicked, Shockingly Evil and Vile",
      description: "A chronicle of the crimes of Ted Bundy from the perspective of Liz, his longtime girlfriend.",
      contentType: ContentType.MOVIE,
      genreTags: ["Drama", "Crime", "Biography"],
      caseTags: ["ted-bundy-murders"],
      releaseDate: new Date("2019-05-03"),
      runtimeMinutes: 110,
      posterUrl: "https://image.tmdb.org/t/p/w500/example1.jpg",
      trailerUrl: "https://youtube.com/watch?v=example1",
      platforms: JSON.stringify([
        { name: "Netflix", type: "streaming", availableFrom: "2019-05-03" },
        { name: "Amazon Prime", type: "streaming", availableFrom: "2019-06-01" }
      ]),
      tmdbId: 12345,
      imdbId: "tt7134006"
    },
    {
      externalId: "tmdb_67890",
      title: "Zodiac",
      description: "A cartoonist becomes an amateur detective obsessed with tracking down the Zodiac Killer.",
      contentType: ContentType.MOVIE,
      genreTags: ["Drama", "Crime", "Mystery"],
      caseTags: ["zodiac-killer"],
      releaseDate: new Date("2007-03-02"),
      runtimeMinutes: 157,
      posterUrl: "https://image.tmdb.org/t/p/w500/example2.jpg",
      trailerUrl: "https://youtube.com/watch?v=example2",
      platforms: JSON.stringify([
        { name: "Hulu", type: "streaming", availableFrom: "2020-01-01" },
        { name: "HBO Max", type: "streaming", availableFrom: "2021-03-01" }
      ]),
      tmdbId: 67890,
      imdbId: "tt0443706"
    },
    // TV Series
    {
      externalId: "tvdb_11111",
      title: "Mind Hunter",
      description: "Set in the late 1970s, two FBI agents are tasked with interviewing imprisoned serial killers to solve ongoing cases.",
      contentType: ContentType.TV_SERIES,
      genreTags: ["Drama", "Crime", "Thriller"],
      caseTags: ["btk-killer", "golden-state-killer"],
      releaseDate: new Date("2017-10-13"),
      runtimeMinutes: 60,
      posterUrl: "https://image.tmdb.org/t/p/w500/example3.jpg",
      trailerUrl: "https://youtube.com/watch?v=example3",
      platforms: JSON.stringify([
        { name: "Netflix", type: "streaming", availableFrom: "2017-10-13" }
      ]),
      tmdbId: 11111,
      imdbId: "tt5290382",
      tvdbId: 11111,
      totalSeasons: 2,
      totalEpisodes: 19,
      status: "ended"
    },
    // Documentaries
    {
      externalId: "doc_22222",
      title: "Conversations with a Killer: The Ted Bundy Tapes",
      description: "A look inside the mind of serial killer Ted Bundy, featuring interviews recorded on death row.",
      contentType: ContentType.DOCUMENTARY,
      genreTags: ["Documentary", "Crime", "Biography"],
      caseTags: ["ted-bundy-murders"],
      releaseDate: new Date("2019-01-24"),
      runtimeMinutes: 240,
      posterUrl: "https://image.tmdb.org/t/p/w500/example4.jpg",
      platforms: JSON.stringify([
        { name: "Netflix", type: "streaming", availableFrom: "2019-01-24" }
      ]),
      totalSeasons: 1,
      totalEpisodes: 4,
      status: "ended"
    },
    {
      externalId: "doc_33333",
      title: "I'll Be Gone in the Dark",
      description: "Based on Michelle McNamara's book about her investigation into the Golden State Killer.",
      contentType: ContentType.DOCUMENTARY,
      genreTags: ["Documentary", "Crime", "Investigation"],
      caseTags: ["golden-state-killer"],
      releaseDate: new Date("2020-06-28"),
      runtimeMinutes: 360,
      posterUrl: "https://image.tmdb.org/t/p/w500/example5.jpg",
      platforms: JSON.stringify([
        { name: "HBO Max", type: "streaming", availableFrom: "2020-06-28" }
      ]),
      totalSeasons: 1,
      totalEpisodes: 6,
      status: "ended"
    },
    {
      externalId: "doc_44444",
      title: "Casting JonBenet",
      description: "Fifteen years after the murder of JonBenét Ramsey, local actors in Boulder, Colorado audition for roles.",
      contentType: ContentType.DOCUMENTARY,
      genreTags: ["Documentary", "Crime", "Mystery"],
      caseTags: ["jonbenet-ramsey-case"],
      releaseDate: new Date("2017-04-28"),
      runtimeMinutes: 80,
      posterUrl: "https://image.tmdb.org/t/p/w500/example6.jpg",
      platforms: JSON.stringify([
        { name: "Netflix", type: "streaming", availableFrom: "2017-04-28" }
      ])
    }
  ];

  const content = [];
  for (const contentItem of contentData) {
    const contentRecord = await prisma.content.create({ data: contentItem });
    content.push(contentRecord);

    // Link content to cases
    for (const caseTag of contentItem.caseTags) {
      const caseRecord = cases.find(c => c.caseSlug === caseTag);
      if (caseRecord) {
        await prisma.contentCaseLink.create({
          data: {
            contentId: contentRecord.id,
            caseId: caseRecord.id
          }
        });
      }
    }
  }

  return content;
}

async function createUsers() {
  const usersData = [
    {
      userId: "11111111-1111-1111-1111-111111111111",
      displayName: "True Crime Sarah",
      avatarUrl: "https://example.com/avatars/sarah.jpg",
      interests: ["Serial Killers", "Cold Cases", "Forensic Science", "Criminal Psychology"],
      privacySettings: JSON.stringify({
        profile_visible: true,
        activity_visible: true,
        allow_friend_requests: true
      }),
      notificationSettings: JSON.stringify({
        push_enabled: true,
        email_enabled: true,
        new_content_alerts: true,
        friend_activity: true,
        weekly_digest: true,
        cable_reminders: false
      })
    },
    {
      userId: "22222222-2222-2222-2222-222222222222",
      displayName: "Detective Mike",
      avatarUrl: "https://example.com/avatars/mike.jpg",
      interests: ["Unsolved Mysteries", "Police Procedurals", "Investigative Journalism"],
      privacySettings: JSON.stringify({
        profile_visible: true,
        activity_visible: false,
        allow_friend_requests: true
      }),
      notificationSettings: JSON.stringify({
        push_enabled: true,
        email_enabled: false,
        new_content_alerts: true,
        friend_activity: false,
        weekly_digest: true,
        cable_reminders: true
      })
    },
    {
      userId: "33333333-3333-3333-3333-333333333333",
      displayName: "Crime Podcast Lisa",
      avatarUrl: "https://example.com/avatars/lisa.jpg",
      interests: ["True Crime Podcasts", "Historical Cases", "Women in Crime"],
      privacySettings: JSON.stringify({
        profile_visible: false,
        activity_visible: false,
        allow_friend_requests: false
      }),
      notificationSettings: JSON.stringify({
        push_enabled: false,
        email_enabled: true,
        new_content_alerts: false,
        friend_activity: false,
        weekly_digest: true,
        cable_reminders: false
      })
    }
  ];

  const users = [];
  for (const userData of usersData) {
    const user = await prisma.userProfile.create({ data: userData });
    users.push(user);
  }

  return users;
}

async function createUserContent(users: any[], content: any[]) {
  const userContentData = [
    // Sarah's content
    {
      userId: users[0].userId,
      contentId: content[0].id, // Ted Bundy movie
      status: TrackingStatus.COMPLETED,
      rating: 4,
      notes: "Great performance by Zac Efron, really shows Bundy's charm",
      tags: ["Must Watch", "True Crime"],
      platformWatched: "Netflix",
      dateCompleted: new Date("2024-08-15")
    },
    {
      userId: users[0].userId,
      contentId: content[2].id, // Mind Hunter
      status: TrackingStatus.WATCHING,
      rating: 5,
      notes: "Incredible series, amazing detail",
      tags: ["Binge Watch"],
      platformWatched: "Netflix",
      dateStarted: new Date("2024-09-01")
    },
    {
      userId: users[0].userId,
      contentId: content[1].id, // Zodiac
      status: TrackingStatus.WANT_TO_WATCH,
      tags: ["Weekend Watch"]
    },
    // Mike's content
    {
      userId: users[1].userId,
      contentId: content[1].id, // Zodiac
      status: TrackingStatus.COMPLETED,
      rating: 5,
      notes: "Masterful direction by Fincher",
      platformWatched: "Hulu",
      dateCompleted: new Date("2024-07-20")
    },
    {
      userId: users[1].userId,
      contentId: content[4].id, // I'll Be Gone in the Dark
      status: TrackingStatus.COMPLETED,
      rating: 4,
      notes: "Heartbreaking tribute to Michelle McNamara",
      platformWatched: "HBO Max",
      dateCompleted: new Date("2024-08-30")
    },
    // Lisa's content
    {
      userId: users[2].userId,
      contentId: content[3].id, // Ted Bundy Tapes
      status: TrackingStatus.COMPLETED,
      rating: 3,
      notes: "Interesting but disturbing",
      platformWatched: "Netflix",
      dateCompleted: new Date("2024-09-10")
    }
  ];

  for (const userContent of userContentData) {
    await prisma.userContent.create({ data: userContent });
  }
}

async function createEpisodeProgress(users: any[], content: any[]) {
  const mindHunterContent = content.find(c => c.title === "Mind Hunter");
  if (!mindHunterContent) return;

  // Sarah's Mind Hunter progress
  const episodes = [
    { season: 1, episode: 1, watched: true },
    { season: 1, episode: 2, watched: true },
    { season: 1, episode: 3, watched: true },
    { season: 1, episode: 4, watched: false },
    { season: 2, episode: 1, watched: false }
  ];

  for (const ep of episodes) {
    await prisma.episodeProgress.create({
      data: {
        userId: users[0].userId,
        contentId: mindHunterContent.id,
        seasonNumber: ep.season,
        episodeNumber: ep.episode,
        watched: ep.watched,
        watchedAt: ep.watched ? new Date("2024-09-01") : null
      }
    });
  }
}

async function createCustomLists(users: any[], content: any[]) {
  const listsData = [
    {
      userId: users[0].userId,
      title: "Best Serial Killer Movies",
      description: "My favorite films about serial killers",
      privacy: ListPrivacy.PUBLIC
    },
    {
      userId: users[0].userId,
      title: "Weekend Watchlist",
      description: "True crime content for weekend binging",
      privacy: ListPrivacy.PRIVATE
    },
    {
      userId: users[1].userId,
      title: "Recommended by Detective Friends",
      description: "Content recommended by fellow law enforcement",
      privacy: ListPrivacy.FRIENDS
    }
  ];

  const lists = [];
  for (const listData of listsData) {
    const list = await prisma.customList.create({ data: listData });
    lists.push(list);

    // Add items to lists
    if (list.title === "Best Serial Killer Movies") {
      await prisma.listItem.create({
        data: {
          listId: list.id,
          contentId: content[0].id, // Ted Bundy movie
          orderIndex: 1,
          notes: "Must watch for any true crime fan"
        }
      });
      await prisma.listItem.create({
        data: {
          listId: list.id,
          contentId: content[1].id, // Zodiac
          orderIndex: 2,
          notes: "Fincher's masterpiece"
        }
      });
    }
  }

  return lists;
}

async function createFriendships(users: any[]) {
  const friendshipsData = [
    {
      requesterId: users[0].userId,
      addresseeId: users[1].userId,
      status: FriendshipStatus.ACCEPTED
    },
    {
      requesterId: users[1].userId,
      addresseeId: users[2].userId,
      status: FriendshipStatus.PENDING
    }
  ];

  for (const friendship of friendshipsData) {
    await prisma.friendship.create({ data: friendship });
  }
}

async function createSocialActivities(users: any[], content: any[], lists: any[]) {
  const activitiesData = [
    {
      userId: users[0].userId,
      activityType: "content_completed",
      contentId: content[0].id,
      activityData: JSON.stringify({ rating: 4, platform: "Netflix" })
    },
    {
      userId: users[0].userId,
      activityType: "list_created",
      listId: lists[0].id,
      activityData: JSON.stringify({ listTitle: lists[0].title })
    },
    {
      userId: users[1].userId,
      activityType: "content_started",
      contentId: content[4].id,
      activityData: JSON.stringify({ platform: "HBO Max" })
    }
  ];

  for (const activity of activitiesData) {
    await prisma.socialActivity.create({ data: activity });
  }
}

async function createNotifications(users: any[]) {
  const notificationsData = [
    {
      userId: users[0].userId,
      type: "friend_request",
      title: "New Friend Request",
      message: "Detective Mike sent you a friend request",
      data: JSON.stringify({ fromUserId: users[1].userId })
    },
    {
      userId: users[1].userId,
      type: "new_content",
      title: "New True Crime Content",
      message: "3 new documentaries added to your watchlist",
      data: JSON.stringify({ contentCount: 3 })
    },
    {
      userId: users[0].userId,
      type: "weekly_digest",
      title: "Your Weekly True Crime Digest",
      message: "Here's what happened in true crime this week",
      data: JSON.stringify({ weekOf: "2024-09-16" }),
      read: true,
      readAt: new Date("2024-09-17")
    }
  ];

  for (const notification of notificationsData) {
    await prisma.notification.create({ data: notification });
  }
}

async function createChallenges(content: any[]) {
  const challengesData = [
    {
      title: "September Serial Killer Study",
      description: "Watch 5 pieces of content about serial killers this month",
      challengeType: ChallengeType.VIEWING_CHALLENGE,
      status: ChallengeStatus.ACTIVE,
      startDate: new Date("2024-09-01"),
      endDate: new Date("2024-09-30"),
      targetCount: 5,
      rules: JSON.stringify({
        requiredTags: ["Serial Killers"],
        minRating: 3,
        allowRewatches: false
      }),
      rewards: JSON.stringify({
        badgeName: "Serial Killer Scholar",
        description: "Completed the September Serial Killer Study challenge",
        points: 100
      })
    },
    {
      title: "Cold Case Investigation",
      description: "Research and watch content about unsolved cases",
      challengeType: ChallengeType.RESEARCH_PROJECT,
      status: ChallengeStatus.UPCOMING,
      startDate: new Date("2024-10-01"),
      endDate: new Date("2024-10-31"),
      targetCount: 3,
      rules: JSON.stringify({
        requiredStatus: ["unsolved", "cold"],
        requireNotes: true
      }),
      rewards: JSON.stringify({
        badgeName: "Cold Case Detective",
        description: "Investigated unsolved cases",
        points: 150
      })
    }
  ];

  const challenges = [];
  for (const challengeData of challengesData) {
    const challenge = await prisma.challenge.create({ data: challengeData });
    challenges.push(challenge);

    // Add content to challenges
    if (challenge.title === "September Serial Killer Study") {
      const serialKillerContent = content.filter(c =>
        c.caseTags.some((tag: string) => ["ted-bundy-murders", "btk-killer"].includes(tag))
      );

      for (let i = 0; i < Math.min(serialKillerContent.length, 3); i++) {
        await prisma.challengeContent.create({
          data: {
            challengeId: challenge.id,
            contentId: serialKillerContent[i].id,
            isRequired: i === 0, // First one is required
            points: i === 0 ? 30 : 20
          }
        });
      }
    }
  }

  return challenges;
}

async function createChallengeParticipants(users: any[], challenges: any[], content: any[]) {
  const participantsData = [
    {
      challengeId: challenges[0].id,
      userId: users[0].userId,
      status: ParticipantStatus.ACTIVE,
      completedCount: 2,
      totalPoints: 50
    },
    {
      challengeId: challenges[0].id,
      userId: users[1].userId,
      status: ParticipantStatus.JOINED,
      completedCount: 0,
      totalPoints: 0
    }
  ];

  for (const participant of participantsData) {
    const participantRecord = await prisma.challengeParticipant.create({ data: participant });

    // Add progress for active participants
    if (participant.completedCount > 0) {
      const challengeContent = await prisma.challengeContent.findMany({
        where: { challengeId: participant.challengeId },
        take: participant.completedCount
      });

      for (const cc of challengeContent) {
        await prisma.challengeProgress.create({
          data: {
            participantId: participantRecord.id,
            contentId: cc.contentId,
            completed: true,
            completedAt: new Date("2024-09-15"),
            points: cc.points || 20
          }
        });
      }
    }
  }
}

async function createUserAchievements(users: any[]) {
  const achievementsData = [
    {
      userId: users[0].userId,
      achievementType: AchievementType.CONTENT_MILESTONE,
      achievementData: JSON.stringify({
        milestone: "First 10 Completed",
        description: "Completed your first 10 pieces of true crime content",
        earnedDate: "2024-08-01"
      })
    },
    {
      userId: users[0].userId,
      achievementType: AchievementType.STREAK_ACHIEVED,
      achievementData: JSON.stringify({
        streak: "7 Day Streak",
        description: "Watched true crime content for 7 consecutive days",
        earnedDate: "2024-09-07"
      })
    },
    {
      userId: users[1].userId,
      achievementType: AchievementType.SOCIAL_MILESTONE,
      achievementData: JSON.stringify({
        milestone: "First Friend",
        description: "Made your first friend connection",
        earnedDate: "2024-08-20"
      })
    }
  ];

  for (const achievement of achievementsData) {
    await prisma.userAchievement.create({ data: achievement });
  }
}

async function createSyncJobs(content: any[]) {
  const syncJobsData = [
    {
      jobType: "content_metadata_sync",
      contentId: content[0].id,
      status: "COMPLETED" as const,
      completedAt: new Date("2024-09-17T10:00:00Z"),
      retryCount: 0
    },
    {
      jobType: "platform_availability_sync",
      contentId: content[1].id,
      status: "RUNNING" as const,
      retryCount: 1
    },
    {
      jobType: "weekly_digest_generation",
      status: "PENDING" as const,
      retryCount: 0,
      nextRetryAt: new Date("2024-09-18T08:00:00Z")
    }
  ];

  for (const syncJob of syncJobsData) {
    await prisma.syncJob.create({ data: syncJob });
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });