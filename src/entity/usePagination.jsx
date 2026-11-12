import React from "react";

export function usePagination(defaultPageSize = 10) {
  console.log("hook called");
  const [page, setPage] = React.useState(1);
  const [pageSize] = React.useState(defaultPageSize);
  const [total, setTotal] = React.useState(0);

  return {
    page,
    pageSize,
    total,
    setTotal,
    setPage,
    reset: () => setPage(1),
  };
}