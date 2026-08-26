import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/")({
  component: HomeRoute,
});

function HomeRoute() {
  return null;
}
