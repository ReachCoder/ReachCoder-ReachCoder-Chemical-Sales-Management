
import { prisma } from "../config/prisma.js";

// GET /api/sales-report
export const getSalesReport = async (req, res) => {
  try {
    const { from, to } = req.query;

    // Validate date format
    const isValidDate = (value) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
      }

      const date = new Date(`${value}T00:00:00+07:00`);

      return (
        !Number.isNaN(date.getTime()) &&
        date.toLocaleDateString("en-CA", {
          timeZone: "Asia/Phnom_Penh",
        }) === value
      );
    };

    if (from && !isValidDate(from)) {
      return res.status(400).json({
        success: false,
        message: "Invalid from date. Use YYYY-MM-DD",
      });
    }

    if (to && !isValidDate(to)) {
      return res.status(400).json({
        success: false,
        message: "Invalid to date. Use YYYY-MM-DD",
      });
    }

    if (from && to && from > to) {
      return res.status(400).json({
        success: false,
        message: "from date cannot be after to date",
      });
    }

    // Cambodia timezone: UTC+7
    const where = {};

    if (from || to) {
      where.created_at = {};

      if (from) {
        where.created_at.gte = new Date(
          `${from}T00:00:00+07:00`
        );
      }

      if (to) {
        const endDate = new Date(`${to}T00:00:00+07:00`);
        endDate.setUTCDate(endDate.getUTCDate() + 1);

        where.created_at.lt = endDate;
      }
    }

    // Get sales
    const sales = await prisma.sales.findMany({
      where,
      select: {
        id: true,
        sale_number: true,
        total_amount: true,
        created_at: true,
        customers: {
          select: {
            id: true,
            name: true,
          },
        },
        sale_items: {
          select: {
            product_id: true,
            product_name_snapshot: true,
            quantity: true,
            unit_price: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    let totalRevenue = 0;
    let totalItemsSold = 0;

    const dailySalesMap = new Map();
    const productSalesMap = new Map();

    for (const sale of sales) {
      const amount = Number(sale.total_amount);

      totalRevenue += amount;

      // Daily sales in Cambodia timezone
      const date = new Date(sale.created_at).toLocaleDateString(
        "en-CA",
        {
          timeZone: "Asia/Phnom_Penh",
        }
      );

      if (!dailySalesMap.has(date)) {
        dailySalesMap.set(date, {
          date,
          totalSales: 0,
          revenue: 0,
        });
      }

      const daily = dailySalesMap.get(date);

      daily.totalSales += 1;
      daily.revenue += amount;

      // Product sales
      for (const item of sale.sale_items) {
        totalItemsSold += item.quantity;

        const productId = item.product_id.toString();

        if (!productSalesMap.has(productId)) {
          productSalesMap.set(productId, {
            product_id: productId,
            product_name: item.product_name_snapshot,
            quantity_sold: 0,
            revenue: 0,
          });
        }

        const product = productSalesMap.get(productId);

        product.quantity_sold += item.quantity;
        product.revenue +=
          Number(item.unit_price) * item.quantity;
      }
    }

    const dailySales = Array.from(dailySalesMap.values()).sort(
      (a, b) => a.date.localeCompare(b.date)
    );

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.quantity_sold - a.quantity_sold)
      .slice(0, 10);

    const averageSale =
      sales.length > 0 ? totalRevenue / sales.length : 0;

    return res.status(200).json({
      success: true,
      filters: {
        from: from || null,
        to: to || null,
        timezone: "Asia/Phnom_Penh",
      },
      data: {
        summary: {
          totalSales: sales.length,
          totalRevenue: totalRevenue.toFixed(2),
          averageSale: averageSale.toFixed(2),
          totalItemsSold,
        },
        dailySales: dailySales.map((item) => ({
          ...item,
          revenue: item.revenue.toFixed(2),
        })),
        topProducts: topProducts.map((item) => ({
          ...item,
          revenue: item.revenue.toFixed(2),
        })),
        recentSales: sales.slice(0, 10).map((sale) => ({
          id: sale.id.toString(),
          sale_number: sale.sale_number,
          customer_name: sale.customers?.name || null,
          total_amount: sale.total_amount.toString(),
          created_at: sale.created_at.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Get sales report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate sales report",
      error: error.message,
    });
  }
};
