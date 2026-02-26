import * as React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface ChartMarketingProps {
  type: "bar" | "pie" | "line";
  data: any[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28BFE", "#FF6699"];

const ChartMarketing: React.FC<ChartMarketingProps> = ({ type, data }) => {
  if (type === "bar") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="blogs" fill="#0088FE" name="Blogs" />
          <Bar dataKey="banners" fill="#00C49F" name="Banners" />
          <Bar dataKey="reviews" fill="#FFBB28" name="Reviews" />
          <Bar dataKey="supports" fill="#FF8042" name="Supports" />
        </BarChart>
      </ResponsiveContainer>
    );
  }
  if (type === "pie") {
    return (
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
            labelLine={false} // Thêm dòng này để tắt đường nối
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }
  if (type === "line") {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="blogs" stroke="#0088FE" name="Blogs" />
          <Line type="monotone" dataKey="banners" stroke="#00C49F" name="Banners" />
          <Line type="monotone" dataKey="reviews" stroke="#FFBB28" name="Reviews" />
          <Line type="monotone" dataKey="supports" stroke="#FF8042" name="Supports" />
        </LineChart>
      </ResponsiveContainer>
    );
  }
  return null;
};

export default ChartMarketing; 