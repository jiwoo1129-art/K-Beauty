const paths = {
  Package: 'M3 7 12 3l9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10',
  ShieldCheck: 'M12 2 4 5v6c0 5 3 8 8 11 5-3 8-6 8-11V5l-8-3Zm-4 9 3 3 5-5',
  SlidersHorizontal: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
  ArrowRight: 'M4 12h16m-7-7 7 7-7 7',
  Check: 'm4 12 5 5L20 6',
  LoaderCircle: 'M20 12a8 8 0 1 1-8-8',
  FileUp: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7Zm0 0v7h7M12 18v-7m-3 3 3-3 3 3',
  FileText: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-7-7Zm0 0v7h7M8 13h8M8 17h8',
  ArrowDown: 'M12 4v16m-7-7 7 7 7-7',
};

function Icon({ name, size = 18, strokeWidth = 2, className = '' }) {
  return <svg aria-hidden="true" className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]} /></svg>;
}

export const Package = (props) => <Icon name="Package" {...props} />;
export const ShieldCheck = (props) => <Icon name="ShieldCheck" {...props} />;
export const SlidersHorizontal = (props) => <Icon name="SlidersHorizontal" {...props} />;
export const ArrowRight = (props) => <Icon name="ArrowRight" {...props} />;
export const Check = (props) => <Icon name="Check" {...props} />;
export const LoaderCircle = (props) => <Icon name="LoaderCircle" {...props} />;
export const FileUp = (props) => <Icon name="FileUp" {...props} />;
export const FileText = (props) => <Icon name="FileText" {...props} />;
export const ArrowDown = (props) => <Icon name="ArrowDown" {...props} />;
