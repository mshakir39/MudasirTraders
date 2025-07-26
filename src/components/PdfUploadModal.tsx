// components/PdfUploadModal.tsx - Static Data Input Version
'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import Modal from './modal';
import Button from './button';
import Input from './customInput';
import Dropdown, { DropdownOption } from './dropdown';
import { FaPlus, FaTrash, FaSave } from 'react-icons/fa';

interface BatteryData {
  name: string;
  plate: string;
  ah: number;
  type?: string;
  retailPrice?: number;
  salesTax?: number;
  maxRetailPrice?: number;
}

interface PdfUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: {
    brandName: string;
    series: BatteryData[];
    salesTax: string;
  }) => void;
  brands: { label: string; value: string }[];
  categories?: { brandName: string; series: any[] }[];
}

const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  brands,
  categories,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<DropdownOption | null>(null);
  const [salesTax, setSalesTax] = useState<string>('18');
  const [batteryData, setBatteryData] = useState<BatteryData[]>([
    { name: '', plate: '', ah: 0, retailPrice: 0, maxRetailPrice: 0 }
  ]);

  const handleBrandSelect = (option: DropdownOption) => {
    setSelectedBrand(option);
  };

  const handleSalesTaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (/^\d*\.?\d*$/.test(value)) {
      setSalesTax(value);
    }
  };

  const addBatteryRow = () => {
    setBatteryData([...batteryData, { name: '', plate: '', ah: 0, retailPrice: 0, maxRetailPrice: 0 }]);
  };

  const removeBatteryRow = (index: number) => {
    if (batteryData.length > 1) {
      const newData = batteryData.filter((_, i) => i !== index);
      setBatteryData(newData);
    }
  };

  const updateBatteryData = (index: number, field: keyof BatteryData, value: string | number) => {
    const newData = [...batteryData];
    newData[index] = { ...newData[index], [field]: value };
    setBatteryData(newData);
  };

  const handleSave = () => {
    if (!selectedBrand) {
      toast.error('Please select a brand');
      return;
    }

    if (!salesTax || isNaN(Number(salesTax))) {
      toast.error('Please enter a valid sales tax percentage');
      return;
    }

    // Filter out empty rows
    const validData = batteryData.filter(item => 
      item.name.trim() && item.plate.trim() && item.ah > 0
    );

    if (validData.length === 0) {
      toast.error('Please add at least one battery entry');
      return;
    }

    const existingCategory = categories?.find(
      (cat) => cat.brandName === selectedBrand.label
    );

    if (existingCategory) {
      const confirmUpdate = window.confirm(
        `Category for "${selectedBrand.label}" already exists with ${existingCategory.series?.length || 0} series. Do you want to update it?`
      );
      
      if (!confirmUpdate) {
        return;
      }
    }

    onSuccess({
      brandName: selectedBrand.label,
      series: validData,
      salesTax,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedBrand(null);
    setSalesTax('18');
    setBatteryData([{ name: '', plate: '', ah: 0, retailPrice: 0, maxRetailPrice: 0 }]);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Battery Data Manually"
      size="large"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100">
              <FaPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Add Battery Data Manually
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Enter battery details manually for the selected brand
            </p>
          </div>

          <div className="space-y-4">
            {/* Brand Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Brand *
              </label>
              <Dropdown
                options={brands}
                onSelect={handleBrandSelect}
                placeholder="Choose a brand for this data"
                value={selectedBrand}
              />
            </div>

            {/* Sales Tax */}
            <div>
              <Input
                type="text"
                label="Sales Tax %"
                name="salesTax"
                value={salesTax}
                onChange={handleSalesTaxChange}
                placeholder="Enter sales tax percentage"
                required
              />
            </div>

            {/* Battery Data Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Battery Data *
                </label>
                <Button
                  variant="outline"
                  text="Add Row"
                  onClick={addBatteryRow}
                  icon={<FaPlus className="h-4 w-4" />}
                />
              </div>
              
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Plate</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">AH</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Retail Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Price</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batteryData.map((battery, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={battery.name}
                            onChange={(e) => updateBatteryData(index, 'name', e.target.value)}
                            placeholder="Battery name"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={battery.plate}
                            onChange={(e) => updateBatteryData(index, 'plate', e.target.value)}
                            placeholder="Plate count"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={battery.ah || ''}
                            onChange={(e) => updateBatteryData(index, 'ah', parseInt(e.target.value) || 0)}
                            placeholder="AH"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={battery.retailPrice || ''}
                            onChange={(e) => updateBatteryData(index, 'retailPrice', parseInt(e.target.value) || 0)}
                            placeholder="Retail price"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={battery.maxRetailPrice || ''}
                            onChange={(e) => updateBatteryData(index, 'maxRetailPrice', parseInt(e.target.value) || 0)}
                            placeholder="Max price"
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          {batteryData.length > 1 && (
                            <button
                              onClick={() => removeBatteryRow(index)}
                              className="text-red-600 hover:text-red-800"
                              title="Remove row"
                            >
                              <FaTrash className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              text="Cancel"
              onClick={handleClose}
            />
            <Button
              variant="fill"
              text="Save Data"
              onClick={handleSave}
              icon={<FaSave className="h-4 w-4" />}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PdfUploadModal;