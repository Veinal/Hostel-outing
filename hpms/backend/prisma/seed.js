import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Create Branches
  const cse = await prisma.branch.upsert({ where: { code: 'CSE' }, update: {}, create: { name: 'Computer Science', code: 'CSE' } });
  const ece = await prisma.branch.upsert({ where: { code: 'ECE' }, update: {}, create: { name: 'Electronics', code: 'ECE' } });
  const mech = await prisma.branch.upsert({ where: { code: 'MECH' }, update: {}, create: { name: 'Mechanical', code: 'MECH' } });

  // 2. Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hpms.college' },
    update: {},
    create: {
      email: 'admin@hpms.college',
      passwordHash: 'hashed_Admin@123', // Just a placeholder for seed
      role: 'ADMIN',
      fullName: 'System Admin'
    }
  });

  const security = await prisma.user.upsert({
    where: { email: 'security@hpms.college' },
    update: {},
    create: {
      email: 'security@hpms.college',
      passwordHash: 'hashed_Security@123',
      role: 'SECURITY',
      fullName: 'Gate Security'
    }
  });

  const warden = await prisma.user.upsert({
    where: { email: 'warden@hpms.college' },
    update: {},
    create: {
      email: 'warden@hpms.college',
      passwordHash: 'hashed_Warden@123',
      role: 'WARDEN',
      fullName: 'Hostel Warden'
    }
  });

  // 3. Create Blocks & Rooms
  // Block M (BOYS)
  const blockM = await prisma.block.upsert({
    where: { name: 'M' },
    update: {},
    create: {
      name: 'M',
      gender: 'BOYS',
      wardenId: warden.id,
      floors: {
        create: [1, 2, 3].map(floorNum => ({
          number: floorNum,
          rooms: {
            create: [1, 2, 3, 4, 5].map(roomNum => {
              const rn = `M-${floorNum}0${roomNum}`;
              return { roomNumber: `${floorNum}0${roomNum}`, displayName: rn };
            })
          }
        }))
      }
    }
  });

  // Block F (GIRLS)
  const blockF = await prisma.block.upsert({
    where: { name: 'F' },
    update: {},
    create: {
      name: 'F',
      gender: 'GIRLS',
      floors: {
        create: [1, 2, 3].map(floorNum => ({
          number: floorNum,
          rooms: {
            create: [1, 2, 3, 4, 5].map(roomNum => {
              const rn = `F-${floorNum}0${roomNum}`;
              return { roomNumber: `${floorNum}0${roomNum}`, displayName: rn };
            })
          }
        }))
      }
    }
  });

  // Fetch Room M-101 for the student
  const mFloor1 = await prisma.floor.findUnique({ where: { blockId_number: { blockId: blockM.id, number: 1 } } });
  const m101 = await prisma.room.findUnique({ where: { floorId_roomNumber: { floorId: mFloor1.id, roomNumber: '101' } } });

  const student = await prisma.user.upsert({
    where: { email: 'student@hpms.college' },
    update: {},
    create: {
      email: 'student@hpms.college',
      passwordHash: 'hashed_Student@123',
      role: 'STUDENT',
      fullName: 'John Doe',
      usn: '1DS20CS001',
      roomId: m101.id,
      branch: 'CSE',
      year: '2nd'
    }
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
