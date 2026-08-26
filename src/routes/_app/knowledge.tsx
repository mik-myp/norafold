import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeWorkspace } from "@/features/knowledge/components/knowledge-workspace";

export const Route = createFileRoute("/_app/knowledge")({
  component: KnowledgeWorkspace,
});
