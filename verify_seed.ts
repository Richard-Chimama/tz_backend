import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userCount = await prisma.user.count();
  const commodityCount = await prisma.commodity.count();
  const priceCount = await prisma.priceObservation.count();
  
  console.log('Verification Results:');
  console.log(`Users: ${userCount}`);
  console.log(`Commodities: ${commodityCount}`);
  console.log(`Price Observations: ${priceCount}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
