export function UserCircleRow({ users }: { users: string[] }) {
  return (
    <div className="flex flex-shrink-0 -space-x-0.5 py-0.5">
      <dt className="sr-only">Commenters</dt>
      {users
        ?.map((url) => (
          <dd key={url}>
            <img
              alt={url}
              src={url}
              className="size-5 md:size-6 rounded-full bg-white darl:bg-algo-black ring-2 ring-white dark:ring-algo-black"
            />
          </dd>
        ))}
    </div>
  );
}
