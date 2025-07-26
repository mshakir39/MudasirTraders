import React, {
  FunctionComponent,
  ReactNode,
  useEffect,
  useState,
  useRef,
} from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

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
      <Menu
        as='div'
        className={`relative inline-block w-full text-left ${className} `}
      >
        <div>
          <Menu.Button
            disabled={disabled}
            className={`${disabled && 'pointer-events-none cursor-no-drop text-gray-400'} z-10 inline-flex w-full rounded-md border-b-2 bg-white px-1  py-2 text-sm font-medium 
            ${
              selectedOption && selectedOption.label
                ? 'text-black'
                : 'text-gray-400 '
            }
             hover:bg-gray-400/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
          >
            {selectedOption && selectedOption.label
              ? selectedOption.label
              : placeholder}
          </Menu.Button>

          <input
            type='text'
            className='pointer-events-none absolute inset-0 z-0 h-full w-full opacity-0'
            name={name}
            value={inputValue}
            required={required}
          />
        </div>
        <Transition
          as={Fragment}
          enter='transition ease-out duration-100'
          enterFrom='transform opacity-0 scale-95'
          enterTo='transform opacity-100 scale-100'
          leave='transition ease-in duration-75'
          leaveFrom='transform opacity-100 scale-100'
          leaveTo='transform opacity-0 scale-95'
        >
          <Menu.Items className='absolute left-0 z-20 mt-2 max-h-[225px] w-fit origin-top-right divide-y divide-gray-100 overflow-auto rounded-md bg-white shadow-lg ring-1 ring-black/5 focus:outline-none'>
            {options.map((option, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <div className='relative'>
                    <button
                      name={name}
                      className={`${
                        active ? 'bg-[#5b4eea] text-white ' : 'text-gray-900'
                      } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      onClick={(event) => handleSelectOption(event, option)}
                    >
                      {option.icon && <span className='mr-2'>{option.icon}</span>}
                      <span className=''>{option.label}</span>
                    </button>
                  </div>
                )}
              </Menu.Item>
            ))}
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  );
};

export default DropdownComponent;

export const DropdownOption: FunctionComponent<DropdownOption> = () => null;
