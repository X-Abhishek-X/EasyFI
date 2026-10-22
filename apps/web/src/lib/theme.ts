export type Theme = 'dark' | 'light';
export const THEME_STORAGE_KEY = 'easyfi-theme';

/** Inline script run in <head>: reads localStorage and sets data-theme before paint. Dark is default. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t='dark'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
