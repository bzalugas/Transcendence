export interface ProjectDiscussionMessage {
  sender: string;
  initials: string;
  text: string;
  time: string;
  daysAgo: number;
  me?: boolean;
}

export interface ProjectGridItem {
  name: string;
  slug: string;
  color: string;
  description: string;
  members: number;
  activeNow: number;
  unread: boolean;
  lastMessage: string;
  messages: ProjectDiscussionMessage[];
}

const projectColors = {
  c: "#2B9E8F",
  cpp: "#7F77DD",
  infra: "#C8870A",
  network: "#667085",
  docs: "#21A67A",
};

export const allProjects: ProjectGridItem[] = [
  createProject("Libft", "libft", projectColors.c, "Your own C library -- strings, memory, lists", 64, 12, true),
  createProject("get_next_line", "get_next_line", projectColors.c, "Read files line by line -- buffers, static state, file descriptors", 51, 9, false),
  createProject("ft_printf", "ft_printf", projectColors.c, "Recreate printf -- variadic functions, formatting, conversions", 48, 8, true),
  createProject("Born2beroot", "born2beroot", projectColors.infra, "Virtual machine administration -- users, sudo, monitoring, security", 42, 7, false),
  createProject("push_swap", "push_swap", projectColors.c, "Sorting with two stacks -- algorithms, operations, complexity", 38, 10, true),
  createProject("pipex", "pipex", projectColors.c, "Unix pipes -- fork, execve, dup2, redirections", 35, 6, false),
  createProject("minitalk", "minitalk", projectColors.c, "Client/server signals -- bit encoding, SIGUSR1, SIGUSR2", 28, 5, false),
  createProject("so_long", "so_long", projectColors.c, "Small 2D game -- maps, sprites, input, MiniLibX", 31, 8, false),
  createProject("FdF", "fdf", projectColors.c, "Wireframe renderer -- projections, parsing, MiniLibX", 27, 4, false),
  createProject("fract-ol", "fract-ol", projectColors.c, "Fractal explorer -- complex numbers, zoom, rendering", 24, 4, false),
  createProject("Philosophers", "philosophers", projectColors.c, "Dining philosophers -- threads, mutexes, timing", 44, 11, true),
  createProject("minishell", "minishell", projectColors.c, "A small shell -- parsing, pipes, redirections, signals", 58, 16, true),
  createProject("NetPractice", "netpractice", projectColors.network, "Networking basics -- subnetting, routing, TCP/IP", 33, 5, false),
  createProject("cub3d", "cub3d", projectColors.c, "Raycasting engine -- Wolfenstein-style 3D maze", 36, 7, false),
  createProject("miniRT", "minirt", projectColors.c, "Raytracing engine -- primitives, lighting, cameras", 22, 3, false),
  createProject("CPP 00 - 04", "cpp-00-04", projectColors.cpp, "C++ fundamentals -- classes, memory, operators, inheritance, polymorphism", 43, 10, false),
  createProject("CPP 05 - 09", "cpp-05-09", projectColors.cpp, "Advanced C++ practice -- exceptions, casts, templates, STL", 34, 7, false),
  createProject("Inception", "inception", projectColors.infra, "Docker infrastructure -- WordPress, MariaDB, NGINX", 32, 6, false),
  createProject("webserv", "webserv", projectColors.cpp, "HTTP server in C++98 -- config, CGI, methods", 41, 12, true),
  createProject("ft_irc", "ft_irc", projectColors.cpp, "IRC server in C++98 -- channels, operators, authentication", 37, 9, true),
  createProject("ft_transcendence", "ft_transcendence", projectColors.cpp, "Full-stack web app -- Pong, chat, auth, user management", 69, 18, true),
  createProject("Collaborative_resume", "collaborative_resume", projectColors.docs, "Collaborative resume work -- feedback, structure, final polish", 19, 3, false),
];

export const trendingProjects = [
  { name: "ft_transcendence", messages: 127 },
  { name: "minishell", messages: 84 },
  { name: "webserv", messages: 61 },
  { name: "ft_irc", messages: 43 },
  { name: "cub3d", messages: 29 },
];

function createProject(
  name: string,
  slug: string,
  color: string,
  description: string,
  members: number,
  activeNow: number,
  unread: boolean,
): ProjectGridItem {
  const readableName = name.replaceAll("_", " ");

  return {
    name,
    slug,
    color,
    description,
    members,
    activeNow,
    unread,
    lastMessage: `Latest notes and questions about ${readableName}`,
    messages: [
      {
        sender: "claurent",
        initials: "cl",
        text: `Anyone working on ${readableName} this week? Drop your blockers here.`,
        time: "09:42",
        daysAgo: 2,
      },
      {
        sender: "jmoreau",
        initials: "jm",
        text: "I can share my notes after evaluation, especially the tricky edge cases.",
        time: "10:08",
        daysAgo: 8,
      },
      {
        sender: "you",
        initials: "me",
        text: "Perfect, I am saving this channel for later.",
        time: "10:15",
        daysAgo: 18,
        me: true,
      },
    ],
  };
}
