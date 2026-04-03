export interface LfgPost {
  initials: string;
  name: string;
  time: string;
  online: boolean;
  away?: boolean;
  commonInterests: number;
  project: string;
  projectColor: string;
  description: string;
  teamMembers: string[];
  spotsLeft: number;
}

export const lfgPosts: LfgPost[] = [
  {
    initials: "cl", name: "claurent", time: "2h ago", online: true,
    commonInterests: 3, project: "ft_transcendence", projectColor: "#7F77DD",
    description: "Looking for 1 more person for transcendence. We already have the backend (NestJS) mostly done, need someone comfortable with frontend (React/Next). Starting the multiplayer pong this week.",
    teamMembers: ["cl", "sv"], spotsLeft: 1,
  },
  {
    initials: "jm", name: "jmoreau", time: "5h ago", online: false,
    commonInterests: 1, project: "minishell", projectColor: "#D85A30",
    description: "Starting minishell from scratch, need a partner. I'm comfortable with parsing, would love someone who knows processes/signals well. Planning to work mornings in the cluster.",
    teamMembers: ["jm"], spotsLeft: 1,
  },
  {
    initials: "tm", name: "tmercier", time: "1 day ago", online: true,
    commonInterests: 4, project: "webserv", projectColor: "#1D9E75",
    description: "HTTP server in C++98. We're 3, team is complete but happy to help if anyone has questions on config parsing.",
    teamMembers: ["tm", "pd", "nf"], spotsLeft: 0,
  },
  {
    initials: "lm", name: "lmartin", time: "2 days ago", online: false, away: true,
    commonInterests: 2, project: "cub3d", projectColor: "#378ADD",
    description: "Need a partner for cub3d. I've done the map parsing already and started raycasting. Looking for someone who can handle textures and sprites.",
    teamMembers: ["lm"], spotsLeft: 1,
  },
  {
    initials: "ar", name: "arenard", time: "3 days ago", online: false,
    commonInterests: 0, project: "ft_irc", projectColor: "#E84545",
    description: "Looking for 2 people for ft_irc. I want to start next week. Already read the RFC, have a rough architecture in mind. C++98, need people who can commit ~4h/day.",
    teamMembers: ["ar"], spotsLeft: 2,
  },
];

export interface ProjectGridItem {
  name: string;
  color: string;
  description: string;
  looking: number;
  active: number;
  unread: boolean;
}

export const allProjects: ProjectGridItem[] = [
  { name: "ft_transcendence", color: "#7F77DD", description: "Full-stack web app -- Pong, chat, auth, user management", looking: 18, active: 42, unread: true },
  { name: "minishell", color: "#D85A30", description: "Build a simple shell -- Parsing, execution, pipes, redirections", looking: 14, active: 38, unread: true },
  { name: "webserv", color: "#1D9E75", description: "HTTP server in C++98 -- Config, CGI, methods", looking: 9, active: 27, unread: false },
  { name: "ft_irc", color: "#E84545", description: "IRC server in C++98 -- Channels, operators, authentication", looking: 6, active: 19, unread: true },
  { name: "cub3d", color: "#378ADD", description: "Raycasting engine -- Wolfenstein-style 3D maze", looking: 5, active: 15, unread: false },
  { name: "inception", color: "#c8870a", description: "Docker infrastructure -- WordPress, MariaDB, NGINX", looking: 3, active: 22, unread: false },
  { name: "philosophers", color: "#5a9e3a", description: "Threading and mutexes -- Dining philosophers problem", looking: 0, active: 31, unread: false },
  { name: "cpp_modules", color: "#888888", description: "C++ fundamentals -- OOP, templates, STL, exceptions", looking: 0, active: 45, unread: false },
  { name: "miniRT", color: "#4a9eff", description: "Raytracing engine -- Spheres, planes, cylinders, lighting", looking: 4, active: 11, unread: false },
  { name: "NetPractice", color: "#666666", description: "Networking basics -- Subnetting, routing, TCP/IP", looking: 0, active: 8, unread: false },
];

export const trendingProjects = [
  { name: "ft_transcendence", messages: 127 },
  { name: "minishell", messages: 84 },
  { name: "webserv", messages: 61 },
  { name: "ft_irc", messages: 43 },
  { name: "cub3d", messages: 29 },
];
