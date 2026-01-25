'use client';
import Link from 'next/link';
import React, {
  useCallback,
  useEffect,
  useState,
  useOptimistic,
  useMemo,
  startTransition,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaCarBattery,
  FaFileInvoice,
  FaTags,
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
  const path = usePathname();
  const router = useRouter();

  // Helper function to get initials
  const getInitials = (name: string) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<any>();
  const [storeDetail, setStoreDetail] = useState<any>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // React 19: Optimistic navigation state for instant UI feedback
  const [optimisticPath, addOptimisticPath] = useOptimistic(
    path,
    (state, newPath: string) => newPath
  );

  // React 19: Memoized navigation items for better performance
  const navigationItems = useMemo(
    () => [
      {
        href: '/',
        label: 'Dashboard',
        icon: MdDashboard,
        active: optimisticPath === '/',
      },
      {
        href: '/brands',
        label: 'Brands',
        icon: FaTags,
        active: optimisticPath === '/brands',
      },
      {
        href: '/category',
        label: 'Category',
        icon: TbCategoryPlus,
        active: optimisticPath === '/category',
      },
      {
        href: '/stock',
        label: 'Stock',
        icon: FaCarBattery,
        active: optimisticPath === '/stock',
      },
      {
        href: '/invoices',
        label: 'Invoices',
        icon: FaFileInvoice,
        active: optimisticPath === '/invoices',
      },
      {
        href: '/sales',
        label: 'Sales',
        icon: FaFileInvoice,
        active: optimisticPath === '/sales',
      },
      {
        href: '/customers',
        label: 'Customers',
        icon: FaUserFriends,
        active: optimisticPath === '/customers',
      },
      {
        href: '/warranty-check',
        label: 'Warranty Check',
        icon: FaShieldAlt,
        active: optimisticPath === '/warranty-check',
      },
    ],
    [optimisticPath]
  );

  // React 19: Memoized store initials for better performance
  const storeInitials = useMemo(() => {
    const getInitials = (name: string) => {
      if (!name) return '';
      return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .toUpperCase();
    };
    return getInitials(storeDetail?.storeName || '');
  }, [storeDetail?.storeName]);

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

  // React 19: Enhanced prefetching with better performance
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

    // React 19: More efficient prefetching with requestIdleCallback
    const prefetchAll = () => {
      routesToPrefetch.forEach((r) => {
        try {
          router.prefetch(r);
        } catch {}
      });
    };

    // React 19: Use requestIdleCallback for better performance
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(prefetchAll, { timeout: 2000 });
    } else {
      setTimeout(prefetchAll, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React 19: Optimized navigation handler with instant UI feedback
  const handleNavigation = useCallback(
    (href: string) => {
      // React 19: Wrap optimistic update in startTransition to avoid warnings
      startTransition(() => {
        // Add optimistic update for instant UI feedback
        addOptimisticPath(href);
      });

      // Close mobile menu if open
      handleMobileLinkClick();

      // Prefetch the route for faster navigation
      router.prefetch(href);
    },
    [addOptimisticPath, router]
  );

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
            {isCollapsed ? storeInitials : storeDetail?.storeName || ''}
          </span>

          {/* Navigation Links */}
          <div className='flex flex-1 flex-col space-y-2 overflow-y-auto'>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => handleNavigation(item.href)}
                  className={`sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200
                    ${
                      item.active
                        ? 'bg-[#4287f5] text-white'
                        : 'text-gray-700 hover:bg-[#4287f5] hover:text-white active:bg-[#3d79e6]'
                    }`}
                >
                  <Icon
                    className={`h-6 w-6 flex-shrink-0 transition-colors duration-200 ${
                      item.active
                        ? 'text-white'
                        : 'text-gray-600 group-hover:text-white'
                    }`}
                  />
                  <span
                    className={`ml-3 font-medium transition-all duration-300 ${
                      isCollapsed ? 'hidden' : 'block'
                    } md:${isCollapsed ? 'hidden' : 'block'}`}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
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
