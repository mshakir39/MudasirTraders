'use client';
import Link from 'next/link';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES, NAVIGATION_ITEMS } from '@/constants/routes';
import {
  FaCarBattery,
  FaFileInvoice,
  FaTags,
  FaShieldAlt,
} from 'react-icons/fa';
import { FaHandshake, FaUserFriends, FaRobot } from 'react-icons/fa';
import { FaCalendarAlt, FaStar } from 'react-icons/fa';
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
import { signOut } from 'next-auth/react';
import Cookies from 'js-cookie';

interface SidebarProps {
  className?: string;
  onCollapseChange?: (collapsed: boolean) => void;
  basePath?: string;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  active: boolean;
}

const ACTIVE_STYLE: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.25)',
  borderLeft: '4px solid white',
  color: 'white',
};

const INACTIVE_STYLE: React.CSSProperties = {
  color: 'white',
};

const Sidebar = ({
  className,
  onCollapseChange,
  basePath = '',
}: SidebarProps) => {
  const path = usePathname();
  const cleanPath =
    basePath && path?.startsWith(basePath) ? path.slice(basePath.length) : path;
  const router = useRouter();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [storeData, setStoreData] = useState<any>({});
  const [storeDetail, setStoreDetail] = useState<any>();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  const handleMobileLinkClick = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  const navigationItems = [
    {
      href: ROUTES.DASHBOARD,
      label: 'Dashboard',
      icon: MdDashboard,
      active:
        cleanPath === '/dashboard' || cleanPath === '/' || cleanPath === '',
    },
    {
      href: ROUTES.BRANDS,
      label: 'Brands',
      icon: FaTags,
      active: cleanPath === '/brands' || cleanPath === '/brands/',
    },
    {
      href: ROUTES.CATEGORY,
      label: 'Category',
      icon: TbCategoryPlus,
      active: cleanPath === '/category' || cleanPath === '/category/',
    },
    {
      href: ROUTES.STOCK,
      label: 'Stock',
      icon: FaCarBattery,
      active: cleanPath === '/stock' || cleanPath === '/stock/',
    },
    {
      href: ROUTES.INVOICES,
      label: 'Invoices',
      icon: FaFileInvoice,
      active: cleanPath === '/invoices' || cleanPath === '/invoices/',
    },
    {
      href: ROUTES.SALES,
      label: 'Sales',
      icon: FaFileInvoice,
      active: cleanPath === '/sales' || cleanPath === '/sales/',
    },
    {
      href: ROUTES.CUSTOMERS,
      label: 'Customers',
      icon: FaUserFriends,
      active: cleanPath === '/customers' || cleanPath === '/customers/',
    },
    {
      href: ROUTES.REVIEWS,
      label: 'Reviews',
      icon: FaStar,
      active: cleanPath === '/reviews' || cleanPath === '/reviews/',
    },
    {
      href: ROUTES.WARRANTY_CHECK,
      label: 'Warranty Check',
      icon: FaShieldAlt,
      active: cleanPath === '/warranty-check',
    },
    {
      href: ROUTES.DEALERS,
      label: 'Dealers',
      icon: FaHandshake,
      active: cleanPath === '/dealers' || cleanPath === '/dealers/',
    },
  ];

  const meetupsItem = {
    href: ROUTES.MEETUPS,
    label: 'Meetups',
    icon: FaCalendarAlt,
    active: cleanPath === '/meetups',
  };

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
        const response = await fetch('/api/storeDetail');
        const result = await response.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          setStoreDetail(result.data[0]);
          setStoreData(result.data[0]);
        } else {
          setStoreDetail({ storeName: 'Store' });
          setStoreData({ storeName: '' });
        }
      } catch (error) {
        console.error('Error fetching store details:', error);
        setStoreDetail({ storeName: 'Store' });
        setStoreData({ storeName: '' });
      }
    };

    const fetchPendingReviewsCount = async () => {
      try {
        const response = await fetch('/api/reviews?admin=true');
        if (response.ok) {
          const data = await response.json();
          const pendingCount = data.reviews.filter(
            (review: any) => review.approved !== true
          ).length;
          setPendingReviewsCount(pendingCount);
        }
      } catch (error) {
        console.error('Error fetching pending reviews count:', error);
      }
    };

    fetchStoreDetail();
    fetchPendingReviewsCount();

    const handleReviewsUpdate = () => {
      fetchPendingReviewsCount();
    };

    window.addEventListener('reviewsUpdated', handleReviewsUpdate);
    return () => {
      window.removeEventListener('reviewsUpdated', handleReviewsUpdate);
    };
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

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
      (window as any).requestIdleCallback(prefetchAll, { timeout: 2000 });
    } else {
      setTimeout(prefetchAll, 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      document.body.style.overflow = 'hidden';
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
      const isCreating = !storeDetail || !storeDetail._id;
      let data = { ...storeData };
      data.storeName = storeData.storeName;

      if (isCreating) {
        const response: any = await POST('api/storeDetail', data);
        if (response?.message) {
          toast.success('Store detail created successfully');
          const updatedResponse = await fetch('/api/storeDetail');
          const updatedStore = await updatedResponse.json();
          if (
            updatedStore.success &&
            Array.isArray(updatedStore.data) &&
            updatedStore.data.length > 0
          ) {
            setStoreDetail(updatedStore.data[0]);
            setStoreData(updatedStore.data[0]);
          }
        }
        if (response?.error) toast.error(response?.error);
      } else {
        data._id = storeDetail._id;
        const response: any = await POST('api/storeDetail', data);
        if (response?.message) {
          toast.success(response?.message);
          const updatedResponse = await fetch('/api/storeDetail');
          const updatedStore = await updatedResponse.json();
          if (
            updatedStore.success &&
            Array.isArray(updatedStore.data) &&
            updatedStore.data.length > 0
          ) {
            setStoreDetail(updatedStore.data[0]);
            setStoreData(updatedStore.data[0]);
          }
        }
        if (response?.error) toast.error(response?.error);
      }

      setIsLoading(false);
      setIsModalOpen(false);
    } catch (error) {
      setIsLoading(false);
      toast.error('Failed to save store detail');
    }
  };

  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setStoreData((prevStore: any) => ({ ...prevStore, [name]: value }));
    },
    []
  );

  const sidebarContent = (
    <>
      {/* Mobile Header with Close Button */}
      <div className='flex items-center justify-between p-4 md:hidden'>
        <span className='text-lg font-semibold' style={{ color: 'white' }}>
          {storeDetail?.storeName || 'Store'}
        </span>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className='rounded-full p-2'
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <HiX className='h-5 w-5' style={{ color: 'white' }} />
        </button>
      </div>

      <div
        className='flex flex-col p-4'
        style={{ height: '100%', justifyContent: 'space-between' }}
      >
        {/* Top section */}
        <div className='flex flex-col'>
          {/* Store Name - Desktop Only */}
          <span
            className='mb-6 hidden text-center font-semibold md:block'
            style={{
              color: 'white',
              fontSize: isCollapsed ? '14px' : '20px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'font-size 300ms ease',
            }}
          >
            {isCollapsed ? storeInitials : storeDetail?.storeName || ''}
          </span>

          {/* Navigation Links */}
          <div className='flex flex-col gap-1'>
            {navigationItems.map((item: NavigationItem) => {
              const Icon = item.icon;
              const isReviewsItem = item.href === ROUTES.REVIEWS;
              const hasPendingReviews = isReviewsItem && pendingReviewsCount > 0;

              return (
                <Link
                  key={item.href || item.label}
                  href={item.href || '#'}
                  className='sidebarItem relative flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200'
                  style={item.active ? ACTIVE_STYLE : INACTIVE_STYLE}
                >
                  <Icon
                    className='h-6 w-6 flex-shrink-0'
                    style={{ color: 'white' }}
                  />
                  <span
                    style={{
                      color: 'white',
                      fontWeight: item.active ? 600 : 400,
                      maxWidth: isCollapsed ? '0px' : '200px',
                      opacity: isCollapsed ? 0 : 1,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      marginLeft: isCollapsed ? '0px' : '12px',
                      transition: 'max-width 300ms ease, opacity 250ms ease, margin-left 300ms ease',
                    }}
                  >
                    {item.label}
                  </span>

                  {hasPendingReviews && (
                    <div className='absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full border-2 border-white bg-blue-500' />
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom section */}
        <div className='flex flex-col gap-1'>
          {/* Meetups */}
          <Link
            href={`${basePath || ''}${meetupsItem.href || '#'}`}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200'
            style={meetupsItem.active ? ACTIVE_STYLE : INACTIVE_STYLE}
          >
            <meetupsItem.icon
              className='h-6 w-6 flex-shrink-0'
              style={{ color: 'white' }}
            />
            <span
              style={{
                color: 'white',
                fontWeight: meetupsItem.active ? 600 : 400,
                maxWidth: isCollapsed ? '0px' : '200px',
                opacity: isCollapsed ? 0 : 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                marginLeft: isCollapsed ? '0px' : '12px',
                transition: 'max-width 300ms ease, opacity 250ms ease, margin-left 300ms ease',
              }}
            >
              {meetupsItem.label}
            </span>
          </Link>

          {/* Settings */}
          <button
            onClick={() => {
              setIsModalOpen(true);
              setIsMobileMenuOpen(false);
            }}
            title={
              storeDetail?._id
                ? 'Update Store Details'
                : 'Configure Store Details'
            }
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200'
            style={INACTIVE_STYLE}
          >
            <IoMdSettings
              className='h-6 w-6 flex-shrink-0'
              style={{ color: 'white' }}
            />
            <span
              style={{
                color: 'white',
                fontWeight: 500,
                maxWidth: isCollapsed ? '0px' : '200px',
                opacity: isCollapsed ? 0 : 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                marginLeft: isCollapsed ? '0px' : '12px',
                transition: 'max-width 300ms ease, opacity 250ms ease, margin-left 300ms ease',
              }}
            >
              Settings
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={() => {
              Cookies.remove('userId');
              Cookies.remove('dashboard-unlocked');
              signOut({ callbackUrl: ROUTES.SIGNIN });
            }}
            className='sidebarItem flex touch-manipulation items-center rounded-lg p-3 transition-all duration-200'
            style={INACTIVE_STYLE}
          >
            <IoLogOut
              className='h-6 w-6 flex-shrink-0'
              style={{ color: 'white' }}
            />
            <span
              style={{
                color: 'white',
                fontWeight: 500,
                maxWidth: isCollapsed ? '0px' : '200px',
                opacity: isCollapsed ? 0 : 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                marginLeft: isCollapsed ? '0px' : '12px',
                transition: 'max-width 300ms ease, opacity 250ms ease, margin-left 300ms ease',
              }}
            >
              Logout
            </span>
          </button>
        </div>
      </div>
    </>
  );

  if (path === ROUTES.SIGNIN) {
    return null;
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className='fixed left-4 top-4 z-50 rounded-lg bg-sidebar-gradient p-2 shadow-lg md:hidden'
      >
        <RiMenuUnfoldLine className='h-6 w-6' style={{ color: 'white' }} />
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
          hidden h-svh bg-sidebar-gradient shadow-lg
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
          className='absolute -right-3 top-9 z-50 hidden rounded-full bg-sidebar-gradient p-1.5 shadow-md hover:opacity-80 md:block'
        >
          {isCollapsed ? (
            <RiMenuUnfoldLine className='h-4 w-4' style={{ color: 'white' }} />
          ) : (
            <RiMenuFoldLine className='h-4 w-4' style={{ color: 'white' }} />
          )}
        </button>

        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        id='sidebar'
        className={`
          fixed left-0 top-0 z-50 h-full w-80 max-w-[85vw] bg-sidebar-gradient shadow-lg transition-transform duration-300 ease-in-out md:hidden
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
                value={storeData?.storeName || ''}
                onChange={handleChange}
                required
                placeholder='Enter your store name'
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