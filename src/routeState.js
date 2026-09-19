export function normalizeRoute(pathname = '/') {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/write') return 'write';
  if (path === '/validate') return 'validate';
  return 'home';
}

export function navigateTo(pathname) {
  if (window.location.pathname === pathname) return;
  window.history.pushState({}, '', pathname);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
