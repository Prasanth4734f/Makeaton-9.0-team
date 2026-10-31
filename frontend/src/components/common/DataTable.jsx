import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { clsx } from 'clsx';

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function DataTable({
  columns = [],
  data = [],
  emptyComponent = null,
  loading = false,
  onRowClick = null,
  rowKey = 'id',
  pageSize: defaultPageSize = 10,
  showPagination = true,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = useMemo(
    () => data.slice((page - 1) * pageSize, page * pageSize),
    [data, page, pageSize]
  );

  // Reset page when data changes
  useMemo(() => setPage(1), [data.length]);

  return (
    <div className="flex flex-col space-y-3">
      {/* Table Shell */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50/90 border-b border-slate-100">
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={clsx(
                      'px-5 py-3 text-[11px] font-bold tracking-wider text-slate-500 uppercase whitespace-nowrap',
                      col.className
                    )}
                    style={{ width: col.width }}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      <span className="text-xs font-medium text-slate-400">Loading ledger records...</span>
                    </div>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-6">
                    {emptyComponent || (
                      <div className="text-center text-xs font-medium text-slate-400 py-12">
                        No records match the current criteria.
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((row, ri) => (
                  <tr
                    key={row[rowKey] ?? ri}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={clsx(
                      'group transition-colors duration-100',
                      onRowClick ? 'cursor-pointer hover:bg-slate-50/80' : 'hover:bg-slate-50/50'
                    )}
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={clsx(
                          'px-5 py-3.5 text-xs text-slate-700 whitespace-nowrap align-middle',
                          col.cellClassName
                        )}
                      >
                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modern Pagination Footer */}
      {showPagination && data.length > 0 && (
        <div className="flex flex-col gap-3 px-1 py-1 sm:flex-row sm:items-center sm:justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>of <strong className="font-bold text-slate-800">{data.length}</strong> total records</span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="mr-2 font-medium text-slate-600">
              Page <strong className="font-bold text-slate-900">{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="flex items-center gap-1">
              <PagBtn onClick={() => setPage(1)} disabled={page === 1} title="First page">
                <ChevronsLeft className="h-3.5 w-3.5" />
              </PagBtn>
              <PagBtn onClick={() => setPage(p => p - 1)} disabled={page === 1} title="Previous page">
                <ChevronLeft className="h-3.5 w-3.5" />
              </PagBtn>
              <PagBtn onClick={() => setPage(p => p + 1)} disabled={page === totalPages} title="Next page">
                <ChevronRight className="h-3.5 w-3.5" />
              </PagBtn>
              <PagBtn onClick={() => setPage(totalPages)} disabled={page === totalPages} title="Last page">
                <ChevronsRight className="h-3.5 w-3.5" />
              </PagBtn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PagBtn({ children, disabled, onClick, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
    >
      {children}
    </button>
  );
}
