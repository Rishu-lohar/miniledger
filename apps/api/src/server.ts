
import Fastify from "fastify";
import cors from "@fastify/cors";
import { z } from "zod";
import { PrismaClient, LoanStatus } from "@prisma/client";

const app = Fastify({ logger: true });
const prisma = new PrismaClient();

const otpStore = new Map<string, string>();

async function start() {
  await app.register(cors, { origin: true });

  // Health check
  app.get("/health", async () => ({
    success: true,
    message: "MiniLedger API is running",
  }));

  // Generate mock OTP
  app.post("/api/auth/send-otp", async (request, reply) => {
    const schema = z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/),
    });

    const result = schema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        message: "Enter a valid 10-digit Indian mobile number",
      });
    }

    const { phone } = result.data;
    const otp = String(Math.floor(100000 + Math.random() * 900000));

    otpStore.set(phone, otp);
    app.log.info(`Mock OTP for ${phone}: ${otp}`);

    return reply.send({
      success: true,
      message: "OTP generated. Check server logs.",
    });
  });

  // Verify OTP and find/create user
  app.post("/api/auth/verify-otp", async (request, reply) => {
    const schema = z.object({
      phone: z.string().regex(/^[6-9]\d{9}$/),
      otp: z.string().regex(/^\d{6}$/),
    });

    const result = schema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        message: "Invalid phone number or OTP format",
      });
    }

    const { phone, otp } = result.data;

    if (otpStore.get(phone) !== otp) {
      return reply.code(401).send({
        success: false,
        message: "Invalid OTP",
      });
    }

    otpStore.delete(phone);

    const user = await prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone },
      select: { id: true, phone: true },
    });

    return reply.send({
      success: true,
      message: "OTP verified successfully",
      user,
    });
  });

  // Create a loan
  app.post("/api/loans", async (request, reply) => {
    const schema = z.object({
      userId: z.string().min(1),
      friendName: z.string().trim().min(2).max(100),
      amount: z.number().positive(),
      dueDate: z.iso.date(),
    });

    const result = schema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        message: "Invalid loan data",
        errors: result.error.issues,
      });
    }

    const { userId, friendName, amount, dueDate } = result.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return reply.code(404).send({
        success: false,
        message: "User not found. Verify OTP first.",
      });
    }

    const loan = await prisma.loan.create({
      data: {
        userId,
        friendName,
        amount,
        dueDate: new Date(`${dueDate}T00:00:00.000Z`),
      },
    });

    return reply.code(201).send({ success: true, data: loan });
  });

  // List loans for a user
  app.get("/api/loans", async (request, reply) => {
    const querySchema = z.object({ userId: z.string().min(1) });
    const result = querySchema.safeParse(request.query);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const loans = await prisma.loan.findMany({
      where: { userId: result.data.userId },
      orderBy: { dueDate: "asc" },
    });

    return reply.send({ success: true, data: loans });
  });

  // Mark a loan as repaid
  app.patch("/api/loans/:id/repay", async (request, reply) => {
    const paramsSchema = z.object({ id: z.string().min(1) });
    const params = paramsSchema.safeParse(request.params);

    if (!params.success) {
      return reply.code(400).send({
        success: false,
        message: "Invalid loan ID",
      });
    }

    const existingLoan = await prisma.loan.findUnique({
      where: { id: params.data.id },
    });

    if (!existingLoan) {
      return reply.code(404).send({
        success: false,
        message: "Loan not found",
      });
    }

    const loan = await prisma.loan.update({
      where: { id: params.data.id },
      data: {
        status: LoanStatus.REPAID,
        repaidAt: new Date(),
      },
    });

    return reply.send({ success: true, data: loan });
  });

  // Summary: total lent, repaid and overdue
  app.get("/api/summary", async (request, reply) => {
    const querySchema = z.object({ userId: z.string().min(1) });
    const result = querySchema.safeParse(request.query);

    if (!result.success) {
      return reply.code(400).send({
        success: false,
        message: "userId query parameter is required",
      });
    }

    const userId = result.data.userId;
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    const [allLoans, repaidLoans, overdueLoans] = await Promise.all([
      prisma.loan.aggregate({
        where: { userId },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: { userId, status: LoanStatus.REPAID },
        _sum: { amount: true },
      }),
      prisma.loan.aggregate({
        where: {
          userId,
          status: LoanStatus.PENDING,
          dueDate: { lt: today },
        },
        _sum: { amount: true },
      }),
    ]);

    return reply.send({
      success: true,
      data: {
        totalLent: allLoans._sum.amount ?? 0,
        totalRepaid: repaidLoans._sum.amount ?? 0,
        overdueAmount: overdueLoans._sum.amount ?? 0,
      },
    });
  });

  await app.listen({ port: 3000, host: "0.0.0.0" });
}

start().catch((error) => {
  app.log.error(error);
  process.exit(1);
});

async function shutdown() {
  await app.close();
  await prisma.$disconnect();
}

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
