import React, { useMemo, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel, GridFilterModel } from '@mui/x-data-grid';
import { Box, Typography, InputAdornment, IconButton, Tooltip, Chip, Menu, MenuItem, Divider } from '@mui/material';
import { Search, FilterList, Download, MoreVert, Refresh, Columns } from '@mui/icons-material';
import { useDebounce } from '../../hooks/useDebounce';
import { useTheme } from '@mui/material';

export default function DataTable({
  columns,
  rows,
  loading = false,
  totalRows,
  paginationMode = 'client',
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onSortChange,
  onFilterChange,
  onRowClick,
  onExport,
  toolbarTitle,
  searchable = true,
  filterable = true,
  exportable = false,
  rowActions,
  getRowId = (row) => row.id,
  density = 'standard',
  autoHeight = false,
  maxHeight = 600,
  disableSelection = false,
  checkboxSelection = false,
  selectedRows = [],
  onSelectionChange,
}) {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize });
  const [sortModel, setSortModel] = useState([]);
  const [filterModel, setFilterModel] = useState({ items: [], linkOperator: 'and' });
  const [searchText, setSearchText] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();

  const debouncedSearch = useDebounce(searchText, 300);
  const [searchTextRef, setSearchTextRef] = useState(searchText);

  const handlePaginationChange = useCallback((model) => {
    setPaginationModel(model);
    onPageChange?.(model);
  }, [onPageChange]);

  const handleSortChange = useCallback((model) => {
    setSortModel(model);
    onSortChange?.(model);
  }, [onSortChange]);

  const handleFilterChange = useCallback((model) => {
    setFilterModel(model);
    onFilterChange?.(model);
  }, [onFilterChange]);

  const handleColumnVisibilityChange = useCallback((field, visible) => {
    setColumnVisibility((prev) => ({ ...prev, [field]: !visible }));
  }, []);

  const visibleColumns = useMemo(() =>
    columns.map((col) => ({
      ...col,
      hide: columnVisibility[col.field] === true,
    }))
  , [columns, columnVisibility]);

  const renderToolbar = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', px: 1, py: 1 }}>
      {toolbarTitle && <Typography variant="h6" sx={{ flexGrow: 1, mr: 2, fontWeight: 600 }}>{toolbarTitle}</Typography>}
      {searchable && (
        <Box sx={{ width: { sm: 300, xs: '100%' } }}>
          <Box
            component="span"
            sx={{
              position: 'relative',
              width: '100%',
              '& .MuiInputBase-root': { borderRadius: 2 },
            }}
          >
            <InputAdornment position="start">
              <Search color="action" sx={{ mr: 1 }} />
            </InputAdornment>
            <input
              type="text"
              placeholder="Cari..."
              value={searchTextRef}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchTextRef(e.target.value);
              }}
              sx={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                fontSize: '0.875rem',
                '&:focus': { outline: 'none', borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)' },
              }}
            />
          </Box>
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }} />
      {filterable && (
        <Tooltip title="Filter">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="filter">
            <FilterList />
          </IconButton>
        </Tooltip>
      )}
      {exportable && (
        <Tooltip title="Export">
          <IconButton onClick={onExport} aria-label="export">
            <Download />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Refresh">
        <IconButton onClick={() => window.location.reload()} aria-label="refresh">
          <Refresh />
        </IconButton>
      </Tooltip>
      <Tooltip title="Kolom">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="columns">
          <Columns />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const menuItems = useMemo(() => [
    ...columns.filter(c => !c.hideByDefault).map(c => (
      <MenuItem key={c.field} onClick={() => handleColumnVisibilityChange(c.field, columnVisibility[c.field])}>
        <Chip
          label={c.headerName}
          size="small"
          color={columnVisibility[c.field] ? 'default' : 'primary'}
          variant="outlined"
          sx={{ mr: 1 }}
        >
          {c.headerName}
        </Chip>
      </MenuItem>
    )),
    <Divider />,
    <MenuItem onClick={() => columns.forEach(c => handleColumnVisibilityChange(c.field, false))}>
      Sembunyikan semua
    </MenuItem>,
    <MenuItem onClick={() => columns.forEach(c => handleColumnVisibilityChange(c.field, true))}>
      Tampilkan semua
    </MenuItem>,
  ], [columns, columnVisibility, handleColumnVisibilityChange]);

  const renderToolbar = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', px: 1, py: 1 }}>
      {toolbarTitle && <Typography variant="h6" sx={{ flexGrow: 1, mr: 2, fontWeight: 600 }}>{toolbarTitle}</Typography>}
      {searchable && (
        <Box sx={{ width: { sm: 300, xs: '100%' } }}>
          <Box
            component="span"
            sx={{
              position: 'relative',
              width: '100%',
              '& .MuiInputBase-root': { borderRadius: 2 },
            }}
          >
            <InputAdornment position="start">
              <Search color="action" sx={{ mr: 1 }} />
            </InputAdornment>
            <input
              type="text"
              placeholder="Cari..."
              value={searchTextRef}
              onChange={(e) => setSearchTextRef(e.target.value)}
              sx={{
                width: '100%',
                padding: '8px 12px 8px 40px',
                border: '1px solid #e0e0e0',
                borderRadius: 2,
                fontSize: '0.875rem',
                '&:focus': { outline: 'none', borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)' },
              }}
            />
          </Box>
        </Box>
      )}
      <Box sx={{ flexGrow: 1 }} />
      {filterable && (
        <Tooltip title="Filter">
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="filter">
            <FilterList />
          </IconButton>
        </Tooltip>
      )}
      {exportable && (
        <Tooltip title="Export">
          <IconButton onClick={onExport} aria-label="export">
            <Download />
          </IconButton>
        </Tooltip>
      )}
      <Tooltip title="Refresh">
        <IconButton onClick={() => window.location.reload()} aria-label="refresh">
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const visibleColumns = useMemo(() => columns.map((col) => ({
    ...col,
    hide: columnVisibility[col.field] === true,
  })), [columns, columnVisibility]);

  return (
    <Box 
      sx={{ 
        width: '100%', 
        border: '1px solid #e0e0e0', 
        borderRadius: 2, 
        overflow: 'hidden', 
        backgroundColor: 'background.paper',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}
    >
      <Box 
        sx={{ 
          borderBottom: '1px solid #e0e0e0', 
          backgroundColor: '#fafafa' 
        }}
      >
        {renderToolbar()}
        <DataGrid
          rows={rows}
          columns={visibleColumns}
          loading={loading}
          rowCount={totalRows ?? (paginationMode === 'server' ? undefined : rows.length)}
          paginationMode={paginationMode}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationChange}
          pageSizeOptions={pageSizeOptions}
          sortModel={sortModel}
          onSortModelChange={handleSortChange}
          filterModel={filterModel}
          onFilterModelChange={handleFilterChange}
          onRowClick={onRowClick}
          getRowId={getRowId}
          density={density}
          autoHeight={autoHeight}
          maxHeight={maxHeight}
          disableSelection={disableSelection}
          checkboxSelection={checkboxSelection}
          selectedRows={selectedRows}
          onSelectionModelChange={onSelectionChange}
          components={{
            Toolbar: () => null,
            NoRowsOverlay: () => (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, px: 3, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>Tidak ada data</Typography>
                <Typography variant="body2" color="text.secondary">Coba ubah filter atau kata kunci pencarian</Typography>
              </Box>
            ),
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': { 
              backgroundColor: '#f8fafc', 
              borderBottom: '1px solid rgba(226, 232, 240, 0.6)', 
              '& .MuiDataGrid-columnHeader': { 
                fontWeight: 600, 
                fontSize: '0.75rem', 
                textTransform: 'uppercase', 
                letterSpacing: '0.05em', 
                color: '#64748b', 
                padding: '14px 16px' 
              } 
            },
            '& .MuiDataGrid-cell': { 
              borderBottom: '1px solid rgba(226, 232, 240, 0.4)', 
              padding: '14px 16px', 
              fontSize: '0.875rem', 
            },
            '& .MuiDataGrid-row': { 
              transition: 'background-color 0.1s ease', 
              '&:hover': { backgroundColor: 'rgba(13, 110, 253, 0.02)' },
              '&.MuiDataGrid-row--selected': { 
                backgroundColor: 'rgba(13, 110, 253, 0.06)', 
                '&:hover': { backgroundColor: 'rgba(13, 110, 253, 0.1)' } 
              }, 
            },
            '& .MuiDataGrid-virtualScroller': { 
              backgroundColor: '#fff' 
            }
          }}
        />
      </Box>
    </Box>
  );
}