import { db, UsersTable } from '@/lib/drizzle';
import { seed } from '@/lib/seed';
import { timeAgo } from '@/lib/utils';

import RefreshButton from './refresh-button';

export default async function Table() {
  let users;
  let startTime = Date.now();
  try {
    users = await db.select().from(UsersTable);
  } catch (e: unknown) {
    if (
      e instanceof Error &&
      'message' in e &&
      e.message === `relation "profiles" does not exist`
    ) {
      // Table is not created yet
      await seed();
      startTime = Date.now();
      users = await db.select().from(UsersTable);
    } else {
      throw e;
    }
  }

  const duration = Date.now() - startTime;

  return (
    <div className="mx-auto w-full max-w-xl rounded-lg bg-white/30 p-12 shadow-xl ring-1 ring-gray-900/5 backdrop-blur-lg">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Recent Users</h2>
          <p className="text-sm text-gray-500">
            Fetched {users.length} users in {duration}ms
          </p>
        </div>
        <RefreshButton />
      </div>
      <div className="divide-y divide-gray-900/5">
        {users.map(user => (
          <div key={user.username} className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <div className="space-y-1">
                <p className="font-medium leading-none">{user.username}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>
            <p className="text-sm text-gray-500">{timeAgo(user.created_at)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
