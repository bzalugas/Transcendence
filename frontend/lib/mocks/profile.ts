import type { AvailableInterest, ProfileInterest, ProfileSocial } from "@/lib/types";

export const allAvailableInterests: AvailableInterest[] = [
  { name: "Photography", color: "#378ADD", desc: "Share your best shots, discuss techniques, gear reviews and editing tips. From phone pics to full-frame setups.", members: 89 },
  { name: "Cycling", color: "#5a9e3a", desc: "Road cycling, gravel, fixie or commuting. Organize rides around campus and share routes.", members: 34 },
  { name: "Gaming", color: "#7F77DD", desc: "Competitive and casual gaming. LAN parties, tournaments, game recommendations and team-ups.", members: 156 },
  { name: "Chess", color: "#D85A30", desc: "Puzzles, blitz matches and analysis. Weekly online tournaments between students.", members: 42 },
  { name: "Music", color: "#1D9E75", desc: "Share what you listen to, discover new artists, discuss albums and organize jam sessions.", members: 71 },
  { name: "Cyber", color: "#E84545", desc: "CTFs, security research, pentesting write-ups and defensive techniques. All skill levels welcome.", members: 63 },
  { name: "AI", color: "#7C6AF5", desc: "Machine learning, LLMs, research papers and hands-on projects. From theory to deployment.", members: 97 },
  { name: "Cats", color: "#c8870a", desc: "Cat pictures, cat videos, cat memes. The essentials.", members: 1 },
  { name: "Cooking", color: "#D85A30", desc: "Recipes, meal prep ideas and cooking challenges. Budget-friendly student meals and beyond.", members: 28 },
  { name: "Drawing", color: "#378ADD", desc: "Digital art, sketching, illustration. Share your work and get feedback from the community.", members: 19 },
  { name: "Fitness", color: "#5a9e3a", desc: "Workout routines, gym tips, calisthenics and nutrition. Stay active between coding sessions.", members: 45 },
  { name: "Movies", color: "#7F77DD", desc: "Reviews, recommendations and watch parties. From blockbusters to indie films.", members: 52 },
  { name: "Reading", color: "#1D9E75", desc: "Book club, reading lists and discussions. Technical books, sci-fi, manga and everything else.", members: 23 },
  { name: "Travel", color: "#c8870a", desc: "Travel tips, destination recommendations and trip reports. Student-budget adventures.", members: 31 },
  { name: "Running", color: "#E84545", desc: "Track your runs, share routes and train together. From 5K to marathon prep.", members: 17 },
  { name: "Climbing", color: "#7C6AF5", desc: "Bouldering, sport climbing and outdoor sessions. Find climbing partners on campus.", members: 22 },
  { name: "Blockchain", color: "#D85A30", desc: "Smart contracts, DeFi, cryptography fundamentals and web3 development.", members: 14 },
  { name: "Electronics", color: "#378ADD", desc: "Arduino, Raspberry Pi, PCB design and embedded systems. Hardware projects and tinkering.", members: 18 },
  { name: "Astronomy", color: "#7F77DD", desc: "Stargazing sessions, astrophotography and space news. Telescope setups and observation tips.", members: 11 },
  { name: "Manga", color: "#E84545", desc: "Manga and anime discussions, recommendations and fan art. Weekly chapter discussions.", members: 67 },
  { name: "Music Production", color: "#1D9E75", desc: "Beatmaking, mixing, mastering and sound design. Share your tracks and collaborate.", members: 15 },
  { name: "Skateboarding", color: "#c8870a", desc: "Spots around campus, trick tips and skate sessions. All levels from beginners to pros.", members: 9 },
  { name: "Volunteering", color: "#5a9e3a", desc: "Community service, mentoring and social impact projects. Give back while you learn.", members: 26 },
  { name: "Languages", color: "#378ADD", desc: "Language exchange, study groups and practice sessions. Learn from native speakers on campus.", members: 38 },
  { name: "Entrepreneurship", color: "#D85A30", desc: "Startup ideas, pitch practice and business development. From side projects to full ventures.", members: 33 },
];

export const profileInterests: ProfileInterest[] = [
  { name: "Photography", color: "#378ADD" },
  { name: "Cycling", color: "#5a9e3a" },
  { name: "Gaming", color: "#7F77DD" },
  { name: "Chess", color: "#D85A30" },
  { name: "Music", color: "#1D9E75" },
  { name: "Cyber", color: "#E84545" },
  { name: "AI", color: "#7C6AF5" },
];

export const profileFriends = [
  { initials: "pd", name: "mtellal", level: 15, online: true },
  { initials: "sv", name: "bazaluga", level: 11, online: true },
  { initials: "lm", name: "jsom", level: 8, online: false },
  { initials: "ar", name: "rabouzia", level: 13, online: true },
];

export const profileActivity = [
  { icon: "camera", text: "Joined the Photography channel", time: "2 hours ago" },
  { icon: "handshake", text: "New friend: svidal", time: "1 day ago" },
  { icon: "levelup", text: "Reached level 12", time: "3 days ago" },
  { icon: "cycling", text: "Joined the Campus cycling event", time: "5 days ago" },
];

export const profileSocials: ProfileSocial[] = [
  { platform: "github", label: "github.com/abestaev" },
  { platform: "linkedin", label: "aleko-bestaev" },
  { platform: "instagram", label: "@aleko.b" },
  { platform: "spotify", label: "abestaev_music" },
  { platform: "strava", label: "abestaev" },
  { platform: "steam", label: "abestaev" },
  { platform: "portfolio", label: "abestaev.dev" },
];

export const currentProjects = [
  {
    name: "ft_transcendence",
    description: "Web app -- Full stack -- Group project",
    color: "#7F77DD",
    status: "In progress" as const,
  },
];
