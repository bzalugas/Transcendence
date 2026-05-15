import { API_BASE_URL } from "@/lib/api-url";

export interface ProjectDiscussionMessage {
  id?: string;
  senderId?: string;
  sender: string;
  initials: string;
  avatarUrl?: string;
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
  messages?: ProjectDiscussionMessage[];
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

export async function createProjectMessage(
  slug: string,
  content: string,
): Promise<ProjectDiscussionMessage> {
  const response = await fetch(
    `${API_BASE_URL}/projects/${encodeURIComponent(slug)}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    throw new Error(`POST /projects/${slug}/messages failed with ${response.status}`);
  }

  return response.json();
}

function toProjectGridItem(project: ApiProject): ProjectGridItem {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    color: project.color,
    description: project.description,
    messages: project.messages ?? [],
  };
}
