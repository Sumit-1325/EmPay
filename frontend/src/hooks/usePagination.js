import { useState, useMemo } from "react";

export function usePagination(data = [], pageSize = 10) {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage   = Math.min(Math.max(1, page), totalPages);

  const paginatedData = useMemo(
    () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
    [data, safePage, pageSize]
  );

  const goTo    = (p) => setPage(Math.min(Math.max(1, p), totalPages));
  const next    = () => goTo(safePage + 1);
  const prev    = () => goTo(safePage - 1);
  const canNext = safePage < totalPages;
  const canPrev = safePage > 1;

  return { data: paginatedData, page: safePage, totalPages, goTo, next, prev, canNext, canPrev };
}
