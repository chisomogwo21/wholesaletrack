import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_TITLES = {
  '/': 'Track order — WholesaleTrack',
  '/orders': 'Orders — WholesaleTrack',
  '/products': 'Products — WholesaleTrack',
  '/customers': 'Customers — WholesaleTrack',
  '/suppliers': 'Suppliers — WholesaleTrack',
  '/login': 'Sign in — WholesaleTrack',
};

export function usePageTitle(customTitle) {
  const location = useLocation();

  useEffect(() => {
    if (customTitle) {
      document.title = `${customTitle} — WholesaleTrack`;
    } else if (ROUTE_TITLES[location.pathname]) {
      document.title = ROUTE_TITLES[location.pathname];
    } else if (location.pathname.startsWith('/orders/')) {
      document.title = 'Order details — WholesaleTrack';
    } else {
      document.title = 'WholesaleTrack';
    }
  }, [customTitle, location.pathname]);
}

export function TitleUpdater() {
  usePageTitle();
  return null;
}

export default usePageTitle;
