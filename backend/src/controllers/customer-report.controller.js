import { Prisma } from "../../generated/prisma/index.js";
import { prisma } from "../config/prisma.js";

const money = (value) =>
  new Prisma.Decimal(value || 0);

const formatMoney = (value) =>
  money(value).toFixed(2);

const getDateRange = (from, to) => {
  const validDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  };

  if (from && !validDate(from)) {
    throw new Error("Invalid from date. Use YYYY-MM-DD");
  }

  if (to && !validDate(to)) {
    throw new Error("Invalid to date. Use YYYY-MM-DD");
  }

  if (from && to && from > to) {
    throw new Error("'from' date must be before or equal to 'to' date");
  }

  const where = {};

  if (from || to) {
    where.created_at = {};

    if (from) {
      where.created_at.gte = new Date(`${from}T00:00:00+07:00`);
    }

    if (to) {
      const nextDay = new Date(`${to}T00:00:00+07:00`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      where.created_at.lt = nextDay;
    }
  }

  return where;
};

export const getCustomerReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    const saleWhere = getDateRange(from, to);

    const customers = await prisma.customers.findMany({
      select: {
        id: true,
        name: true,
        sales: {
          where: saleWhere,
          select: {
            id: true,
            total_amount: true,
            created_at: true,
            payments: {
              select: {
                amount_paid: true,
              },
            },
          },
          orderBy: {
            created_at: "desc",
          },
        },
      },
    });

    let totalSales = 0;
    let totalRevenue = money(0);
    let totalPaid = money(0);
    let totalOutstanding = money(0);

    const customerReports = customers.map((customer) => {
      let customerRevenue = money(0);
      let customerPaid = money(0);
      let customerOutstanding = money(0);

      for (const sale of customer.sales) {
        const saleTotal = money(sale.total_amount);

        const paid = sale.payments.reduce(
          (sum, payment) =>
            sum.plus(money(payment.amount_paid)),
          money(0)
        );

        const balance = Prisma.Decimal.max(
          saleTotal.minus(paid),
          money(0)
        );

        customerRevenue = customerRevenue.plus(saleTotal);
        customerPaid = customerPaid.plus(paid);
        customerOutstanding = customerOutstanding.plus(balance);
      }

      totalSales += customer.sales.length;
      totalRevenue = totalRevenue.plus(customerRevenue);
      totalPaid = totalPaid.plus(customerPaid);
      totalOutstanding = totalOutstanding.plus(
        customerOutstanding
      );

      return {
        customer_id: customer.id.toString(),
        customer_name: customer.name,
        total_sales: customer.sales.length,
        total_purchased: formatMoney(customerRevenue),
        total_paid: formatMoney(customerPaid),
        outstanding_balance: formatMoney(customerOutstanding),
        last_purchase: customer.sales[0]?.created_at || null,
      };
    });

    const activeCustomers = customerReports.filter(
      (customer) => customer.total_sales > 0
    ).length;

    const topCustomers = [...customerReports]
      .filter((customer) => customer.total_sales > 0)
      .sort(
        (a, b) =>
          Number(b.total_purchased) -
          Number(a.total_purchased)
      )
      .slice(0, 10);

    const recentPurchases = customers
      .flatMap((customer) =>
        customer.sales.map((sale) => ({
          sale_id: sale.id.toString(),
          customer_id: customer.id.toString(),
          customer_name: customer.name,
          total_amount: formatMoney(sale.total_amount),
          created_at: sale.created_at,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.created_at) - new Date(a.created_at)
      )
      .slice(0, 10);

    return res.status(200).json({
      success: true,
      message: "Customer report retrieved successfully",

      filters: {
        from: from || null,
        to: to || null,
      },

      summary: {
        total_customers: customers.length,
        active_customers: activeCustomers,
        customers_without_purchases:
          customers.length - activeCustomers,
        total_sales: totalSales,
        total_revenue: formatMoney(totalRevenue),
        total_paid: formatMoney(totalPaid),
        total_outstanding: formatMoney(totalOutstanding),
      },

      top_customers: topCustomers,

      customer_details: customerReports,

      recent_purchases: recentPurchases,
    });
  } catch (error) {
    console.error("Get Customer Report Error:", error);

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
      message: "Failed to retrieve customer report",
    });
  }
};