import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Passw0rd!';

const demoUsers = [
  { email: 'manager@transitops.io', name: 'Fiona Fleet', role: Role.FLEET_MANAGER },
  { email: 'driver@transitops.io', name: 'Dave Driver', role: Role.DRIVER },
  { email: 'safety@transitops.io', name: 'Sam Safety', role: Role.SAFETY_OFFICER },
  { email: 'finance@transitops.io', name: 'Fay Finance', role: Role.FINANCIAL_ANALYST },
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log('Seeding database...');

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const u of demoUsers) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash },
    });
  }
  console.log(`Seeded ${demoUsers.length} demo users (password: ${DEMO_PASSWORD})`);

  // Vehicles
  const vehicleData = [
    { regNo: 'TRK-001', name: 'Volvo FH16', type: 'Heavy Truck', maxLoadKg: 25000, odometer: 145000, acquisitionCost: 120000 },
    { regNo: 'TRK-002', name: 'Scania R500', type: 'Heavy Truck', maxLoadKg: 24000, odometer: 98000, acquisitionCost: 110000 },
    { regNo: 'VAN-101', name: 'Ford Transit', type: 'Van', maxLoadKg: 1500, odometer: 62000, acquisitionCost: 45000 },
    { regNo: 'VAN-102', name: 'Mercedes Sprinter', type: 'Van', maxLoadKg: 2000, odometer: 38000, acquisitionCost: 52000 },
    { regNo: 'TRK-003', name: 'MAN TGX', type: 'Heavy Truck', maxLoadKg: 26000, odometer: 210000, acquisitionCost: 130000 },
  ];
  const vehicles: Array<{ id: string }> = [];
  for (const v of vehicleData) {
    vehicles.push(
      await prisma.vehicle.upsert({
        where: { regNo: v.regNo },
        update: {},
        create: v,
      }),
    );
  }
  console.log(`Seeded ${vehicles.length} vehicles`);

  // Drivers
  const driverData = [
    { name: 'Marcus Reed', licenseNo: 'DL-88213', licenseCategory: 'CE', licenseExpiry: daysFromNow(400), contact: '+1-555-0101', safetyScore: 95 },
    { name: 'Elena Torres', licenseNo: 'DL-77410', licenseCategory: 'CE', licenseExpiry: daysFromNow(220), contact: '+1-555-0102', safetyScore: 88 },
    { name: 'Ravi Kumar', licenseNo: 'DL-66129', licenseCategory: 'C1', licenseExpiry: daysFromNow(-15), contact: '+1-555-0103', safetyScore: 72 },
    { name: 'Nina Petrov', licenseNo: 'DL-55098', licenseCategory: 'CE', licenseExpiry: daysFromNow(90), contact: '+1-555-0104', safetyScore: 90 },
  ];
  const drivers: Array<{ id: string }> = [];
  for (const d of driverData) {
    drivers.push(
      await prisma.driver.upsert({
        where: { licenseNo: d.licenseNo },
        update: {},
        create: d,
      }),
    );
  }
  console.log(`Seeded ${drivers.length} drivers`);

  // Sample completed trip + fuel + expense + maintenance (only if no trips yet)
  const tripCount = await prisma.trip.count();
  if (tripCount === 0) {
    const manager = await prisma.user.findUnique({ where: { email: 'manager@transitops.io' } });
    await prisma.trip.create({
      data: {
        source: 'Chicago, IL',
        destination: 'Detroit, MI',
        vehicleId: vehicles[0].id,
        driverId: drivers[0].id,
        createdById: manager?.id,
        cargoWeight: 18000,
        plannedDistance: 460,
        finalOdometer: 145460,
        fuelConsumed: 155,
        revenue: 4200,
        status: 'COMPLETED',
      },
    });
    await prisma.fuelLog.create({
      data: { vehicleId: vehicles[0].id, liters: 155, cost: 250 },
    });
    await prisma.expense.create({
      data: { vehicleId: vehicles[0].id, category: 'Tolls', amount: 85 },
    });
    console.log('Seeded sample trip + fuel + expense');
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
