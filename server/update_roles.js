const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const targetEmails = ['mikwanart7@gmail.com', 'mikenart57@gmail.com', 'pennyekuba7@gmail.com', 'owner.ebony@lumiere.com'];
  
  await prisma.user.updateMany({
    where: { email: { in: targetEmails } },
    data: { role: 'ADMIN' }
  });

  const updatedUsers = await prisma.user.findMany();
  console.log("Users in DB:");
  updatedUsers.forEach(u => console.log(`${u.email} - ${u.role}`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
