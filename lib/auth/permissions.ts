import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
  project: ["create"],
});

const subOwner = ac.newRole({
  project: ["create"],
});

const board = ac.newRole({
  project: ["create"],
});

const sublead = ac.newRole({
  project: ["create"],
});

const treasurer = ac.newRole({
  project: ["create"],
});

const advisor = ac.newRole({
  project: ["create"],
});

const kas = ac.newRole({
  project: ["create"],
});

const admin = ac.newRole({
  project: ["create", "update"],
});

const owner = ac.newRole({
  project: ["create", "update", "delete"],
  organization: ["update", "delete"],
  member: ["create", "update", "delete"],
  invitation: ["create", "cancel"],
  team: ["create", "update", "delete"],
  ac: ["create", "read", "update", "delete"],
});

export {
  ac,
  admin,
  advisor,
  board,
  kas,
  member,
  owner,
  statement,
  sublead,
  subOwner,
  treasurer,
};
