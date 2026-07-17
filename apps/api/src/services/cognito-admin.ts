import {
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient
} from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({});

function userPoolId() {
  const id = process.env.COGNITO_USER_POOL_ID;
  if (!id) throw new Error("COGNITO_USER_POOL_ID is required");
  return id;
}

export async function addUserToGroup(username: string, groupName: string) {
  await client.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId(),
      Username: username,
      GroupName: groupName
    })
  );
}

export async function removeUserFromGroup(username: string, groupName: string) {
  await client.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: userPoolId(),
      Username: username,
      GroupName: groupName
    })
  );
}
