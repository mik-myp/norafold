import { createFileRoute } from "@tanstack/react-router";
import { WorkbenchHome } from "@/features/workbench/components/workbench-home";

export const Route = createFileRoute("/_app/")({
  component: WorkbenchHome,
});
