import type { Metadata } from "next";
import ProjectsPageClient from "./ProjectsPageClient";
import { getInitialProjects } from "@/lib/server/api";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore 42 student projects and project discussions on 42 Connect.",
};

export default async function ProjectsPage() {
  const initialProjects = await getInitialProjects();

  return <ProjectsPageClient initialProjects={initialProjects} />;
}
