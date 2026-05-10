import "dotenv/config";
import { auth } from "@/lib/auth";
import { prisma } from "@/repositories/prisma-client";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.error(
      "Missing SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD env vars. " +
        "Set them in .env before running prisma db seed.",
    );
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} already exists (id=${existing.id}). Skipping.`);
    return;
  }

  await auth.api.signUpEmail({
    body: { email, password, name: "Admin" },
  });

  const user = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  // signUpEmail creates a session as a side-effect of the web signup flow.
  // The seed does not need it; clean up so the session table reflects only
  // real logins.
  await prisma.session.deleteMany({ where: { userId: user.id } });

  console.log(`Admin ${email} created with role ADMIN (id=${user.id}).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
