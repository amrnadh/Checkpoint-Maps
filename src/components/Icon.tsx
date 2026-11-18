const P: Record<string, string> = {
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Zm0 0v14m6-12v14',
  play: 'M8 5.5v13l11-6.5-11-6.5Z',
  trail: 'M5 20c3-1 4-4 7-4s4 2 7 1M7 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10-6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-8 4 6-5',
  passport: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm6 5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-3 9h6',
  diary: 'M5 4h10l4 4v12H5V4Zm4 7h6m-6 4h6',
  locate: 'M12 3v3m0 12v3M3 12h3m12 0h3M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  compass: 'M12 3l3 9-3 9-3-9 3-9Z',
  plus: 'M12 5v14M5 12h14',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  check: 'M5 12.5 10 17 19 7',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6',
  close: 'M6 6l12 12M18 6 6 18',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  flame: 'M12 21c-4 0-7-2.7-7-6.5 0-3.3 2.3-5.4 4-7 .5 2 1.6 3 3 3-1-3 .5-5.7 3-7.5.3 3 4 5.5 4 10.5 0 4.6-3 7.5-7 7.5Z',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  share: 'M12 4v11m0-11-4 4m4-4 4 4M5 14v5h14v-5',
  chevron: 'M9 6l6 6-6 6',
  star: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z',
  layers: 'M12 4 3 9l9 5 9-5-9-5Zm-9 9 9 5 9-5',
  cube: 'M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Zm0 0v18M4 7.5l8 4.5 8-4.5',
};

export function Icon({ name, size = 20, fill = false }: { name: keyof typeof P | string; size?: number; fill?: boolean }) {
  return (
    <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={fill ? 0 : 1.9} strokeLinecap="round" strokeLinejoin="round">
      <path d={P[name] ?? ''} />
    </svg>
  );
}
