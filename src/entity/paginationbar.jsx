// components/PaginationBar.tsx
import { Pagination } from "antd";

export function PaginationBar({ page, pageSize, total, onChange }) {
  if (total <= pageSize) return null;
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
      <Pagination
        current={page} pageSize={pageSize} total={total}
        size="small" showTotal={(t) => `Total ${t} items`}
        onChange={onChange}
      />
    </div>
  );
}