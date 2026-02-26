import * as React from "react";

interface TableMarketingProps {
  data: any[];
  columns: string[];
}

const headerStyle: React.CSSProperties = {
  background: "#f5f6fa",
  color: "#222",
  fontWeight: 600,
  borderBottom: "2px solid #e0e0e0",
  padding: 12,
  textAlign: "left",
};

const cellStyle: React.CSSProperties = {
  borderBottom: "1px solid #f0f0f0",
  padding: 12,
  background: "#fff",
};

const rowStyle: React.CSSProperties = {
  transition: "background 0.2s",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "separate",
  borderSpacing: 0,
  borderRadius: 12,
  overflow: "hidden",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};

const TableMarketing: React.FC<TableMarketingProps> = ({ data, columns }) => {
  return (
    <div style={{ borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={headerStyle}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, idx) => (
              <tr
                key={idx}
                style={rowStyle}
                onMouseOver={e => (e.currentTarget.style.background = "#f0f6ff")}
                onMouseOut={e => (e.currentTarget.style.background = "#fff")}
              >
                {columns.map((col) => (
                  <td key={col} style={cellStyle}>{row[col] || ""}</td>
                ))}
              </tr>
            ))
          ) : (
            <tr><td colSpan={columns.length} style={{ textAlign: "center", padding: 16, background: "#fff" }}>Không có dữ liệu</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableMarketing; 