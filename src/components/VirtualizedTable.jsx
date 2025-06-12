// Lista virtualizada optimizada para grandes conjuntos de datos
import React, { useState } from 'react';
import { TableVirtuoso } from 'react-virtuoso';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';

// Componente de tabla virtualizada para manejo eficiente de grandes listas
const VirtualizedTable = ({
  data,
  columns,
  rowHeight = 53,
  tableHeight = 400,
  onRowClick
}) => {
  return (
    <Paper style={{ height: tableHeight, width: '100%' }}>
      <TableVirtuoso
        data={data}
        totalCount={data.length}
        components={{
          Scroller: React.forwardRef((props, ref) => (
            <TableContainer component={Paper} {...props} ref={ref} />
          )),
          Table: (props) => <Table {...props} style={{ borderCollapse: 'separate' }} />,
          TableHead,
          TableRow: ({ item: _item, ...props }) => (
            <TableRow 
              {...props} 
              hover 
              onClick={onRowClick ? () => onRowClick(_item) : undefined}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            />
          ),
          TableBody,
        }}
        fixedHeaderContent={() => (
          <TableRow>
            {columns.map((column) => (
              <TableCell 
                key={column.id} 
                style={{ 
                  width: column.width,
                  fontWeight: 'bold',
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}
                align={column.align || 'left'}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        )}
        itemContent={(index, item) => (
          <>
            {columns.map((column) => (
              <TableCell 
                key={column.id} 
                style={{ width: column.width }}
                align={column.align || 'left'}
              >
                {column.renderCell ? column.renderCell(item) : item[column.id]}
              </TableCell>
            ))}
          </>
        )}
      />
    </Paper>
  );
};

export default VirtualizedTable;
