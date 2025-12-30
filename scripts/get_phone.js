const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: {
            NOT: { phoneNumber: null }
        }
    });
    console.log(user ? user.phoneNumber : 'No phone found');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
