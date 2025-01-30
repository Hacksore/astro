import type * as vite from 'vite';
import type { AstroSettings } from '../types/astro.js';

import { collapseDuplicateTrailingSlashes, hasFileExtension } from '@astrojs/internal-helpers/path';
import { trailingSlashMismatchTemplate } from '../template/4xx.js';
import { writeHtmlResponse, writeRedirectResponse } from './response.js';

export function trailingSlashMiddleware(settings: AstroSettings): vite.Connect.NextHandleFunction {
	const { trailingSlash } = settings.config;

	return function devTrailingSlash(req, res, next) {
		const url = req.url!;

		const destination = collapseDuplicateTrailingSlashes(url, true);
		if (url && destination !== url) {
			return writeRedirectResponse(res, 301, destination);
		}
		let pathname: string;
		try {
			pathname = decodeURI(new URL(url, 'http://localhost').pathname);
		} catch (e) {
			/* malformed uri */
			return next(e);
		}
		if(pathname.startsWith('/_') || pathname.startsWith('/@')) {
			return next();
		}
		if (
			(trailingSlash === 'never' && pathname.endsWith('/') && pathname !== '/') ||
			(trailingSlash === 'always' && !pathname.endsWith('/') && !hasFileExtension(pathname))
		) {
			const html = trailingSlashMismatchTemplate(pathname, trailingSlash);
			return writeHtmlResponse(res, 404, html);
		}
		return next();
	};
}
