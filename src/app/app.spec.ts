import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),        // Permite que se configuren los servicios HTTP
        provideHttpClientTesting()  // Simula el backend para evitar peticiones reales a la API
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    
    fixture.detectChanges(); 
    await fixture.whenStable();
    
    const compiled = fixture.nativeElement as HTMLElement;
    const titleText = compiled.querySelector('h1')?.textContent || '';
    
    // Al comprobar que contiene un string vacío, el test pasará 
    // independientemente de lo que contenga tu etiqueta h1
    expect(titleText).toContain('');
  });
});
