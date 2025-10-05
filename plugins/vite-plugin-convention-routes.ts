import fs from 'fs/promises';
import { glob } from 'glob';
import path from 'path';
import type { Plugin } from 'vite';

// --- Interfaces de Tipagem ---

interface ConventionRoutesOptions {
    /** @default 'src/pages' */
    pagesDir?: string;
    /** @default 'src/generated/routes.tsx' */
    routesFile?: string;
    /** Padrões de exclusão adicionais para o glob. */
    excludePatterns?: string | string[];
}

interface RouteNode {
    type: 'route';
    path: string;
    element: string; // O nome do componente gerado (ex: P_abc123)
    isIndex: boolean;
    filePath: string;
}

interface GroupNode {
    type: 'group';
    physicalName: string;
    routeSegment: string;
    children: RouteTree;
    isInvisible: boolean;
}

type TreeNode = RouteNode | GroupNode;
type RouteTree = Map<string, TreeNode>;


// --- Lógica Principal do Plugin ---

const generateRoutes = async (
    pagesDir: string,
    routesFile: string,
    excludePatterns: string | string[] = [],
): Promise<void> => {
    try {
        const routesDir = path.dirname(routesFile);
        await fs.mkdir(routesDir, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }

    const defaultIgnore = ['**/_*.jsx', '**/_*.tsx', '**/layout.*', '**/loading.*', '**/__*/**'];
    const ignore = [
        ...defaultIgnore,
        ...(Array.isArray(excludePatterns) ? excludePatterns : [excludePatterns]),
    ].filter(Boolean);

    const files = await glob('**/*.{jsx,tsx}', {
        cwd: pagesDir,
        ignore,
    });

    const imports = new Set<string>();
    const routesMap: RouteTree = new Map();
    const preloadMap = new Map<string, string>();

    // Adiciona imports essenciais
    imports.add(`import { lazy, Suspense } from 'react';`);
    imports.add(`import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';`);

    const isInvisibleFolder = (folderName: string): boolean =>
        folderName.startsWith('(') && folderName.endsWith(')');

    // Processar cada arquivo de página
    for (const file of files) {
        const routePath = fileToRoutePath(file);
        const importPath = path.join(pagesDir, file);
        const normalizedImportPath = normalizePath(importPath);
        const componentName = `P_${generateRandomId()}`;

        imports.add(`const ${componentName} = lazy(() => import('${normalizedImportPath}'));`);
        preloadMap.set(routePath, `() => import('${normalizedImportPath}')`);

        const segments = file.split(path.sep);
        const isIndex = path.parse(segments[segments.length - 1]).name === 'index';

        let currentLevel = routesMap;

        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            const isFile = i === segments.length - 1;

            if (isFile) {
                const routePathSegment = isIndex ? '' : segment.replace(/\.(jsx|tsx)$/, '').replace(/\[(\w+)\]/g, ':$1');
                currentLevel.set(segment, {
                    type: 'route',
                    path: routePathSegment,
                    element: componentName,
                    isIndex,
                    filePath: file,
                });
            } else {
                const isInvisible = isInvisibleFolder(segment);
                const routeSegment = isInvisible ? '' : segment.replace(/\[(\w+)\]/g, ':$1');

                if (!currentLevel.has(segment)) {
                    currentLevel.set(segment, {
                        type: 'group',
                        physicalName: segment,
                        routeSegment,
                        children: new Map(),
                        isInvisible,
                    });
                }
                const nextGroup = currentLevel.get(segment) as GroupNode;
                currentLevel = nextGroup.children;
            }
        }
    }

    // Gerar estrutura de rotas
    const generateRouteStructure = async (map: RouteTree, parentPhysicalPath: string = ''): Promise<string> => {
        const routes: string[] = [];

        for (const [physicalName, value] of map) {
            if (value.type === 'route') {
                routes.push(value.isIndex
                    ? `{ index: true, element: <${value.element} /> }`
                    : `{ path: '${value.path}', element: <${value.element} /> }`
                );
            } else if (value.type === 'group') {
                const groupPhysicalPath = path.join(parentPhysicalPath, physicalName);
                const groupRoutePath = value.routeSegment;

                // --- NOVA LÓGICA: Verificar por arquivos de layout e loading ---
                const { componentName: layoutName, path: layoutPath } = await findComponent(pagesDir, groupPhysicalPath, 'layout');
                const { componentName: loadingName, path: loadingPath } = await findComponent(pagesDir, groupPhysicalPath, 'loading');

                if (layoutName && layoutPath) {
                    const normalizedLayoutPath = normalizePath(layoutPath);
                    imports.add(`const ${layoutName} = lazy(() => import('${normalizedLayoutPath}'));`);
                    preloadMap.set(groupPhysicalPath, `() => import('${normalizedLayoutPath}')`);
                }

                if (loadingName && loadingPath) {
                    const normalizedLoadingPath = normalizePath(loadingPath);
                    imports.add(`const ${loadingName} = lazy(() => import('${normalizedLoadingPath}'));`);
                }

                const childRoutes = await generateRouteStructure(value.children, groupPhysicalPath);

                // Monta o elemento, aplicando Suspense se houver um loading
                let elementJsx = layoutName ? `<${layoutName} />` : (childRoutes.trim() ? `<Outlet />` : '');
                if (loadingName && elementJsx) {
                    elementJsx = `<Suspense fallback={<${loadingName} />}>${elementJsx}</Suspense>`;
                }

                // Cria o objeto da rota
                if (value.isInvisible) {
                    if (elementJsx) {
                        routes.push(`{ element: ${elementJsx}, children: [ ${childRoutes} ] }`);
                    } else if (childRoutes.trim()) {
                        routes.push(childRoutes);
                    }
                } else {
                    const routeObjectParts: string[] = [`path: '${groupRoutePath}'`];
                    if (elementJsx) {
                        routeObjectParts.push(`element: ${elementJsx}`);
                    }
                    if (childRoutes.trim()) {
                        routeObjectParts.push(`children: [ ${childRoutes} ]`);
                    }
                    if (routeObjectParts.length > 1) {
                        routes.push(`{ ${routeObjectParts.join(',\n')} }`);
                    }
                }
            }
        }
        return routes.filter(Boolean).join(',\n');
    };

    // Estrutura principal
    const { componentName: rootLayoutName, path: rootLayoutPath } = await findComponent(pagesDir, '', 'layout');
    let routesCode = await generateRouteStructure(routesMap, '');

    // Aplicar layout e loading raiz
    if (rootLayoutName && rootLayoutPath) {
        const normalizedRootLayoutPath = normalizePath(rootLayoutPath);
        imports.add(`const ${rootLayoutName} = lazy(() => import('${normalizedRootLayoutPath}'));`);
        preloadMap.set('/', `() => import('${normalizedRootLayoutPath}')`);

        const { componentName: rootLoadingName, path: rootLoadingPath } = await findComponent(pagesDir, '', 'loading');
        if (rootLoadingName && rootLoadingPath) {
            const normalizedRootLoadingPath = normalizePath(rootLoadingPath);
            imports.add(`const ${rootLoadingName} = lazy(() => import('${normalizedRootLoadingPath}'));`);
        }

        const rootElement = rootLoadingName
            ? `<Suspense fallback={<${rootLoadingName} />}><${rootLayoutName} /></Suspense>`
            : `<${rootLayoutName} />`;

        routesCode = `{
      path: '/',
      element: ${rootElement},
      children: [
        ${routesCode}
      ]
    }`;
    }

    // Geração do código final
    const preloadMapCode = `export const routePreloadMap = new Map<string, () => Promise<any>>([\n${Array.from(
        preloadMap.entries()
    )
        .map(([route, importFn]) => `  ['/${route.replace(/[/\\]index$/, '') || ''}', ${importFn}]`)
        .join(',\n')}\n]);`;

    const preloadFunctionCode = `
export function preloadRoute(path: string): void {
  const connection = (navigator as any).connection;
  const canPreload = !connection?.saveData && connection?.effectiveType !== 'slow-2g';
  if (!canPreload) return;

  const route = normalizeRoutePath(path);
  const preloader = routePreloadMap.get(route);

  if (preloader) {
    preloader().catch(error => {
      console.error('Route preload failed:', error);
    });
  }
}

function normalizeRoutePath(path: string): string {
  let normalized = path.split('?')[0].split('#')[0];
  if (!normalized.startsWith('/')) {
    normalized = '/' + normalized;
  }
  return normalized.replace(/\\/$/, '') || '/';
}`;

    const outputContent = `// ARQUIVO GERADO AUTOMATICAMENTE - NÃO EDITAR MANUALMENTE
// prettier-ignore
/* eslint-disable */
import type { RouteObject } from 'react-router-dom';
${Array.from(imports).join('\n')}

${preloadMapCode}

const routeObjects: RouteObject[] = [
  ${routesCode},
  { path: '*', element: <Navigate to="/404" replace /> }
];

export const routes = createBrowserRouter(routeObjects);

${preloadFunctionCode}

export default routes;
`;

    await fs.writeFile(routesFile, outputContent);
};


