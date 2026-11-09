import { ApiCheck, AssertionBuilder, CheckGroupV2 } from 'checkly/constructs'

/** One entry from users.json. */
export interface User {
  id: number
  name: string
  profile_url: string
}

export interface UserApiCheckOptions {
  /** Group the check belongs to. It inherits the group's schedule, locations, retries and alerts. */
  group: CheckGroupV2
  /**
   * Name of the Checkly environment variable that holds the API token (without "Bearer ").
   * Add it as a secret: `npx checkly env add USER_API_TOKEN --secret`
   */
  tokenVariable?: string
}

/**
 * Creates one API check for one user.
 *
 * The check calls the user's `profile_url` with a Bearer token and passes when:
 * - the response status is 200
 * - the response's `id` and `name` match this user's entry in the JSON file
 *
 * Reusable: call it for every entry of any JSON file with the same shape,
 * and pass a different group to give those checks their own schedule or alerts.
 */
export function createUserApiCheck(user: User, options: UserApiCheckOptions): ApiCheck {
  validateUser(user)
  const tokenVariable = options.tokenVariable ?? 'USER_API_TOKEN'

  // The logical ID is based on the user's id, not their position in the file,
  // so reordering the JSON doesn't recreate checks or lose their history.
  return new ApiCheck(`user-api-${user.id}`, {
    name: `User API: ${user.name} (${user.id})`,
    group: options.group,
    tags: ['api', 'users'],
    // Allow for the API waking up from a cold start before calling it a failure.
    degradedResponseTime: 10_000,
    maxResponseTime: 20_000,
    request: {
      method: 'GET',
      url: user.profile_url,
      // {{USER_API_TOKEN}} is filled in by Checkly at run time from the secret,
      // so the token never appears in this repository.
      headers: [{ key: 'Authorization', value: `Bearer {{${tokenVariable}}}` }],
      assertions: [
        AssertionBuilder.statusCode().equals(200),
        AssertionBuilder.jsonBody('$.id').equals(user.id),
        AssertionBuilder.jsonBody('$.name').equals(user.name),
      ],
    },
  })
}

/** Fails the deploy with a clear message if a JSON entry is incomplete. */
function validateUser(user: User): void {
  const problems: string[] = []
  if (typeof user?.id !== 'number') problems.push('"id" must be a number')
  if (typeof user?.name !== 'string' || !user.name.trim()) problems.push('"name" must be a non-empty string')
  try {
    new URL(user?.profile_url)
  } catch {
    problems.push('"profile_url" must be a valid URL')
  }
  if (problems.length) {
    throw new Error(`Invalid user entry ${JSON.stringify(user)}: ${problems.join(', ')}`)
  }
}
