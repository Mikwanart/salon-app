import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany();
    console.log("All users:", users.map(u => u.name));
    
    // Find Michael Nartey
    const targetUser = users.find(u => u.name.includes("Michael"));
    if (!targetUser) {
        console.log("Could not find Michael in the database.");
        return;
    }
    
    console.log(`Found target user: ${targetUser.name} (${targetUser.id})`);

    // Assign all salons to Michael
    const updated = await prisma.salon.updateMany({
        data: { ownerId: targetUser.id }
    });
    
    console.log(`Success! ${targetUser.name} is now the owner of ${updated.count} salons.`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
