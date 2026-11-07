import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";

const toDateRange = (from, to) => {
  const isValidDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value;
  };

  if (from && !isValidDate(from)) {
    throw new Error("Invalid from date. Use YYYY-MM-DD");
  }

  if (to && !isValidDate(to)) {
    throw new Error("Invalid to date. Use YYYY-MM-DD");
  }

  if (from && to && from > to) {
    throw new Error("'from' date must be before or equal to 'to' date");
  }

  const where = {};

  // Cambodia timezone: UTC+7
  if (from || to) {
    where.payment_date = {};

    if (from) {
      where.payment_date.gte = new Date(`${from}T00:00:00+07:00`);
    }

    if (to) {
      const nextDay = new Date(`${to}T00:00:00+07:00`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      where.payment_date.lt = nextDay;
    }
  }

  return where;
};

const decimalToString = (value) =>
  new Prisma.Decimal(value || 0).toFixed(2);

export const getPaymentReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const paymentWhere = toDateRange(from, to);

    // 1. Get payment summary
    const paymentSummary = await prisma.payments.aggregate({
      where: paymentWhere,
      _sum: {
        amount_paid: true,
      },
      _count: {
        id: true,
      },
    });

    const totalPaid = new Prisma.Decimal(
      paymentSummary._sum.amount_paid || 0
    );

    const totalPayments = paymentSummary._count.id || 0;

    // 2. Group payments by payment method
    const paymentMethods = await prisma.payments.groupBy({
      by: ["payment_method"],
      where: paymentWhere,
      _sum: {
        amount_paid: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        payment_method: "asc",
      },
    });

    const paymentMethodSummary = paymentMethods.map((item) => ({
      payment_method: item.payment_method,
      total_amount: decimalToString(item._sum.amount_paid),
      total_transactions: item._count.id,
    }));

    // 3. Get all sales and their payments
    // Outstanding balance is calculated across all sales,
    // independently of the selected payment date range.
    const sales = await prisma.sales.findMany({
      include: {
        customers: {
          select: {
            id: true,
            name: true,
          },
        },
        payments: {
          select: {
            amount_paid: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    let totalOutstanding = new Prisma.Decimal(0);
    let unpaidSalesCount = 0;
    let partiallyPaidSalesCount = 0;
    let fullyPaidSalesCount = 0;

    const outstandingSales = [];

    for (const sale of sales) {
      const saleTotal = new Prisma.Decimal(sale.total_amount || 0);

      const paidAmount = sale.payments.reduce(
        (sum, payment) =>
          sum.plus(new Prisma.Decimal(payment.amount_paid || 0)),
        new Prisma.Decimal(0)
      );

      const balance = Prisma.Decimal.max(
        saleTotal.minus(paidAmount),
        new Prisma.Decimal(0)
      );

      if (balance.gt(0)) {
        totalOutstanding = totalOutstanding.plus(balance);

        if (paidAmount.eq(0)) {
          unpaidSalesCount++;
        } else {
          partiallyPaidSalesCount++;
        }

        outstandingSales.push({
          sale_id: sale.id.toString(),
          customer: sale.customers?.name || "Unknown",
          total_amount: saleTotal.toFixed(2),
          paid_amount: paidAmount.toFixed(2),
          balance: balance.toFixed(2),
          created_at: sale.created_at,
        });
      } else {
        fullyPaidSalesCount++;
      }
    }

    // 4. Get recent payment transactions
    const recentPayments = await prisma.payments.findMany({
      where: paymentWhere,
      include: {
        sales: {
          select: {
            id: true,
            total_amount: true,
            customers: {
              select: {
                name: true,
              },
            },
          },
        },
        users: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      orderBy: {
        payment_date: "desc",
      },
      take: 10,
    });

    const formattedRecentPayments = recentPayments.map((payment) => ({
      id: payment.id.toString(),
      sale_id: payment.sale_id.toString(),
      customer: payment.sales?.customers?.name || "Unknown",
      amount_paid: decimalToString(payment.amount_paid),
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      received_by: payment.users?.username || null,
      note: payment.note,
    }));

    // 5. Response
    return res.status(200).json({
      success: true,
      message: "Payment report retrieved successfully",

      filters: {
        from: from || null,
        to: to || null,
      },

      summary: {
        total_paid: totalPaid.toFixed(2),
        total_payments: totalPayments,
        total_outstanding: totalOutstanding.toFixed(2),
        unpaid_sales: unpaidSalesCount,
        partially_paid_sales: partiallyPaidSalesCount,
        fully_paid_sales: fullyPaidSalesCount,
      },

      payment_methods: paymentMethodSummary,

      outstanding_sales: outstandingSales,

      recent_payments: formattedRecentPayments,
    });
  } catch (error) {
    console.error("Get Payment Report Error:", error);

    if (
      error.message.includes("Invalid from date") ||
      error.message.includes("Invalid to date") ||
      error.message.includes("'from' date")
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment report",
    });
  }
};