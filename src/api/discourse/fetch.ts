import type { User } from "@/api/discourse/user.ts";
import { Mutex } from "async-mutex";
const mutex = new Mutex()

export async function fetchDiscourseUsers(url: string, init: RequestInit = {}){
  const parts = url.split('/')
  return mutex.runExclusive(async ()=>fetch(`/api/discourse/${parts[parts.length -1]}`, init).then(async r=> {
    if(r.status === 404) {
      return []
    }
    const result =  await r.json()
    console.log(result)
    return (result?.users || []) as User[]
  }))
}
