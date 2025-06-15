'use client';
import React, { useState, useEffect } from 'react';

interface TableRow {
  [key: string]: string | number; // Assuming all values are either string or number
}

interface TableProps {
  headers: string[];
  data: TableRow[];
  editColumn: number;
  deleteColumn: number;
  onClickEdit: (row: TableRow) => void;
  onClickDelete: (row: TableRow) => void;
}

const Table: React.FC<TableProps> = ({
  headers,
  data,
  editColumn,
  deleteColumn,
  onClickEdit,
  onClickDelete,
}) => {
  const [uniqueData, setUniqueData] = useState(data);

  useEffect(() => {
    // If 'id' property doesn't exist in the rows, generate a unique 'id' for each row
    if (data.length > 0 && !('id' in data[0])) {
      setUniqueData(data.map((row, index) => ({ ...row, id: index })));
    }
  }, [data]);

  return (
    <table className='table'>
      <thead>
        <tr>
          {headers.map((header, index) => (
            <th key={index} className='header-cell'>
              {header}
            </th>
          ))}
          {editColumn !== -1 && <th className='header-cell'>Edit</th>}
          {deleteColumn !== -1 && <th className='header-cell'>Delete</th>}
        </tr>
      </thead>
      <tbody>
        {uniqueData.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {Object.entries(row).map(([key, value], columnIndex) => (
              <td key={`${rowIndex}-${columnIndex}`} className='data-cell'>
                {value}
              </td>
            ))}
            {editColumn !== -1 && (
              <td className='data-cell'>
                <button onClick={() => onClickEdit(row)}>Edit</button>
              </td>
            )}
            {deleteColumn !== -1 && (
              <td className='data-cell'>
                <button onClick={() => onClickDelete(row)}>Delete</button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;
