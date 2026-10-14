import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { syncDocumentTheme } from '../../theme/siteTheme';
import HalloweenFX from './HalloweenFX';
import ThemePreviewBadge from './ThemePreviewBadge';

/** Mount once inside the Router: keeps <html data-theme> in sync with the route and renders theme chrome. */
const SiteThemeLayer = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    syncDocumentTheme(pathname);
  }, [pathname]);

  return (
    <>
      <HalloweenFX />
      <ThemePreviewBadge />
    </>
  );
};

export default SiteThemeLayer;
