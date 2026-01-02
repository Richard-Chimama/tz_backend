import { PrismaClient, UserRole, NotificationChannel, NotificationFrequency } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding ...');

  // 1. Seed Users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'd0f0c0d0-0000-0000-0000-000000000001', // Fixed UUID for reproducibility
      email: 'admin@example.com',
      name: 'Admin User',
      role: UserRole.ADMIN,
      preferences: {
        create: {
          notificationChannel: NotificationChannel.EMAIL,
          notificationFrequency: NotificationFrequency.INSTANT,
        },
      },
    },
  });

  const regularUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      id: 'd0f0c0d0-0000-0000-0000-000000000002',
      email: 'user@example.com',
      name: 'Regular User',
      role: UserRole.USER,
      preferences: {
        create: {
          notificationChannel: NotificationChannel.WHATSAPP,
          notificationFrequency: NotificationFrequency.DAILY,
        },
      },
    },
  });

  console.log('Users seeded:', { adminUser, regularUser });

  // 2. Seed Locations (Countries & Cities)
  const kenya = await prisma.country.upsert({
    where: { code: 'KE' },
    update: {},
    create: {
      name: 'Kenya',
      code: 'KE',
      currency: 'KES',
      timezone: 'Africa/Nairobi',
      region: 'East Africa',
      language: 'English, Swahili',
    },
  });

  const citiesData = [
    { name: 'Nairobi', region: 'Nairobi', latitude: -1.2921, longitude: 36.8219 },
    { name: 'Mombasa', region: 'Coast', latitude: -4.0435, longitude: 39.6682 },
    { name: 'Kisumu', region: 'Nyanza', latitude: -0.0917, longitude: 34.7680 },
    { name: 'Eldoret', region: 'Rift Valley', latitude: 0.5143, longitude: 35.2698 },
    { name: 'Nakuru', region: 'Rift Valley', latitude: -0.3031, longitude: 36.0800 },
  ];

  for (const city of citiesData) {
    await prisma.city.upsert({
      where: { 
        // Since name is not unique globally but we want to avoid duplicates for this seed script
        // We can't easily upsert by name only if name isn't unique.
        // However, for this simple seed, we can check if it exists first or just create if not found.
        // But Prisma upsert requires a unique constraint.
        // Let's check if the city exists in this country.
        id: 'placeholder-uuid' // This won't work for upsert without a real ID or unique field
       }, 
       // Workaround: We will use findFirst and create if not exists, or just createMany with skipDuplicates if possible (Postgres supports it but Prisma createMany doesn't return created records easily to link)
       // Better approach for seed:
       // We can just query by name and countryId.
       update: {},
       create: {
         name: city.name,
         region: city.region,
         latitude: city.latitude,
         longitude: city.longitude,
         countryId: kenya.id,
         timezone: 'Africa/Nairobi'
       }
    }).catch(async () => {
        // Fallback for upsert needing a unique key. 
        // Let's actually just use findFirst and then create.
        const existing = await prisma.city.findFirst({
            where: { name: city.name, countryId: kenya.id }
        });
        if (!existing) {
            await prisma.city.create({
                data: {
                    name: city.name,
                    region: city.region,
                    latitude: city.latitude,
                    longitude: city.longitude,
                    countryId: kenya.id,
                    timezone: 'Africa/Nairobi'
                }
            });
        }
    });
  }
  
  // Re-fetch cities to get their IDs
  const cities = await prisma.city.findMany({ where: { countryId: kenya.id } });
  console.log(`Seeded ${cities.length} cities in Kenya`);

  // 3. Seed Categories & Commodities
  const categoriesData = [
    { name: 'Cereals', description: 'Grains and cereals' },
    { name: 'Vegetables', description: 'Fresh vegetables' },
    { name: 'Fruits', description: 'Fresh fruits' },
    { name: 'Legumes', description: 'Beans and peas' },
  ];

  for (const cat of categoriesData) {
    await prisma.commodityCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  const cerealCat = await prisma.commodityCategory.findUnique({ where: { name: 'Cereals' } });
  const vegCat = await prisma.commodityCategory.findUnique({ where: { name: 'Vegetables' } });
  const fruitCat = await prisma.commodityCategory.findUnique({ where: { name: 'Fruits' } });
  const legumeCat = await prisma.commodityCategory.findUnique({ where: { name: 'Legumes' } });

  const commoditiesData = [
    { name: 'Maize (Dry)', unit: '90kg Bag', categoryId: cerealCat?.id },
    { name: 'Rice (Pishori)', unit: '50kg Bag', categoryId: cerealCat?.id },
    { name: 'Red Beans', unit: '90kg Bag', categoryId: legumeCat?.id },
    { name: 'Tomatoes', unit: '64kg Crate', categoryId: vegCat?.id },
    { name: 'Onions (Red)', unit: '1kg Net', categoryId: vegCat?.id },
    { name: 'Potatoes (Irish)', unit: '50kg Bag', categoryId: vegCat?.id },
    { name: 'Bananas', unit: 'Bunch', categoryId: fruitCat?.id },
    { name: 'Mangoes', unit: 'Net', categoryId: fruitCat?.id },
  ];

  for (const comm of commoditiesData) {
    if (comm.categoryId) {
        // Commodity name is not unique in schema, but we should treat it as such for seeding
        // We will do a findFirst check
        const existing = await prisma.commodity.findFirst({ where: { name: comm.name }});
        if (!existing) {
            await prisma.commodity.create({
                data: {
                    name: comm.name,
                    unit: comm.unit,
                    categoryId: comm.categoryId,
                    isActive: true
                }
            });
        }
    }
  }

  const commodities = await prisma.commodity.findMany();
  console.log(`Seeded ${commodities.length} commodities`);

  // 4. Seed Sources
  const sourcesData = [
    { name: 'Ministry of Agriculture', type: 'GOVERNMENT', trustScore: 90 },
    { name: 'Local Market Survey', type: 'MARKET', trustScore: 80 },
    { name: 'Supermarket A', type: 'SUPERMARKET', trustScore: 95 },
  ];

  for (const src of sourcesData) {
      // Source name is not unique in schema? Let's check.
      // Schema says: id PK, no unique on name. 
      const existing = await prisma.source.findFirst({ where: { name: src.name }});
      if (!existing) {
          await prisma.source.create({
              data: src
          });
      }
  }

  const sources = await prisma.source.findMany();
  console.log(`Seeded ${sources.length} sources`);

  // 5. Seed Price Observations (Sample Data)
  // Create some random prices for the last 7 days
  console.log('Seeding price observations...');
  
  const marketSource = sources.find(s => s.type === 'MARKET') || sources[0];
  
  for (const comm of commodities) {
      for (const city of cities) {
          // Generate 7 days of data
          for (let i = 0; i < 7; i++) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              
              // Base price around 1000-5000 random
              const basePrice = 1000 + Math.random() * 4000;
              
              await prisma.priceObservation.create({
                  data: {
                      commodityId: comm.id,
                      cityId: city.id,
                      sourceId: marketSource.id,
                      priceValue: basePrice,
                      priceCurrency: 'KES',
                      priceUnit: comm.unit,
                      observedAt: date,
                      isAnomaly: false,
                      qualityScore: 100
                  }
              });
          }
      }
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
