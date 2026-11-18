
import { prisma } from "./src/config/prisma.js";

try {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      is_active: true,
    },
  });

  console.table(
    users.map((user) => ({
      ...user,
      id: user.id.toString(),
    }))
  );
} catch (error) {
  console.error("Error:", error.message);
} finally {
  await prisma.$disconnect();
}
