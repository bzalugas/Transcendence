import { API_BASE_URL } from "@/lib/api-url";
import {
  allProjects,
  trendingProjects,
  type ProjectGridItem,
} from "@/lib/mocks/projects";

interface ApiProject {
  id: number;
  slug: string;
  name: string;
  color: string;
  description: string;
}

export async function getAllProjects(): Promise<ProjectGridItem[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/projects`, {
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error("Unable to load projects");
    }

    const projects = (await response.json()) as ApiProject[];

    return projects.map(toProjectGridItem);
  } catch {
    return allProjects;
  }
}

export function getLfgPosts(): [] {
  return [];
}

export function getTrendingProjects() {
  return trendingProjects;
}

function toProjectGridItem(project: ApiProject): ProjectGridItem {
  const fallback = allProjects.find((item) => item.slug === project.slug);

  return {
    name: project.name,
    slug: project.slug,
    color: project.color,
    description: project.description,
    members: fallback?.members ?? 0,
    activeNow: fallback?.activeNow ?? 0,
    unread: false,
    lastMessage: fallback?.lastMessage ?? "",
    messages: fallback?.messages ?? [],
  };
}
