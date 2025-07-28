import React, {
  FunctionComponent,
  ReactNode,
  useEffect,
  useState,
  useRef,
} from 'react';

export interface DropdownOption {
  label: string;
  value: any;
  icon?: JSX.Element;
}

interface DropdownProps {
  className?: string;
  placeholder?: string;
  options: DropdownOption[];
  onSelect: (option: DropdownOption) => void;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  value?: DropdownOption | null;
}

const DropdownComponent: FunctionComponent<DropdownProps> = ({
  options,
  onSelect,
  placeholder = 'Options',
  name,
  className,
  defaultValue,
  disabled = false,
  required = false,
  value,
}) => {
  const [selectedOption, setSelectedOption] = useState<
    DropdownOption | null
  >(value ?? null);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelectOption = (event: any, option: DropdownOption) => {
    event.preventDefault();
    event.stopPropagation();
    onSelect(option);
    setSelectedOption(option);
    setInputValue(option.label);
    setIsOpen(false);
  };

  useEffect(() => {
    if (defaultValue) {
      const option = options.find(
        (opt) => opt.value === defaultValue || opt.label === defaultValue
      );
      if (option) {
        setSelectedOption(option);
        setInputValue(option.label);
      } else {
        setSelectedOption(null);
        setInputValue(defaultValue);
      }
    } else {
      setSelectedOption(null);
      setInputValue('');
    }
  }, [defaultValue, options]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        disabled={disabled}
        className={`${disabled && 'pointer-events-none cursor-no-drop text-gray-400'} z-10 inline-flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium 
        ${
          selectedOption && selectedOption.label
            ? 'text-black'
            : 'text-gray-400 '
        }
         hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {selectedOption && selectedOption.label
          ? selectedOption.label
          : placeholder}
      </button>

      <input
        type='text'
        className='pointer-events-none absolute inset-0 z-0 h-full w-full opacity-0'
        name={name}
        value={inputValue}
        required={required}
        readOnly
      />
      
      {isOpen && (
        <div className='absolute left-0 z-50 mt-1 max-h-[225px] w-full origin-top-right divide-y divide-gray-100 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none'>
          {options.length > 0 ? (
            options.map((option, index) => (
              <div key={index} className='relative'>
                <button
                  name={name}
                  className='group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 hover:bg-[#5b4eea] hover:text-white'
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSelectOption(event, option);
                    setIsOpen(false);
                  }}
                >
                  {option.icon && <span className='mr-2'>{option.icon}</span>}
                  <span className=''>{option.label}</span>
                </button>
              </div>
            ))
          ) : (
            <div className='group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-500'>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DropdownComponent;

export const DropdownOption: FunctionComponent<DropdownOption> = () => null;
