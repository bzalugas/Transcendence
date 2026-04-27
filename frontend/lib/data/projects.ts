import {
  lfgPosts,
  allProjects,
  trendingProjects,
  type LfgPost,
  type ProjectGridItem,
} from "@/lib/mocks/projects";

// Backend swap point: replace with real API calls.

export function getLfgPosts(): LfgPost[] {
  return lfgPosts;
}

export function getAllProjects(): ProjectGridItem[] {
  return allProjects;
}

export function getTrendingProjects() {
  return trendingProjects;
}
