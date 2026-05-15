import { API_BASE_URL } from "@/lib/api-url";

export interface ProjectDiscussionMessage {
  sender: string;
  initials: string;
  text: string;
  time: string;
  daysAgo: number;
  me?: boolean;
}

export interface ProjectGridItem {
  id: number;
  name: string;
  slug: string;
  color: string;
  description: string;
  messages: ProjectDiscussionMessage[];
}

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
    return [];
  }
}

function toProjectGridItem(project: ApiProject): ProjectGridItem {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    color: project.color,
    description: project.description,
    messages: [],
  };
}
