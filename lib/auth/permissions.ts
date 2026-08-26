import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  ownerAc,
} from "better-auth/plugins/organization/access";

const statement = {
  ...defaultStatements,
  project: ["create", "share", "update", "delete"],
} as const;

const ac = createAccessControl(statement);

const member = ac.newRole({
  project: ["create"],
});

const admin = ac.newRole({
  project: ["create", "update"],
});

const owner = ac.newRole({
  ...ownerAc.statements,
  project: ["create", "update", "delete"],
  organization: ["update", "delete"],
});

export { ac, admin, member, owner, statement };
