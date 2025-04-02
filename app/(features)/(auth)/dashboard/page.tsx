"use client";

import { useState, useEffect } from "react";
import {
  FiUsers,
  FiBox,
  FiTruck,
  FiUserCheck,
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiShoppingCart,
  FiShoppingBag,
} from "react-icons/fi";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { motion } from "framer-motion";

// Mock data for charts
const salesData = [
  { name: "Jan", value: 4000 },
  { name: "Feb", value: 3000 },
  { name: "Mar", value: 5000 },
  { name: "Apr", value: 2780 },
  { name: "May", value: 1890 },
  { name: "Jun", value: 2390 },
  { name: "Jul", value: 3490 },
  { name: "Aug", value: 4000 },
  { name: "Sep", value: 2000 },
  { name: "Oct", value: 2780 },
  { name: "Nov", value: 1890 },
  { name: "Dec", value: 3490 },
];

const purchaseData = [
  { name: "Jan", value: 3000 },
  { name: "Feb", value: 2000 },
  { name: "Mar", value: 4000 },
  { name: "Apr", value: 1780 },
  { name: "May", value: 890 },
  { name: "Jun", value: 1390 },
  { name: "Jul", value: 2490 },
  { name: "Aug", value: 3000 },
  { name: "Sep", value: 1000 },
  { name: "Oct", value: 1780 },
  { name: "Nov", value: 890 },
  { name: "Dec", value: 2490 },
];

const marginData = [
  { name: "Jan", sales: 4000, purchase: 3000, margin: 1000 },
  { name: "Feb", sales: 3000, purchase: 2000, margin: 1000 },
  { name: "Mar", sales: 5000, purchase: 4000, margin: 1000 },
  { name: "Apr", sales: 2780, purchase: 1780, margin: 1000 },
  { name: "May", sales: 1890, purchase: 890, margin: 1000 },
  { name: "Jun", sales: 2390, purchase: 1390, margin: 1000 },
  { name: "Jul", sales: 3490, purchase: 2490, margin: 1000 },
  { name: "Aug", sales: 4000, purchase: 3000, margin: 1000 },
  { name: "Sep", sales: 2000, purchase: 1000, margin: 1000 },
  { name: "Oct", sales: 2780, purchase: 1780, margin: 1000 },
  { name: "Nov", sales: 1890, purchase: 890, margin: 1000 },
  { name: "Dec", sales: 3490, purchase: 2490, margin: 1000 },
];

const topProductsData = [
  { name: "Engine Parts", value: 400 },
  { name: "Brake System", value: 300 },
  { name: "Electrical", value: 300 },
  { name: "Suspension", value: 200 },
  { name: "Body Parts", value: 100 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

// Stat card component
const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  color,
}: {
  title: string;
  value: string;
  icon: any;
  change?: string;
  changeType?: "increase" | "decrease";
  color: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-lg shadow-md p-6 flex flex-col"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
          <Icon size={24} className={color} />
        </div>
        {change && (
          <div
            className={`flex items-center text-sm ${
              changeType === "increase" ? "text-green-500" : "text-red-500"
            }`}
          >
            {changeType === "increase" ? (
              <FiArrowUp size={14} className="mr-1" />
            ) : (
              <FiArrowDown size={14} className="mr-1" />
            )}
            {change}
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </motion.div>
  );
};

export default function Dashboard() {
  // Use client-side only rendering for the loading state
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [marginData, setMarginData] = useState<any[]>([]);

  // Fetch dashboard metrics from API
  const fetchDashboardMetrics = async () => {
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard metrics');
      }
      const data = await response.json();
      setMetrics(data.metrics);
      setSalesData(data.salesData);
      setMarginData(data.marginData);
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle client-side mounting and data fetching
  useEffect(() => {
    setMounted(true);
    fetchDashboardMetrics();
  }, []);

  // Get icon component based on icon name
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'inventory':
        return FiBox;
      case 'salesman':
        return FiUserCheck;
      case 'business':
        return FiUsers;
      case 'local_shipping':
        return FiTruck;
      default:
        return FiBox;
    }
  };

  // Get color based on metric id
  const getColorForMetric = (id: string) => {
    switch (id) {
      case 'products':
        return 'text-blue-500';
      case 'users':
        return 'text-purple-500';
      case 'customers':
        return 'text-green-500';
      case 'suppliers':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 },
    },
  };

  // Return a simple loading state during server-side rendering
  if (!mounted) {
    return <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16"></div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen md:ml-[280px] pt-16">
        <div className="w-12 h-12 rounded-full border-4 border-t-blue-500 border-b-red-500 border-l-blue-300 border-r-red-300 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 md:ml-[280px] pt-16 px-4 md:px-6 py-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-screen-2xl mx-auto"
      >
        {/* Page title */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome to AESPT Admin Dashboard</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {metrics.map((metric) => (
            <StatCard
              key={metric.id}
              title={metric.title}
              value={metric.count.toString()}
              icon={getIconComponent(metric.icon)}
              color={getColorForMetric(metric.id)}
            />
          ))}
        </motion.div>

        {/* Sales, Purchase, and Margin Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Monthly Sales Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiShoppingCart className="mr-2 text-blue-500" /> Monthly Sales
              </h2>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <FiArrowUp size={14} className="mr-1" /> 12.5%
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Margin Chart */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiDollarSign className="mr-2 text-green-500" /> Profit Margin
              </h2>
              <span className="text-sm font-medium text-green-500 flex items-center">
                <FiArrowUp size={14} className="mr-1" /> 8.7%
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marginData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" name="Sales" fill="#3B82F6" />
                  <Bar dataKey="purchase" name="Purchase" fill="#EF4444" />
                  <Bar dataKey="margin" name="Margin" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Commenting out the Monthly Purchase and Top Products graphs for now */}
        {/* 
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                <FiShoppingBag className="mr-2 text-red-500" /> Monthly
                Purchases
              </h2>
              <span className="text-sm font-medium text-red-500 flex items-center">
                <FiArrowDown size={14} className="mr-1" /> 3.2%
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={purchaseData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorPurchase"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#EF4444"
                    fillOpacity={1}
                    fill="url(#colorPurchase)"
                    activeDot={{ r: 8 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                Top Product Categories
              </h2>
              <p className="text-sm text-gray-500">Based on sales volume</p>
            </div>
            <div className="h-80 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topProductsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {topProductsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        */}
      </motion.div>
    </div>
  );
}
