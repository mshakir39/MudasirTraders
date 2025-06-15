import React from 'react';
import { convertDate } from '@/utils/convertTime';

const Modal = React.lazy(() => import('@/components/modal'));
const DataGridDemo = React.lazy(() => import('@/components/dataGrid'));

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
}

const productsColumns = [
  {
    id: 0,
    field: 'brandName',
    headerName: 'Brand',
    width: 150,
  },
  {
    id: 1,
    field: 'series',
    headerName: 'Series',
    width: 250,
    renderCell: (item: any) => {
      const details = item?.row?.batteryDetails;
      return details
        ? `${details.name} (${details.plate}, ${details.ah}AH${details.type ? `, ${details.type}` : ''})`
        : item.row.series;
    },
  },
  {
    id: 2,
    field: 'productPrice',
    headerName: 'Price/Item',
    width: 150,
    renderCell: (item: any) => 'Rs ' + item?.row?.productPrice,
  },
  {
    id: 3,
    field: 'quantity',
    headerName: 'Quantity',
    width: 150,
  },
  {
    id: 4,
    field: 'warrentyCode',
    headerName: 'Battery Code',
    width: 150,
  },
  {
    id: 5,
    field: 'warrentyStartDate',
    headerName: 'Warrenty Start Date',
    width: 180,
    renderCell: (item: any) => {
      const { dateOnly } = convertDate(item?.row?.warrentyStartDate);
      return <span>{dateOnly}</span>;
    },
  },
  {
    id: 6,
    field: 'warrentyEndDate',
    headerName: 'Warrenty End Date',
    width: 180,
    renderCell: (item: any) => {
      const { dateOnly } = convertDate(item?.row?.warrentyEndDate);
      return <span>{dateOnly}</span>;
    },
  },
  {
    id: 7,
    field: 'totalPrice',
    headerName: 'Total Price',
    width: 150,
    renderCell: (item: any) => 'Rs ' + item?.row.totalPrice,
  },
];

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title='Products Detail'
    >
      <DataGridDemo
        rows={data}
        columns={productsColumns}
        showButton={false}
      />
    </Modal>
  );
};

export default ProductDetailModal;