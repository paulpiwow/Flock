/*
 * Wipe all data for one hall (users, groups, attendance, care notes, verses,
 * 1-on-1s, weeks, notes, resources) but KEEP the hall itself (name + join code),
 * so it's ready for fresh real signups. Use this to clear demo data after testing.
 *
 * Usage:
 *   node scripts/reset-hall.js <name|joinCode>            # DRY RUN (shows counts)
 *   node scripts/reset-hall.js <name|joinCode> --confirm  # actually delete
 * Examples:
 *   node scripts/reset-hall.js OHANA
 *   node scripts/reset-hall.js "Hall 2" --confirm
 *
 * NOTE: this removes the app's User rows, but NOT the Supabase Auth accounts.
 * Any real login (e.g. a person's @liberty.edu account) can still sign in and
 * would come back as PENDING. To fully remove test logins, also delete them in
 * Supabase → Authentication → Users. Seeded fake users (seed_… emails) have no
 * auth account, so deleting the User row is all that's needed for them.
 */
const fs = require("fs");
fs.readFileSync(".env", "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
});
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const arg = process.argv[2];
  const confirm = process.argv.includes("--confirm");
  if (!arg) {
    console.error("Usage: node scripts/reset-hall.js <name|joinCode> [--confirm]");
    process.exit(1);
  }

  const hall = await prisma.hall.findFirst({
    where: { OR: [{ name: arg }, { joinCode: arg.toUpperCase() }] },
  });
  if (!hall) {
    console.error(`No hall matching "${arg}".`);
    process.exit(1);
  }
  const hallId = hall.id;

  const counts = {
    users: await prisma.user.count({ where: { hallId } }),
    groups: await prisma.group.count({ where: { hallId } }),
    weeks: await prisma.week.count({ where: { hallId } }),
    weeklyNotes: await prisma.weeklyNote.count({ where: { week: { hallId } } }),
    attendance: await prisma.attendanceRecord.count({ where: { hallId } }),
    careNotes: await prisma.careNote.count({ where: { hallId } }),
    memoryVerses: await prisma.memoryVerse.count({ where: { hallId } }),
    oneOnOnes: await prisma.oneOnOne.count({ where: { hallId } }),
    resources: await prisma.resource.count({ where: { hallId } }),
  };

  console.log(`Hall "${hall.name}" (code ${hall.joinCode}) — would delete:`);
  for (const [k, v] of Object.entries(counts)) console.log(`  ${k.padEnd(14)} ${v}`);

  if (!confirm) {
    console.log("\nDRY RUN — nothing deleted. Re-run with --confirm to delete.");
    return;
  }

  // FK-safe order; the Hall row itself is preserved.
  await prisma.$transaction([
    prisma.oneOnOne.deleteMany({ where: { hallId } }),
    prisma.memoryVerse.deleteMany({ where: { hallId } }),
    prisma.careNote.deleteMany({ where: { hallId } }),
    prisma.attendanceRecord.deleteMany({ where: { hallId } }),
    prisma.resource.deleteMany({ where: { hallId } }),
    prisma.weeklyNote.deleteMany({ where: { week: { hallId } } }),
    prisma.week.deleteMany({ where: { hallId } }),
    prisma.user.updateMany({ where: { hallId }, data: { groupId: null } }),
    prisma.group.deleteMany({ where: { hallId } }),
    prisma.user.deleteMany({ where: { hallId } }),
  ]);

  console.log(`\nDeleted. Hall "${hall.name}" (code ${hall.joinCode}) is now empty and ready.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
