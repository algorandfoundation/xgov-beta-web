import { fetchDiscourseTopic, fetchDiscourseUsers } from "@/api/discourse/fetch";
import { useQuery } from "@tanstack/react-query";

export function useAvatars(forumLink?: string){

  // Fetch Discussion Users

  return useQuery({
    queryKey: ["getAvatars", forumLink],
    queryFn: () => fetchDiscourseTopic(forumLink!),
    enabled: !!forumLink,
  })
}
