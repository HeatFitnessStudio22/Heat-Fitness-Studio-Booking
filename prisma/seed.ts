// Creates (or updates) the gym-owner admin account from env vars.
// Run with: npm run seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_NAME || "HEAT Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before seeding.");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: email.toLowerCase().trim() },
    update: { passwordHash, role: "ADMIN", fullName },
    create: {
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "ADMIN",
      fullName,
    },
  });

  console.log(`Admin account ready: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

