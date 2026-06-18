import 'dotenv/config'
import { PrismaClient, Role } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})

async function main() {
  const password = await bcrypt.hash('admin1234', 10)

  await prisma.user.upsert({
    where: { email: 'admin@repair.com' },
    update: {},
    create: {
      name: 'Administrator',
      email: 'admin@repair.com',
      password,
      role: Role.ADMIN,
      isActive: true,
    },
  })

  const branches = ['สาขาเจ้าฟ้า', 'สาขาถลาง', 'สาขาหลัก']
  for (const name of branches) {
    const existing = await prisma.branch.findFirst({ where: { name } })
    if (!existing) await prisma.branch.create({ data: { name } })
  }

  console.log('Seed completed')
  console.log('  email   : admin@repair.com')
  console.log('  password: admin1234')
  console.log('  branches:', branches.join(', '))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
