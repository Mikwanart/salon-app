const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const email = "mikwanart7@gmail.com";
  
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: "CLIENT" }
    });
    console.log("Updated user:", email, user.role);
  } catch (e) {
    console.log("User not found:", email);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
