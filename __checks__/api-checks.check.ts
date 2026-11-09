import usersFile from './data/users.json'
import { userApiGroup } from './groups.check'
import { createUserApiCheck, type User } from './utils/create-user-api-check'

/**
 * One API check per user in data/users.json.
 * Add a user to the JSON and deploy to add a check; remove one to remove its check.
 */
const users: User[] = usersFile.users

for (const user of users) {
  createUserApiCheck(user, { group: userApiGroup })
}
