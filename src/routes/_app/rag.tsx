import { createFileRoute } from "@tanstack/react-router";
import { RagWorkspace } from "@/features/rag/components/rag-workspace";

export const Route = createFileRoute("/_app/rag")({
  component: RagWorkspace,
});
