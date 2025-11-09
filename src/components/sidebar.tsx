  'use client';
import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaCarBattery,
  FaFileInvoice,
  FaTags,
  FaBox,
  FaShoppingCart,
  FaUsers,
  FaChartBar,
  FaList,
  FaShieldAlt,
} from 'react-icons/fa';
import { FaUserFriends } from 'react-icons/fa';
import { TbCategoryPlus } from 'react-icons/tb';
import { IoMdSettings } from 'react-icons/io';
import { IoLogOut } from 'react-icons/io5';
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
import { MdDashboard } from 'react-icons/md';
import { HiX } from 'react-icons/hi';
import Modal from '@/components/modal';
import Button from '@/components/button';
import Input from '@/components/customInput';
import { POST } from '@/utils/api';
import { toast } from 'react-toastify';
import { getStoreDetail } from '@/getData/getStoreDetail';
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

const Sidebar = ({
  className,
  onCollapseChange,
}: {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<any>();
  const [storeDetail, setStoreDetail] = useState<any>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const path = usePathname();
  const router = useRouter();

  // Get initials from store name
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  useEffect(() => {
    const fetchStoreDetail = async () => {
      try {
        const store = await getStoreDetail();
        if (store && Array.isArray(store) && store.length > 0) {
          setStoreDetail(store[0]);
        } else {
          setStoreDetail({ storeName: 'Store' }); // Fallback
        }
      } catch (error) {
        setStoreDetail({ storeName: 'Store' }); // Fallback
      }
    };

    fetchStoreDetail();
  }, []); // Empty dependency array - only run once on mount

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  // Prefetch commonly used routes to speed up first navigations
  useEffect(() => {
    const routesToPrefetch = [
      '/',
      '/category',
      '/sales',
      '/stock',
      '/customers',
      '/brands',
      '/invoices',
      '/warranty-check',
    ];

    const prefetchAll = () => {
      routesToPrefetch.forEach((r) => {
        try {
          router.prefetch(r);
        } catch {}
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAll);
    } else {
      setTimeout(prefetchAll, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle clicks outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar');
      const target = event.target as Node;

      if (isMobileMenuOpen && sidebar && !sidebar.contains(target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden'; // Prevent body scroll when menu is open
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Check if each item is active based on the path
  const isActiveDashboard = path === '/';
  const isActiveStock = path === '/stock';
  const isActiveInvoices = path === '/invoices';
  const isActiveBrands = path === '/brands';
  const isActiveCategory = path === '/category';
  const isActiveSales = path === '/sales';
  const isActiveCustomers = path === '/customers';
  const isActiveWarrantyCheck = path === '/warranty-check';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      setIsLoading(true);
      let data = { ...storeDetail };
      data.storeName = storeData.storeName;
      const response: any = await POST('api/storeDetail', data);

      if (response?.message) {
        toast.success(response?.message);
        // Refresh store detail after successful update
        const updatedStore = await getStoreDetail();
        if (
          updatedStore &&
          Array.isArray(updatedStore) &&
          updatedStore.length > 0
        ) {
          setStoreDetail(updatedStore[0]);
        }
      }

      if (response?.error) {
        toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {}
  };

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setStoreData((prevStore: any) => ({ ...prevStore, [name]: value }));
    },
    []
  );

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  const sidebarContent = (
    <>
      {/* Mobile Header with Close Button */}
      <div className='flex items-center justify-between p-4 md:hidden'>
        <span className='text-lg font-semibold text-[#4287f5]'>
          {storeDetail?.storeName || 'Store'}
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className='rounded-full p-2 hover:bg-gray-100'
        >
          <HiX className='h-5 w-5 text-gray-600' />
        </button>
      </div>

      <div className='flex h-full flex-col justify-between p-4'>
        {/* Header - Desktop Only */}
        <div className='flex flex-col'>
          <span
            className={`mb-8 hidden text-center font-semibold text-[#4287f5] transition-all duration-300 md:block
            ${isCollapsed ? 'text-base' : 'text-xl'}`}
          >
            {isCollapsed
              ? getInitials(storeDetail?.storeName || '')
              : storeDetail?.storeName || ''}
          </span>

          {/* Navigation Links */}
          <div className='flex flex-1 flex-col space-y-2 overflow-y-auto'>
            <Link
              href='/'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveDashboard
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <MdDashboard
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveDashboard
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Dashboard
              </span>
            </Link>

            <Link
              href='/brands'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveBrands
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaTags
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveBrands
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Brands
              </span>
            </Link>

            <Link
              href='/category'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveCategory
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <TbCategoryPlus
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveCategory
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Category
              </span>
            </Link>

            <Link
              href='/stock'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveStock
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaCarBattery
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveStock
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Stock
              </span>
            </Link>

            <Link
              href='/invoices'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveInvoices
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaFileInvoice
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveInvoices
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Invoices
              </span>
            </Link>

            <Link
              href='/sales'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveSales
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaFileInvoice
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveSales
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Sales
              </span>
            </Link>

            <Link
              href='/customers'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveCustomers
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaUserFriends
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveCustomers
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Customers
              </span>
            </Link>

            <Link
              href='/warranty-check'
              onClick={handleMobileLinkClick}
              className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                ${
                  isActiveWarrantyCheck
                    ? 'bg-[#4287f5] text-white'
                    : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                }`}
            >
              <FaShieldAlt
                className={`h-6 w-6 flex-shrink-0 ${
                  isActiveWarrantyCheck
                    ? 'text-white'
                    : 'text-gray-600 group-hover:text-white'
                }`}
              />
              <span
                className={`ml-3 font-medium transition-all duration-300 ${
                  isCollapsed ? 'hidden' : 'block'
                } md:${isCollapsed ? 'hidden' : 'block'}`}
              >
                Warranty Check
              </span>
            </Link>
          </div>
        </div>

        {/* Footer Actions */}
        <div className='mt-auto flex flex-col space-y-2'>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 text-gray-700 transition-all duration-200 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
          >
            <IoMdSettings className='h-6 w-6 flex-shrink-0 text-gray-600 group-hover:text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${
                isCollapsed ? 'hidden' : 'block'
              } md:${isCollapsed ? 'hidden' : 'block'}`}
            >
              Settings
            </span>
          </button>

          <button
            onClick={() => {
              Cookies.remove('userId');
              signOut({ callbackUrl: '/signIn' });
            }}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 text-gray-700 transition-all duration-200 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
          >
            <IoLogOut className='h-6 w-6 flex-shrink-0 text-gray-600 group-hover:text-white' />
            <span
              className={`ml-3 font-medium transition-all duration-300 ${
                isCollapsed ? 'hidden' : 'block'
              } md:${isCollapsed ? 'hidden' : 'block'}`}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );

  if (path === '/signIn') {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className='fixed left-4 top-4 z-50 rounded-lg bg-white p-2 shadow-lg md:hidden'
      >
        <RiMenuUnfoldLine className='h-6 w-6 text-[#4287f5]' />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className='fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden' />
      )}

      {/* Desktop Sidebar */}
      <div
        id='sidebar'
        className={`
          ${className}
          hidden h-svh bg-white shadow-lg
          transition-all duration-300 ease-in-out md:fixed md:left-0 md:top-0 md:z-30 md:flex md:flex-col
          ${isCollapsed ? 'w-20' : 'w-64'}
          scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        `}
      >
        {/* Desktop Toggle Button */}
        <button
          onClick={() => {
            const newCollapsedState = !isCollapsed;
            setIsCollapsed(newCollapsedState);
            onCollapseChange?.(newCollapsedState);
          }}
          className='absolute -right-3 top-9 z-50 hidden rounded-full bg-white p-1.5 shadow-md hover:bg-gray-100 md:block'
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine className='h-4 w-4 text-[#4287f5]' />
          ) : (
            <RiMenuFoldLine className='h-4 w-4 text-[#4287f5]' />
          )}
        </button>

        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        id='sidebar'
        className={`
          fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-white shadow-lg transition-transform duration-300 ease-in-out md:hidden
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {sidebarContent}
      </div>

      {/* Settings Modal */}
      {isModalOpen && (
        <Modal
          parentClass='hidden'
          dialogPanelClass='!w-[95%] sm:!w-[90%] md:!w-[60%] lg:!w-[40%] max-w-md mx-auto'
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title='Store Detail'
        >
          <form onSubmit={handleSubmit}>
            <div className='mt-4 flex w-full flex-col gap-4'>
              <Input
                type='text'
                label='Store Name'
                name='storeName'
                onChange={handleChange}
                required
              />
              <Button
                className='w-full sm:w-fit'
                variant='fill'
                text='Save'
                type='submit'
                isPending={isLoading}
              />
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};

export default Sidebar;
