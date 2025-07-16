import { fetchDiscourseTopic } from "@/api/discourse/fetch";
import { useQuery } from "@tanstack/react-query";

export function useDiscourseTopic(forumLink?: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["getDiscourseTopic", forumLink],
    queryFn: () => fetchDiscourseTopic(forumLink!),
    enabled: !!forumLink && enabled,
  })
}
