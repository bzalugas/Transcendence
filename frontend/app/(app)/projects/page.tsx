import ProjectsPageClient from "./ProjectsPageClient";
import { getInitialProjects } from "@/lib/server/api";

export default async function ProjectsPage() {
  const initialProjects = await getInitialProjects();

  return <ProjectsPageClient initialProjects={initialProjects} />;
}
