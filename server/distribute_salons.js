const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Distributing salons to users...");

  // 1. Get the users
  const adminUser = await prisma.user.findUnique({ where: { email: 'mikwanart7@gmail.com' } });
  const ownerUser1 = await prisma.user.findUnique({ where: { email: 'mikenart57@gmail.com' } });
  const ownerUser2 = await prisma.user.findUnique({ where: { email: 'pennyekuba7@gmail.com' } });

  if (!ownerUser1 || !ownerUser2 || !adminUser) {
    console.error("One or more required users were not found in the database. Please ensure they have logged in at least once.");
    return;
  }

  // 2. Set Roles
  await prisma.user.update({ where: { id: adminUser.id }, data: { role: 'ADMIN' } });
  await prisma.user.update({ where: { id: ownerUser1.id }, data: { role: 'SALON_OWNER' } });
  await prisma.user.update({ where: { id: ownerUser2.id }, data: { role: 'SALON_OWNER' } });

  // 3. Get all salons
  const salons = await prisma.salon.findMany({ orderBy: { createdAt: 'asc' } });
  
  if (salons.length === 0) {
    console.log("No salons found in the database.");
    return;
  }

  console.log(`Found ${salons.length} salons.`);

  // 4. Assign ownership
  let assignedToOwner1 = 0;
  let assignedToOwner2 = 0;

  for (let i = 0; i < salons.length; i++) {
    const salon = salons[i];
    if (i < 3) {
      await prisma.salon.update({
        where: { id: salon.id },
        data: { ownerId: ownerUser1.id }
      });
      assignedToOwner1++;
      console.log(`Assigned '${salon.name}' to ${ownerUser1.email}`);
    } else {
      await prisma.salon.update({
        where: { id: salon.id },
        data: { ownerId: ownerUser2.id }
      });
      assignedToOwner2++;
      console.log(`Assigned '${salon.name}' to ${ownerUser2.email}`);
    }
  }

  console.log(`\nSuccessfully assigned ${assignedToOwner1} salons to mikenart57@gmail.com`);
  console.log(`Successfully assigned ${assignedToOwner2} salons to pennyekuba7@gmail.com`);
  console.log(`mikwanart7@gmail.com is set as ADMIN.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
