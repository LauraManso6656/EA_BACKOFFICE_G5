import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'usuario/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'universidad/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'report/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: 'bug/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
