/*
 * Set a user's role by email — for the first-RS bootstrap (when there's no
 * existing RS on a hall yet to do it in-app). Run locally or against prod.
 *
 * Usage: node scripts/set-role.js <email> <ADMIN|LEADER|MEMBER>
 * Example: node scripts/set-role.js will@liberty.edu ADMIN
 *
 * Notes:
 *  - The user must already exist (they sign up first, with their hall's code).
 *  - ADMIN/LEADER get groupId cleared (they oversee/lead, not belong to, a group).
 *  - This is a low-level tool: it does NOT create a group for a new LEADER — use
 *    the in-app People screen ("Make CGL") for that.
 */
const fs = require("fs");
fs.readFileSync(".env", "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
});

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ROLES = ["ADMIN", "LEADER", "MEMBER"];

async function main() {
  const [email, role] = [process.argv[2], (process.argv[3] || "").toUpperCase()];
  if (!email || !ROLES.includes(role)) {
    console.error("Usage: node scripts/set-role.js <email> <ADMIN|LEADER|MEMBER>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { hall: { select: { name: true } } },
  });
  if (!user) {
    console.error(`No user with email ${email}. They need to sign up first.`);
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role, groupId: role === "MEMBER" ? user.groupId : null },
    select: { username: true, email: true, role: true, hall: { select: { name: true } } },
  });

  console.log("Updated:", updated);
  if (role === "ADMIN") {
    console.log(`${updated.username} is now the RS of ${updated.hall?.name ?? "their hall"}.`);
  }
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
