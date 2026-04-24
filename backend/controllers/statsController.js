import UserModel from '../models/UserModel.js'
import ProductModel from '../models/ProductModel.js'
import OrderModel from '../models/OrderModel.js'

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const users = await UserModel.findAll();
    const products = await ProductModel.findAll({});
    const orders = await OrderModel.findAll();

    let filteredOrders = orders;
    let filteredUsers = users;
    
    if (month && year) {
      const targetMonth = parseInt(month, 10);
      const targetYear = parseInt(year, 10);
      
      filteredOrders = orders.filter(o => {
        const d = new Date(o.createdAt);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
      });
      filteredUsers = users.filter(u => {
        const d = new Date(u.createdAt);
        return d.getMonth() + 1 === targetMonth && d.getFullYear() === targetYear;
      });
    }

    const usersCount = filteredUsers.length;
    const productsCount = products.length; // usually keep product count as total available
    const ordersCount = filteredOrders.length;
    
    const completedOrders = filteredOrders.filter(o => o.status === 'completed');
    const totalRevenue = completedOrders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    
    // Tính toán lợi nhuận (Profit)
    const completedItems = await OrderModel.getCompletedOrdersWithItems();
    let filteredCompletedItems = completedItems;

    if (month && year) {
      filteredCompletedItems = completedItems.filter(item => {
        const d = new Date(item.createdAt);
        return (d.getMonth() + 1 === parseInt(month, 10)) && (d.getFullYear() === parseInt(year, 10));
      });
    }

    const totalProfit = filteredCompletedItems.reduce((sum, item) => {
      const cost = item.costPrice || 0;
      return sum + (item.itemPrice - cost) * item.quantity;
    }, 0);

    // Chart Data
    let chartData = [];
    if (month && year) {
      const dMonth = parseInt(month, 10);
      const dYear = parseInt(year, 10);
      const daysInMonth = new Date(dYear, dMonth, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const dailyOrders = filteredOrders.filter(o => new Date(o.createdAt).getDate() === i);
        const dailyCompleted = dailyOrders.filter(o => o.status === 'completed');
        const dailyRev = dailyCompleted.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        
        const dailyProfit = filteredCompletedItems
          .filter(item => new Date(item.createdAt).getDate() === i)
          .reduce((sum, item) => sum + (item.itemPrice - (item.costPrice || 0)) * item.quantity, 0);

        chartData.push({
          name: `${i}/${dMonth}`,
          revenue: dailyRev,
          profit: dailyProfit,
          orders: dailyOrders.length
        });
      }
    } else {
      const currentYear = new Date().getFullYear();
      for (let i = 1; i <= 12; i++) {
        const monthlyOrders = orders.filter(o => {
             const d = new Date(o.createdAt);
             return d.getMonth() + 1 === i && d.getFullYear() === currentYear;
        });
        const monthlyCompleted = monthlyOrders.filter(o => o.status === 'completed');
        const monthlyRev = monthlyCompleted.reduce((sum, o) => sum + Number(o.totalAmount), 0);
        
        const monthlyProfit = completedItems
          .filter(item => {
            const d = new Date(item.createdAt);
            return (d.getMonth() + 1 === i) && (d.getFullYear() === currentYear);
          })
          .reduce((sum, item) => sum + (item.itemPrice - (item.costPrice || 0)) * item.quantity, 0);

        chartData.push({
          name: `T${i}`,
          revenue: monthlyRev,
          profit: monthlyProfit,
          orders: monthlyOrders.length
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        users: usersCount,
        products: productsCount,
        orders: ordersCount,
        revenue: totalRevenue,
        profit: totalProfit,
        chartData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
}
