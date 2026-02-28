import React from 'react';
import Accordion from '@/components/accordion';
import Input from '@/components/customInput';
import { FiPlusSquare } from 'react-icons/fi';
import { PiMinusSquare } from 'react-icons/pi';

interface ChargingServiceSectionProps {
  chargingServices: any[];
  expandedAccordionIndex: number;
  onAccordionClick: (index: number) => void;
  onServiceChange: (index: number, field: string, value: any) => void;
  onServiceRemove: (index: number) => void;
  onServiceAdd: () => void;
}

const ChargingServiceSection: React.FC<ChargingServiceSectionProps> = ({
  chargingServices,
  expandedAccordionIndex,
  onAccordionClick,
  onServiceChange,
  onServiceRemove,
  onServiceAdd,
}) => {
  const handleServiceFieldChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const updatedServices = [...chargingServices];
    updatedServices[index] = {
      ...updatedServices[index],
      [field]: value,
    };

    // Auto-calculate total when amount changes
    if (field === 'amount') {
      updatedServices[index].total = parseFloat(value) || 0;
    }

    onServiceChange(index, field, value);
  };

  return (
    <div className='mb-4'>
      <div className='mb-3'>
        <label className='text-sm font-medium text-gray-700'>
          Charging Services
        </label>
      </div>

      {chargingServices.length === 0 ? (
        <div className='rounded-lg bg-gray-50 p-3'>
          <p className='text-sm text-gray-600'>
            Toggle charging mode to automatically create a battery service
            accordion.
          </p>
        </div>
      ) : (
        chargingServices.map((service: any, index: number) => (
          <div key={service.id} className='mb-3'>
            <Accordion
              key={service.id}
              index={index}
              title={`Service ${index + 1}: ${service.description || 'New Battery'}`}
              content={
                <div className='p-4'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <div>
                      <Input
                        type='text'
                        label='Battery Name'
                        value={service.description || ''}
                        onChange={(e) =>
                          handleServiceFieldChange(
                            index,
                            'description',
                            e.target.value
                          )
                        }
                        placeholder='Enter battery name for charging'
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type='number'
                        label='Amount to be Paid'
                        value={service.total || 0}
                        onChange={(e) =>
                          handleServiceFieldChange(
                            index,
                            'total',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        step='0.01'
                        required
                      />
                    </div>
                  </div>
                </div>
              }
              expandedAccordionIndex={expandedAccordionIndex}
              handleAccordionClick={onAccordionClick}
              addOnClick={onServiceAdd}
              removeOnClick={
                chargingServices.length > 1
                  ? () => onServiceRemove(index)
                  : undefined
              }
            />
          </div>
        ))
      )}
    </div>
  );
};

export default ChargingServiceSection;
