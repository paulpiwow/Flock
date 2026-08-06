/*
 * Seed 8 weeks of attendance history for Hall 2 so Trends has a real line.
 * Deterministic: the first K members (by creation order) are PRESENT each week,
 * where K = round(pct * total). Leaves the last few members absent across the
 * recent weeks so the "needs attention" rule has something to surface.
 *
 * Run: node scripts/seed-history.js
 */
const fs = require("fs");
fs.readFileSync(".env", "utf8").split(/\r?\n/).forEach((l) => {
  const m = l.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
});
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PCTS = [78, 82, 88, 74, 69, 91, 84, 79]; // weeks 1..8
const PASSAGES = [
  "John 15:1-11", "John 15:12-17", "John 16:1-15", "John 17:1-19",
  "Romans 8:1-17", "Romans 12:1-8", "Philippians 2:1-11", "Colossians 3:1-17",
];

async function main() {
  const hall = await prisma.hall.findFirst({ where: { name: "Hall 2" } });
  if (!hall) throw new Error("Hall 2 not found.");
  const hallId = hall.id;

  const members = await prisma.user.findMany({
    where: { hallId, role: "MEMBER", isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, groupId: true },
  });
  const total = members.length;
  const now = new Date();

  for (let i = 0; i < PCTS.length; i++) {
    const index = i + 1;
    const pct = PCTS[i];
    // Wednesday dates, oldest first.
    const date = new Date(2026, 7, 5 + i * 7, 20, 0, 0); // Aug 5 2026 + weeks

    let week = await prisma.week.findFirst({ where: { hallId, index } });
    if (!week) {
      week = await prisma.week.create({
        data: {
          hallId, index, date, semester: "Fall 2026",
          passageRef: PASSAGES[i],
          enduringUrl: "https://enduringword.com",
        },
      });
    }

    // Reset + reseed PRESENT records for this week.
    await prisma.attendanceRecord.deleteMany({ where: { weekId: week.id } });
    const k = Math.round((pct / 100) * total);
    const present = members.slice(0, k);
    if (present.length) {
      await prisma.attendanceRecord.createMany({
        data: present.map((m) => ({
          hallId, weekId: week.id, studentId: m.id, groupId: m.groupId,
          status: "PRESENT", confirmedAt: now,
        })),
      });
    }
    console.log(`W${index} ${pct}% -> ${present.length}/${total} present (${PASSAGES[i]})`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
