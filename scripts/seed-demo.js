/*
 * Demo seed for Phase 2 (attendance). Populates Hall 2 with a realistic roster
 * and wires up one login per role for testing:
 *   - newguy@liberty.edu   RS   (ADMIN, already exists)
 *   - paul.test@liberty.edu CGL (LEADER of Group 1)     <- reused
 *   - student1@liberty.edu Student (MEMBER in Group 1)  <- created here
 * Idempotent-ish: groups/fake users are only created if Hall 2 has no groups yet.
 *
 * Run: node scripts/seed-demo.js   (loads .env manually)
 */
const crypto = require("crypto");
const fs = require("fs");

fs.readFileSync(".env", "utf8")
  .split(/\r?\n/)
  .forEach((l) => {
    const m = l.match(/^([A-Z_]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  });

const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

const FIRST = ["Isaac", "Brooks", "Parker", "Drew", "Kade", "Reed", "Levi", "Owen", "Caleb", "Silas", "Aiden", "Josh", "Ben", "Eli", "Nate", "Cole", "Sam", "Jack", "Luke", "Micah"];
const LAST = ["Adams", "Baker", "Bishop", "Carter", "Dalton", "Ellis", "Fisher", "Grant", "Hayes", "Ingram", "Jensen", "Keller", "Lawson", "Mercer", "Nash", "Orr", "Porter", "Riggs", "Stone", "Turner", "Vance", "Walsh", "York"];

// Deterministic name generator (stable across runs; avoids Math.random).
function makeName(i) {
  const f = FIRST[i % FIRST.length];
  const l = LAST[Math.floor(i / FIRST.length) % LAST.length];
  return `${f} ${l}`;
}

const PASSWORD = "flockpass123";

/** Ensure a real Supabase auth account exists; return its uid. */
async function ensureAuthUser(email, username, hallCode) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password: PASSWORD,
    options: { data: { username, hallCode } },
  });
  if (data?.user?.id) return data.user.id;
  // Already registered -> sign in to fetch the uid.
  const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (si?.user?.id) return si.user.id;
  throw new Error(
    `Could not create/sign in ${email}: ${error?.message || siErr?.message}`,
  );
}

async function main() {
  const hall = await prisma.hall.findFirst({ where: { name: "Hall 2" } });
  if (!hall) throw new Error("Hall 2 not found — run the base seed first.");
  const hallId = hall.id;

  // --- current week ---
  let week = await prisma.week.findFirst({ where: { hallId } });
  if (!week) {
    week = await prisma.week.create({
      data: {
        hallId,
        index: 1,
        date: new Date("2026-08-05T23:00:00Z"), // a Wednesday
        semester: "Fall 2026",
        passageRef: "John 15:1-11",
        enduringUrl: "https://enduringword.com/bible-commentary/john-15/",
      },
    });
  }

  // --- real test accounts ---
  const studentUid = await ensureAuthUser("student1@liberty.edu", "Sam Adams", "HALL2-F26");
  const paul = await prisma.user.findUnique({ where: { email: "paul.test@liberty.edu" } });

  // --- groups + roster (only if not seeded yet) ---
  const existingGroups = await prisma.group.count({ where: { hallId } });
  let group1 = await prisma.group.findFirst({ where: { hallId, name: "Group 1" } });

  if (existingGroups === 0) {
    let nameIdx = 0;
    for (let g = 1; g <= 9; g++) {
      const group = await prisma.group.create({
        data: { hallId, name: `Group ${g}` },
      });
      if (g === 1) group1 = group;

      // Group 1's leader = paul.test (real CGL login); others = seeded CGLs.
      if (g === 1 && paul) {
        await prisma.user.update({
          where: { id: paul.id },
          data: { hallId, role: "LEADER", groupId: null },
        });
        await prisma.group.update({
          where: { id: group.id },
          data: { leaderId: paul.id },
        });
      } else {
        const leaderName = makeName(nameIdx++);
        const leader = await prisma.user.create({
          data: {
            id: `seed_${crypto.randomUUID()}`,
            email: `seed_${crypto.randomUUID()}@liberty.edu`,
            username: leaderName,
            role: "LEADER",
            hallId,
          },
        });
        await prisma.group.update({
          where: { id: group.id },
          data: { leaderId: leader.id },
        });
      }

      // ~6 members per group (seeded, no login).
      for (let s = 0; s < 6; s++) {
        await prisma.user.create({
          data: {
            id: `seed_${crypto.randomUUID()}`,
            email: `seed_${crypto.randomUUID()}@liberty.edu`,
            username: makeName(nameIdx++),
            role: "MEMBER",
            hallId,
            groupId: group.id,
          },
        });
      }
    }
  }

  // --- ensure the real student login is a MEMBER of Group 1 ---
  if (group1) {
    await prisma.user.upsert({
      where: { id: studentUid },
      create: {
        id: studentUid,
        email: "student1@liberty.edu",
        username: "Sam Adams",
        role: "MEMBER",
        hallId,
        groupId: group1.id,
      },
      update: { hallId, role: "MEMBER", groupId: group1.id },
    });
    // keep paul as Group 1's CGL on re-runs
    if (paul) {
      await prisma.user.update({
        where: { id: paul.id },
        data: { hallId, role: "LEADER", groupId: null },
      });
      if (!group1.leaderId) {
        await prisma.group.update({
          where: { id: group1.id },
          data: { leaderId: paul.id },
        });
      }
    }
  }

  // --- summary ---
  const counts = {
    groups: await prisma.group.count({ where: { hallId } }),
    students: await prisma.user.count({ where: { hallId, role: "MEMBER" } }),
    leaders: await prisma.user.count({ where: { hallId, role: "LEADER" } }),
  };
  console.log("Hall 2 seeded:", counts);
  console.log("Current week:", week.passageRef, "(Fall 2026, week", week.index + ")");
  console.log("Test logins (password flockpass123):");
  console.log("  RS      newguy@liberty.edu");
  console.log("  CGL     paul.test@liberty.edu  (leads Group 1)");
  console.log("  Student student1@liberty.edu   (Group 1)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