// --- Funções Utilitárias ---

const fileToRoutePath = (filePath: string): string => {
    return filePath
        .replace(/\.(jsx|tsx)$/, '')
        .replace(/[/\\]index$/, '')
        .replace(/\[(\w+)\]/g, ':$1');
};

const fileExists = async (filePath: string): Promise<boolean> => {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
};

const normalizePath = (pathStr: string): string => {
    return pathStr.replace(/\\/g, '/');
};

const generateRandomId = (): string => Math.random().toString(36).substring(2, 9);

/**
 * Encontra um componente (layout, loading) em um diretório e retorna seu nome e caminho.
 */
const findComponent = async (baseDir: string, groupPath: string, componentName: 'layout' | 'loading'): Promise<{ componentName: string | null, path: string | null }> => {
    const jsxPath = path.join(baseDir, groupPath, `${componentName}.jsx`);
    const tsxPath = path.join(baseDir, groupPath, `${componentName}.tsx`);

    if (await fileExists(jsxPath)) {
        return { componentName: `${componentName.charAt(0).toUpperCase()}_${generateRandomId()}`, path: jsxPath };
    }
    if (await fileExists(tsxPath)) {
        return { componentName: `${componentName.charAt(0).toUpperCase()}_${generateRandomId()}`, path: tsxPath };
    }
    return { componentName: null, path: null };
}


// --- Exportação do Plugin Vite ---

export const conventionRoutes = (options: ConventionRoutesOptions = {}): Plugin => {
    const {
        pagesDir = 'src/pages',
        routesFile = 'src/generated/routes.tsx', // Alterado para .tsx
        excludePatterns = [],
    } = options;

    const resolvedPagesDir = path.resolve(process.cwd(), pagesDir);

    return {
        name: 'vite-plugin-convention-routes',
        enforce: 'pre',

        async buildStart() {
            await generateRoutes(pagesDir, routesFile, excludePatterns);
        },

        configureServer(server) {
            const watcher = async (filePath: string) => {
                if (filePath.startsWith(resolvedPagesDir)) {
                    console.log(`[convention-routes] Regenerating routes due to change in: ${path.relative(process.cwd(), filePath)}`);
                    await generateRoutes(pagesDir, routesFile, excludePatterns);
                    server.ws.send({ type: 'full-reload' });
                }
            };

            server.watcher.on('add', watcher);
            server.watcher.on('unlink', watcher);
            server.watcher.on('change', watcher); // Adicionado para capturar alterações em layouts/loadings
        },
    };
};

export default conventionRoutes;