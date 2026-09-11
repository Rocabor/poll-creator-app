import { PrismaClient } from "@prisma/client";
import { ensureDemoUser, resetDemoPolls } from "../src/lib/sample-data";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "Seeding Tiebreak with the guest dataset (Morgan + 5 polls, 32 votes)..."
  );
  const demoUser = await ensureDemoUser(prisma);
  console.log(`  creator: ${demoUser.name} (${demoUser.email})`);

  await resetDemoPolls(prisma, demoUser.id);

  await prisma.$disconnect();
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});