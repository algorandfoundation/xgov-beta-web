import type { User } from "@/api/discourse/user.ts";
import type { Topic } from "@/api/discourse/topic.ts";
import { Mutex } from "async-mutex";
const mutex = new Mutex();

export async function fetchDiscourseUsers(url: string, init: RequestInit = {}){
  const parts = url.split('/')
  return mutex.runExclusive(async ()=>fetch(`/api/discourse/${parts[parts.length -1]}`, init).then(async r=> {
    if(r.status === 404) {
      return []
    }
    const result =  await r.json()
    return (result?.users || []) as User[]
  }))
}

export interface TopicSummary {
  postCount: number;
  recentAvatars: string[];
}

export async function fetchDiscourseTopic(url: string, init: RequestInit = {}, size: number = 48): Promise<TopicSummary | null> {
  const parts = url.split('/')
  return mutex.runExclusive(async () => {
    const response = await fetch(`/api/discourse/${parts[parts.length - 1]}`, init)
    
    if (response.status === 404) {
      return null
    }
    
    const topic = await response.json() as Topic
    
    // Get actual post count from the posts array length
    const postCount = topic.post_stream.posts.length
    
    // Get recent posts with avatars (sorted by creation date, most recent first)
    const postsWithAvatars = topic.post_stream.posts
      .filter(post => post.avatar_template)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    
      // Get unique avatars from the 5 most recent posts
    const uniqueAvatars = new Set<string>()
    const recentAvatars: string[] = []
    
    for (const post of postsWithAvatars) {
      if (recentAvatars.length >= 5) break
      
      const avatarUrl = transformAvatarUrl(post.avatar_template, size)
      
      if (!uniqueAvatars.has(avatarUrl)) {
        uniqueAvatars.add(avatarUrl)
        recentAvatars.push(avatarUrl)
      }
    }
    
    return {
      postCount,
      recentAvatars
    }
  })
}

function transformAvatarUrl(avatarTemplate: string, size: number): string {
  const parts = avatarTemplate.split('/')
  const userId = parts[parts.length - 3]
  const id = parts[parts.length - 1]
  return `/api/discourse/avatar/${userId}/${size}/${id}`;
}
