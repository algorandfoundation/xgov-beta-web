import type { User } from "@/api/discourse/user.ts";

export function toAvatarURL(user: User, size: number = 20){
  return user.avatar_template.replace('{size}', size.toString())
}

export function toAvatarURLs(users: User[]){
  return users.map(toAvatarURL)
}
