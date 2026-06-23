import { fetchDiscourseTopic } from "@/api/discourse/fetch";
import { getSafeForumTopicUrl } from "@/functions";
import { useQuery } from "@tanstack/react-query";

export function useDiscourseTopic(forumLink?: string, enabled: boolean = true) {
  const safeForumLink = getSafeForumTopicUrl(forumLink);

  return useQuery({
    queryKey: ["getDiscourseTopic", safeForumLink],
    queryFn: () => fetchDiscourseTopic(safeForumLink!),
    enabled: !!safeForumLink && enabled,
  })
}
