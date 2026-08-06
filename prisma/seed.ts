import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// The three halls (Paul, Will, Ty). Names/codes are placeholders — rename in-app
// later. The join code is what an RS shares so his guys bind to THIS hall.
const HALLS: { name: string; joinCode: string }[] = [
  { name: "Hall 3", joinCode: "HALL3-F26" },
  { name: "Hall 1", joinCode: "HALL1-F26" },
  { name: "Hall 2", joinCode: "HALL2-F26" },
];

async function main() {
  for (const h of HALLS) {
    // Idempotent by name (name isn't unique in the schema, so find-then-write).
    const existing = await prisma.hall.findFirst({ where: { name: h.name } });
    if (existing) {
      await prisma.hall.update({
        where: { id: existing.id },
        data: { joinCode: h.joinCode },
      });
    } else {
      await prisma.hall.create({ data: h });
    }
  }

  const halls = await prisma.hall.findMany({
    orderBy: { name: "asc" },
    select: { name: true, joinCode: true },
  });
  console.log("Halls & join codes:");
  for (const h of halls) console.log(`  ${h.name.padEnd(10)} ${h.joinCode}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
