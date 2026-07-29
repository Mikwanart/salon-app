import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all data...');
  await prisma.review.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.stylist.deleteMany({});
  await prisma.salon.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Database wiped successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
