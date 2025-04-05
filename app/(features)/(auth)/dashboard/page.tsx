'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import type { IconType } from 'react-icons';
import {
  FiUsers,
  FiBox,
  FiTruck,
  FiUserCheck,
  FiArrowUp,
  FiArrowDown,
  FiDollarSign,
  FiShoppingCart,
} from 'react-icons/fi';
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
} from 'recharts';

// Define interfaces for data types
interface MetricData {
  id: string;
  title: string;
  count: number;
  icon: string;
}

interface SalesData {
  name: string;
  value: number;
}

interface MarginData {
  name: string;
  sales: number;
  purchase: number;
  margin: number;
}

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
  icon: IconType;
  change?: string;
  changeType?: 'increase' | 'decrease';
  color: string;
}) => {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
      className="flex flex-col rounded-lg bg-white p-6 shadow-md"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`rounded-full p-3 ${color} bg-opacity-10`}>
          <Icon size={24} className={color} />
        </div>
        {change && (
          <div
            className={`flex items-center text-sm ${
              changeType === 'increase' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {changeType === 'increase' ? (
              <FiArrowUp size={14} className="mr-1" />
            ) : (
              <FiArrowDown size={14} className="mr-1" />
            )}
            {change}
          </div>
        )}
      </div>
      <h3 className="mb-1 text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </motion.div>
  );
};

export default function Dashboard() {
  // Use client-side only rendering for the loading state
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [marginData, setMarginData] = useState<MarginData[]>([]);

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
    return <div className="min-h-screen bg-gray-50 pt-16 md:ml-[280px]" />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-16 md:ml-[280px]">
        <div className="size-12 animate-spin rounded-full border-4 border-b-red-500 border-l-blue-300 border-r-red-300 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 pt-16 md:ml-[280px] md:px-6">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-screen-2xl"
      >
        {/* Page title */}
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500">Welcome to AESPT Admin Dashboard</p>
        </motion.div>

        {/* Stats cards */}
        <motion.div
          variants={itemVariants}
          className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {metrics.map(metric => (
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
        <motion.div variants={itemVariants} className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Monthly Sales Chart */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-800">
                <FiShoppingCart className="mr-2 text-blue-500" /> Monthly Sales
              </h2>
              <span className="flex items-center text-sm font-medium text-green-500">
                <FiArrowUp size={14} className="mr-1" /> 12.5%
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          <div className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center text-lg font-semibold text-gray-800">
                <FiDollarSign className="mr-2 text-green-500" /> Profit Margin
              </h2>
              <span className="flex items-center text-sm font-medium text-green-500">
                <FiArrowUp size={14} className="mr-1" /> 8.7%
              </span>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={marginData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
