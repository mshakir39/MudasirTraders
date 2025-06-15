'use client';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { FaCarBattery, FaFileInvoice, FaTags } from 'react-icons/fa6';
import { FaUserFriends } from 'react-icons/fa';
import { TbCategoryPlus } from 'react-icons/tb';
import { IoMdSettings } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
import { MdDashboard } from 'react-icons/md';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import { POST } from '@/utils/api';
import { toast } from 'react-toastify';
import { getStoreDetail } from '@/getData/getStoreDetail';
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

const Sidebar = ({ className }: any) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<any>();
  const [storeDetail, setStoreDetail] = useState<any>();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const path = usePathname();

  // Get initials from store name
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const getStoreDetailRecursive = useCallback(async () => {
    const store = await getStoreDetail();
    if (store) {
      setStoreDetail(store.length > 0 ? store[0] : {});
    } else {
      getStoreDetailRecursive(); // Call itself only if store is falsy
    }
  }, []);

  useEffect(() => {
    const fetchStoreDetail = async () => {
      let store;
      let attempts = 0;
      while (!store && attempts < 5) {
        // Add a limit to the number of attempts
        store = await getStoreDetail();
        attempts++;
      }
      console.log('store', store);
      if (store) {
        setStoreDetail(store.length > 0 ? store[0] : '');
      } else {
        // Handle the error case where the data couldn't be fetched
      }
    };
    fetchStoreDetail();
  }, []);

  // Check if each item is active based on the path
  const isActiveDashboard = path === '/';
  const isActiveStock = path === '/stock';
  const isActiveInvoices = path === '/invoices';
  const isActiveBrands = path === '/brands';
  const isActiveCategory = path === '/category';
  // const isActiveScrapStock = path === '/scrapStock';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      let data = { ...storeDetail };
      data.storeName = storeData.storeName;
      console.log('data', data);
      const response: any = await POST('api/storeDetail', data);

      if (response?.message) {
        toast.success(response?.message);
        getStoreDetailRecursive();
        // await revalidatePathCustom('/stock');
      }

      if (response?.error) {
        toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating data:', error);
    }
  };

  const handleChange = React.useCallback((e: any) => {
    const { name, value } = e.target;
    setStoreData((prevStore: any) => ({ ...prevStore, [name]: value }));
  }, []);

  return (
    <div
      className={`${path === '/signIn' ? 'hidden' : 'relative flex flex-col'} 
        h-svh bg-white shadow-lg transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className='absolute -right-3 top-9 z-50 rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100'
      >
        {isCollapsed ? (
          <RiMenuUnfoldLine className='h-4 w-4 text-[#4287f5]' />
        ) : (
          <RiMenuFoldLine className='h-4 w-4 text-[#4287f5]' />
        )}
      </button>

      <div className='flex h-full flex-col justify-between p-4'>
        {/* Header */}
        <div className='flex flex-col'>
          <span
            className={`mb-8 text-center font-semibold text-[#4287f5] transition-all duration-300
            ${isCollapsed ? 'text-base' : 'text-xl'}`}
          >
            {isCollapsed
              ? getInitials(storeDetail?.storeName || '')
              : storeDetail?.storeName || ''}
          </span>

          {/* Navigation Links */}
          <div className='flex flex-col space-y-2'>
            <Link
              href='/'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveDashboard
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <MdDashboard
                className={`h-6 w-6 ${
                  isActiveDashboard
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Dashboard
              </span>
            </Link>

            <Link
              href='/brands'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveBrands
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <FaTags
                className={`h-6 w-6 ${
                  isActiveBrands
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Brands
              </span>
            </Link>

            <Link
              href='/category'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveCategory
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <TbCategoryPlus
                className={`h-6 w-6 ${
                  isActiveCategory
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Category
              </span>
            </Link>

            <Link
              href='/stock'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveStock
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <FaCarBattery
                className={`h-6 w-6 ${
                  isActiveStock
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Stock
              </span>
            </Link>

            <Link
              href='/invoices'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveInvoices
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <FaFileInvoice
                className={`h-6 w-6 ${
                  isActiveInvoices
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Invoices
              </span>
            </Link>

            <Link
              href='/sales'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  path === '/sales'
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <FaFileInvoice
                className={`h-6 w-6 ${
                  path === '/sales'
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Sales
              </span>
            </Link>

            <Link
              href='/customers'
              className={`sidebarItem flex items-center rounded-lg p-3 transition-all duration-200
                ${
                  path === '/customers'
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white'
                }`}
            >
              <FaUserFriends
                className={`h-6 w-6 ${
                  path === '/customers'
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
              >
                Customers
              </span>
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='flex flex-col space-y-2'>
          <button
            onClick={() => setIsModalOpen(true)}
            className='sidebarItem flex items-center rounded-lg p-3 text-gray-700 transition-all duration-200 hover:bg-[#4287f5] hover:text-white'
          >
            <IoMdSettings className='h-6 w-6 text-gray-600 group-hover:text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
            >
              Settings
            </span>
          </button>

          <button
            onClick={() => {
              Cookies.remove('userId');
              signOut({ callbackUrl: '/signIn' });
            }}
            className='sidebarItem flex items-center rounded-lg p-3 text-gray-700 transition-all duration-200 hover:bg-[#4287f5] hover:text-white'
          >
            <IoLogOut className='h-6 w-6 text-gray-600 group-hover:text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${isCollapsed ? 'hidden' : 'block'}`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isModalOpen && (
        <Modal
          parentClass='hidden'
          dialogPanelClass='!w-[90%] md:!w-[60%] lg:!w-[40%]'
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title='Store Detail'
        >
          <form onSubmit={handleSubmit}>
            <div className='mt-4 flex w-full flex-col gap-2'>
              <Input
                type='text'
                label='Store Name'
                name='storeName'
                onChange={handleChange}
                required
              />
              <Button
                className='w-fit'
                variant='fill'
                text='Save'
                type='submit'
                isPending={isLoading}
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Sidebar;
