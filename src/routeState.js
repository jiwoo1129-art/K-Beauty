const DEFAULT_BASE = import.meta.env?.BASE_URL || '/';

export function basePath(base = DEFAULT_BASE) {
  if (!base || base === '/' || base === './') return '';
  return `/${String(base).replace(/^\/+|\/+$/g, '')}`;
}

export function routeHref(pathname = '/', base = DEFAULT_BASE) {
  const prefix = basePath(base);
  const path = `/${String(pathname).replace(/^\/+/, '')}`;
  return path === '/' ? `${prefix}/` || '/' : `${prefix}${path}`;
}

export function normalizeRoute(pathname = '/', base = DEFAULT_BASE) {
  const prefix = basePath(base);
  const withoutBase = prefix && (pathname === prefix || pathname.startsWith(`${prefix}/`)) ? pathname.slice(prefix.length) || '/' : pathname;
  const path = withoutBase.replace(/\/+$/, '') || '/';
  if (path === '/write') return 'write';
  if (path === '/validate') return 'validate';
  return 'home';
}

export function navigateTo(pathname) {
  const target = routeHref(pathname);
  if (window.location.pathname === target) return;
  window.history.pushState({}, '', target);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
