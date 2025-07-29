import React from 'react';
import { convertDate } from '@/utils/convertTime';
import Modal from '@/components/modal';
import Table from '@/components/table';
import { ColumnDef } from '@tanstack/react-table';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const columns = React.useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: 'brandName',
      header: 'Brand',
    },
    {
      accessorKey: 'series',
      header: 'Series',
      cell: ({ row }) => {
        const details = row.original.batteryDetails;
        return details
          ? `${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
          : row.original.series;
      },
    },
    {
      accessorKey: 'productPrice',
      header: 'Price/Item',
      cell: ({ row }) => 'Rs ' + row.original.productPrice,
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
    },
    {
      accessorKey: 'warrentyCode',
      header: 'Battery Code',
    },
    {
      accessorKey: 'warrentyStartDate',
      header: 'Warrenty Start Date',
      cell: ({ row }) => {
        const { dateOnly } = convertDate(row.original.warrentyStartDate);
        return <span>{dateOnly}</span>;
      },
    },
    {
      accessorKey: 'warrentyEndDate',
      header: 'Warrenty End Date',
      cell: ({ row }) => {
        const { dateOnly } = convertDate(row.original.warrentyEndDate);
        return <span>{dateOnly}</span>;
      },
    },
    {
      accessorKey: 'totalPrice',
      header: 'Total Price',
      cell: ({ row }) => 'Rs ' + row.original.totalPrice,
    },
  ], []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Products Detail'
      size='large'
    >
      <Table
        data={data}
        columns={columns}
        enableSearch={false}
        showButton={false}
      />
    </Modal>
  );
};

export default ProductDetailModal;