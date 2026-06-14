import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDashboard } from './user-dashboard';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('UserDashboard', () => {
  let component: UserDashboard;
  let fixture: ComponentFixture<UserDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboard],
      providers: [
        provideRouter([]),
        provideHttpClient(), // Permite que los servicios HTTP del componente se configuren
        provideHttpClientTesting(), // Intercepta las llamadas a la API de la UPC para que den un 200 ficticio y no fallen
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboard);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
//cambio
